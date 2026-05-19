import time

from app.models.certificate import TLSCertificate
from app.models.user import User
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import desc

report_bp = Blueprint("report_bp", __name__)


def _certificate_has_issues(cert: TLSCertificate) -> bool:
    return bool(cert.issues)


def _get_certificate_query_for_user(user: User, user_id: int):
    query = TLSCertificate.query.filter(TLSCertificate.user_id == user_id)
    return query


@report_bp.route("/visits", methods=["GET"])
@jwt_required()
def get_visit_history():
    domain_filter = request.args.get("domain")
    limit = int(request.args.get("limit", 100))
    offset = int(request.args.get("offset", 0))
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    has_issues = request.args.get("has_issues")
    user_id = int(get_jwt_identity())
    user: User | None = User.query.get(user_id)

    if user is None:
        return jsonify({"message": "user no longer exists"}), 404

    query = _get_certificate_query_for_user(user, user_id)

    if start_date:
        try:
            query = query.filter(TLSCertificate.visited_at >= float(start_date))
        except ValueError:
            return jsonify({"error": "Invalid start_date format"}), 400

    if end_date:
        try:
            query = query.filter(TLSCertificate.visited_at <= float(end_date))
        except ValueError:
            return jsonify({"error": "Invalid end_date format"}), 400

    query = query.order_by(desc(TLSCertificate.visited_at))
    certs = query.all()

    if domain_filter:
        domain_filter_lower = domain_filter.lower()
        certs = [
            cert
            for cert in certs
            if domain_filter_lower in cert.domain_name().lower()
            or domain_filter_lower in cert.subject_name.lower()
            or domain_filter_lower in cert.issuer.lower()
        ]

    if has_issues is not None:
        has_issues_bool = has_issues.lower() == "true"
        certs = [cert for cert in certs if _certificate_has_issues(cert) == has_issues_bool]

    total_count = len(certs)
    paged_certs = certs[offset : offset + limit]

    return jsonify(
        {
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "visits": [cert.to_report_dict() for cert in paged_certs],
        }
    ), 200


@report_bp.route("/visits/<int:certificate_id>", methods=["GET"])
@jwt_required()
def get_visit_detail(certificate_id: int):
    user_id = int(get_jwt_identity())
    user: User | None = User.query.get(user_id)
    cert: TLSCertificate | None = TLSCertificate.query.get(certificate_id)

    if user is None:
        return jsonify({"message": "user no longer exists"}), 404
    elif cert is None or (cert.user_id != user_id):
        return jsonify({"message": "certificate not found"}), 404

    return jsonify(cert.to_report_dict()), 200


@report_bp.route("/domains/stats", methods=["GET"])
@jwt_required()
def get_domain_stats():
    end_date = time.time()
    start_date = end_date - (30 * 24 * 60 * 60)
    user_id = int(get_jwt_identity())
    user: User | None = User.query.get(user_id)
    
    if user is None:
        return jsonify({"message": "user no longer exists"}), 404

    start_param = request.args.get("start_date")
    end_param = request.args.get("end_date")

    if start_param:
        try:
            start_date = float(start_param)
        except ValueError:
            return jsonify({"error": "Invalid start_date"}), 400

    if end_param:
        try:
            end_date = float(end_param)
        except ValueError:
            return jsonify({"error": "Invalid end_date"}), 400

    certs = (
        _get_certificate_query_for_user(user, user_id)
        .filter(
            TLSCertificate.visited_at >= start_date,
            TLSCertificate.visited_at <= end_date,
        )
        .all()
    )

    total_visits = len(certs)
    unique_domains = len({cert.domain_name() for cert in certs})
    visits_with_issues = sum(1 for cert in certs if _certificate_has_issues(cert))
    clean_visits = total_visits - visits_with_issues

    domain_counts: dict[str, int] = {}
    for cert in certs:
        domain = cert.domain_name() or "unknown"
        domain_counts[domain] = domain_counts.get(domain, 0) + 1

    top_domains = sorted(domain_counts.items(), key=lambda item: item[1], reverse=True)[
        :10
    ]

    issue_counts: dict[str, int] = {}
    for cert in certs:
        for issue in cert.to_report_dict()["issues_found"]:
            issue_counts[issue] = issue_counts.get(issue, 0) + 1

    return jsonify(
        {
            "period": {
                "start_date": start_date,
                "end_date": end_date,
                "days": round((end_date - start_date) / (24 * 60 * 60), 1),
            },
            "summary": {
                "total_visits": total_visits,
                "unique_domains": unique_domains,
                "visits_with_issues": visits_with_issues,
                "clean_visits": clean_visits,
                "issue_rate": round(visits_with_issues / total_visits * 100, 1)
                if total_visits > 0
                else 0,
            },
            "top_domains": [
                {"domain": domain, "visits": count} for domain, count in top_domains
            ],
            "issue_breakdown": issue_counts,
        }
    ), 200