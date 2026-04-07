import time
from flask import Blueprint, request, jsonify
from app import db
from app.models.certificate import (
    TLSCertificate,
    SANEntry,
    SignedCertificateTimestamp,
    CertificateTransparencyCompliance,
)

certificate_bp = Blueprint("certificate_bp", __name__)

WEAK_CIPHERS = {"RC4", "DES", "3DES", "NULL", "EXPORT", "MD5"}
WEAK_PROTOCOLS = {"SSL 2.0", "SSL 3.0", "TLS 1.0", "TLS 1.1"}


def _build_cert(data):
    cert = TLSCertificate(
        protocol=data["protocol"],
        key_exchange=data["keyExchange"],
        key_exchange_group=data.get("keyExchangeGroup"),
        cipher=data["cipher"],
        mac=data.get("mac"),
        certificate_id=data["certificateId"],
        subject_name=data["subjectName"],
        issuer=data["issuer"],
        valid_from=data["validFrom"],
        valid_to=data["validTo"],
        certificate_transparency_compliance=CertificateTransparencyCompliance(
            data["certificateTransparencyCompliance"]
        ),
        server_signature_algorithm=data.get("serverSignatureAlgorithm"),
        encrypted_client_hello=data.get("encryptedClientHello", False),
    )
    for san in data.get("sanList", []):
        cert.san_entries.append(SANEntry(name=san))

    for sct_data in data.get("signedCertificateTimestampList", []):
        cert.sct_list.append(
            SignedCertificateTimestamp(
                status=sct_data["status"],
                origin=sct_data["origin"],
                log_description=sct_data.get("logDescription"),
                log_id=sct_data.get("logId"),
                timestamp=sct_data["timestamp"],
                hash_algorithm=sct_data.get("hashAlgorithm"),
                signature_algorithm=sct_data.get("signatureAlgorithm"),
                signature_data=sct_data.get("signatureData"),
            )
        )
    return cert


def _evaluate_cert(cert):
    now = time.time()
    days_until_expiry = (cert.valid_to - now) / 86400

    issues = []
    if cert.valid_to < now:
        issues.append("expired")
    elif days_until_expiry < 30:
        issues.append("expiring_soon")

    if cert.protocol in WEAK_PROTOCOLS:
        issues.append("weak_protocol")

    if any(w in cert.cipher.upper() for w in WEAK_CIPHERS):
        issues.append("weak_cipher")

    if cert.certificate_transparency_compliance == CertificateTransparencyCompliance.not_compliant:
        issues.append("not_ct_compliant")

    return {
        "is_expired": cert.valid_to < now,
        "days_until_expiry": round(days_until_expiry, 1),
        "issues": issues,
        "pass": len(issues) == 0,
    }


@certificate_bp.route("/", methods=["GET"])
def get_all():
    certs = TLSCertificate.query.all()
    return jsonify([c.to_dict() for c in certs]), 200


@certificate_bp.route("/<int:cert_id>", methods=["GET"])
def get_one(cert_id):
    cert = TLSCertificate.query.get_or_404(cert_id)
    return jsonify(cert.to_dict()), 200


@certificate_bp.route("/", methods=["POST"])
def create():
    data = request.get_json(force=True)
    cert = _build_cert(data)
    db.session.add(cert)
    db.session.commit()
    return jsonify(cert.to_dict()), 201


@certificate_bp.route("/<int:cert_id>", methods=["DELETE"])
def delete(cert_id):
    cert = TLSCertificate.query.get_or_404(cert_id)
    db.session.delete(cert)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200


@certificate_bp.route("/batch", methods=["POST"])
def batch_create():
    data = request.get_json(force=True)
    entries = data.get("certificates", [])
    if not entries:
        return jsonify({"error": "No certificates provided"}), 400

    created_ids = []
    for entry in entries:
        cert = _build_cert(entry)
        db.session.add(cert)
        db.session.flush()
        created_ids.append(cert.id)

    db.session.commit()
    return jsonify({"created": len(created_ids), "ids": created_ids}), 201


@certificate_bp.route("/expiring", methods=["GET"])
def expiring():
    days = int(request.args.get("days", 30))
    now = time.time()
    cutoff = now + days * 86400

    certs = TLSCertificate.query.filter(
        TLSCertificate.valid_to >= now,
        TLSCertificate.valid_to <= cutoff,
    ).all()

    return jsonify({
        "days_window": days,
        "count": len(certs),
        "certificates": [c.to_dict() for c in certs],
    }), 200


@certificate_bp.route("/expired", methods=["GET"])
def expired():
    now = time.time()
    certs = TLSCertificate.query.filter(TLSCertificate.valid_to < now).all()
    return jsonify({
        "count": len(certs),
        "certificates": [c.to_dict() for c in certs],
    }), 200


@certificate_bp.route("/search", methods=["GET"])
def search():
    query = TLSCertificate.query

    subject = request.args.get("subject")
    if subject:
        query = query.filter(TLSCertificate.subject_name.ilike(f"%{subject}%"))

    issuer = request.args.get("issuer")
    if issuer:
        query = query.filter(TLSCertificate.issuer.ilike(f"%{issuer}%"))

    protocol = request.args.get("protocol")
    if protocol:
        query = query.filter(TLSCertificate.protocol == protocol)

    compliance = request.args.get("compliance")
    if compliance:
        try:
            compliance_enum = CertificateTransparencyCompliance(compliance)
            query = query.filter(
                TLSCertificate.certificate_transparency_compliance == compliance_enum
            )
        except ValueError:
            return jsonify({"error": f"Invalid compliance value: {compliance}"}), 400

    results = query.all()
    return jsonify({
        "count": len(results),
        "certificates": [c.to_dict() for c in results],
    }), 200


@certificate_bp.route("/stats", methods=["GET"])
def stats():
    now = time.time()
    all_certs = TLSCertificate.query.all()

    total = len(all_certs)
    expired_count = sum(1 for c in all_certs if c.valid_to < now)
    expiring_soon = sum(1 for c in all_certs if now <= c.valid_to <= now + 30 * 86400)
    with_issues = sum(1 for c in all_certs if _evaluate_cert(c)["issues"])

    compliance_counts = {}
    for c in all_certs:
        key = c.certificate_transparency_compliance.value
        compliance_counts[key] = compliance_counts.get(key, 0) + 1

    protocol_counts = {}
    for c in all_certs:
        protocol_counts[c.protocol] = protocol_counts.get(c.protocol, 0) + 1

    return jsonify({
        "total": total,
        "expired": expired_count,
        "expiring_within_30_days": expiring_soon,
        "with_issues": with_issues,
        "by_compliance": compliance_counts,
        "by_protocol": protocol_counts,
    }), 200


@certificate_bp.route("/<int:cert_id>/evaluate", methods=["GET"])
def evaluate(cert_id):
    cert = TLSCertificate.query.get_or_404(cert_id)
    findings = _evaluate_cert(cert)
    return jsonify({
        "certificate_id": cert_id,
        "subject": cert.subject_name,
        "issuer": cert.issuer,
        "protocol": cert.protocol,
        "cipher": cert.cipher,
        **findings,
    }), 200
