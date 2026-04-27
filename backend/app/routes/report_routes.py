import time
from flask import Blueprint, request, jsonify
from sqlalchemy import desc
from app import db
from app.models.certificate import TLSCertificate
from app.models.domain_visit import DomainVisit

report_bp = Blueprint("report_bp", __name__)


def _visit_has_issues(visit):
    policy_failed = any(
        not result.get("pass", True)
        for result in (visit.policy_results or [])
    )
    return (not visit.evaluation_passed) or bool(visit.issues_found) or policy_failed


@report_bp.route("/visits", methods=["POST"])
def log_visit():
    data = request.get_json(force=True)

    if not data.get("domain"):
        return jsonify({"error": "domain is required"}), 400

    domain = data["domain"]
    certificate_id = data.get("certificate_id")
    user_agent = data.get("user_agent")
    tab_id = data.get("tab_id")

    cert = None
    if certificate_id:
        cert = TLSCertificate.query.get(certificate_id)

    evaluation_result = {"pass": True, "issues": [], "days_until_expiry": None}
    if cert:
        now = time.time()
        days_until_expiry = (cert.valid_to - now) / 86400
        issues = []

        if cert.valid_to < now:
            issues.append("expired")
        elif days_until_expiry < 30:
            issues.append("expiring_soon")

        WEAK_PROTOCOLS = {"SSL 2.0", "SSL 3.0", "TLS 1.0", "TLS 1.1"}
        WEAK_CIPHERS = {"RC4", "DES", "3DES", "NULL", "EXPORT", "MD5"}

        if cert.protocol in WEAK_PROTOCOLS:
            issues.append("weak_protocol")

        if any(w in cert.cipher.upper() for w in WEAK_CIPHERS):
            issues.append("weak_cipher")

        evaluation_result = {
            "pass": len(issues) == 0,
            "issues": issues,
            "days_until_expiry": round(days_until_expiry, 1),
        }

    visit = DomainVisit.from_certificate_evaluation(
        domain=domain,
        cert=cert,
        evaluation_result=evaluation_result,
        user_agent=user_agent,
        tab_id=tab_id,
    )

    db.session.add(visit)
    db.session.commit()

    return jsonify({
        "visit_id": visit.id,
        "logged_at": visit.visited_at,
        "evaluation": evaluation_result,
        "policy_results": visit.policy_results,
    }), 201


@report_bp.route("/visits", methods=["GET"])
def get_visit_history():
    domain_filter = request.args.get("domain")
    limit = int(request.args.get("limit", 100))
    offset = int(request.args.get("offset", 0))
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    has_issues = request.args.get("has_issues")

    query = DomainVisit.query

    if domain_filter:
        query = query.filter(DomainVisit.domain.ilike(f"%{domain_filter}%"))

    if start_date:
        try:
            start_ts = float(start_date)
            query = query.filter(DomainVisit.visited_at >= start_ts)
        except ValueError:
            return jsonify({"error": "Invalid start_date format"}), 400

    if end_date:
        try:
            end_ts = float(end_date)
            query = query.filter(DomainVisit.visited_at <= end_ts)
        except ValueError:
            return jsonify({"error": "Invalid end_date format"}), 400

    query = query.order_by(desc(DomainVisit.visited_at))

    if has_issues is not None:
        has_issues_bool = has_issues.lower() == "true"
        all_visits = query.all()
        all_visits = [
            visit for visit in all_visits
            if _visit_has_issues(visit) == has_issues_bool
        ]
        total_count = len(all_visits)
        visits = all_visits[offset:offset + limit]
    else:
        total_count = query.count()
        visits = query.offset(offset).limit(limit).all()

    return jsonify({
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "visits": [v.to_dict() for v in visits],
    }), 200


@report_bp.route("/visits/<int:visit_id>", methods=["GET"])
def get_visit_detail(visit_id):
    visit = DomainVisit.query.get_or_404(visit_id)
    return jsonify(visit.to_dict()), 200


@report_bp.route("/domains/stats", methods=["GET"])
def get_domain_stats():
    end_date = time.time()
    start_date = end_date - (30 * 24 * 60 * 60)

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

    visits = DomainVisit.query.filter(
        DomainVisit.visited_at >= start_date,
        DomainVisit.visited_at <= end_date
    ).all()

    total_visits = len(visits)
    unique_domains = len(set(v.domain for v in visits))

    visits_with_issues = sum(1 for v in visits if _visit_has_issues(v))
    clean_visits = total_visits - visits_with_issues

    domain_counts = {}
    for visit in visits:
        domain_counts[visit.domain] = domain_counts.get(visit.domain, 0) + 1

    top_domains = sorted(domain_counts.items(), key=lambda x: x[1], reverse=True)[:10]

    issue_counts = {}
    for visit in visits:
        for issue in visit.issues_found:
            issue_counts[issue] = issue_counts.get(issue, 0) + 1

    return jsonify({
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
            "issue_rate": round(visits_with_issues / total_visits * 100, 1) if total_visits > 0 else 0,
        },
        "top_domains": [{"domain": d, "visits": c} for d, c in top_domains],
        "issue_breakdown": issue_counts,
    }), 200
