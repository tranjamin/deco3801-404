import time
from flask import Blueprint, request, jsonify
from typing import *

from app import db
from app.models.certificate import (
    TLSCertificate,
    SANEntry,
    SignedCertificateTimestamp,
    CertificateTransparencyCompliance,
)

# represents this collection of endpoints
certificate_bp: 'Blueprint' = Blueprint("certificate_bp", __name__)

@certificate_bp.route("/", methods=["GET"])
def get_all():
    """
    API endpoint which retrieves all TLS certificates

    URL:
        /
    Methods Supported:
        GET
    Returns:
        On success: A JSON containing a list of certificates in the format specified by :class:`TLSCertificate` `.to_dict()`, Error code 200
        On failure: TODO
    """
    # TODO: handle any errors
    certs = TLSCertificate.query.all()
    return jsonify([c.to_dict() for c in certs]), 200


@certificate_bp.route("/<int:cert_id>", methods=["GET"])
def get_one(cert_id):
    """
    API endpoint which retrieves a TLS certificate by ID

    URL:
        /<cert_id>, where cert_id (int) is the primary key of the TLS certificate
    Methods Supported:
        GET
    Returns:
        On success: A JSON containing the requested TLS certificate in the format specified by :class:`TLSCertificate` `.to_dict()`, Error code 200
        On failure: Error code 404
    """
    # TODO: handle any errors
    cert = TLSCertificate.query.get_or_404(cert_id)
    return jsonify(cert.to_dict()), 200


@certificate_bp.route("/", methods=["POST"])
def create():
    """
    API endpoint which stores a TLS certificate

    URL:
        /
    Methods Supported:
        POST
    Request Data:
        JSON in a format readable by :class:`TLSCertificate` `.from_dict()`
    Returns:
        On success: A JSON containing the parsed TLS certificate data in the format specified by :class:`TLSCertificate` `.to_dict()`, Error code 201
        On failure: JSON with an 'error' field, Error code 400
    """
    data = request.get_json(force=True)
    cert = TLSCertificate.from_dict(data)

    if cert is None:
        return jsonify({"error": "Request cannot be formatted as a TLS certificate"}), 400

    db.session.add(cert)
    db.session.commit()
    return jsonify(cert.to_dict()), 201


@certificate_bp.route("/<int:cert_id>", methods=["DELETE"])
def delete(cert_id):
    """
    API endpoint which deletes a TLS certificate by ID

    URL:
        /<cert_id>, where cert_id (int) is the primary key of the TLS certificate
    Methods Supported:
        DELETE
    Returns:
        On success: A JSON with a 'message' field, Error code 200
        On failure: Error code 404
    """
    cert = TLSCertificate.query.get_or_404(cert_id)
    db.session.delete(cert)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200


@certificate_bp.route("/batch", methods=["POST"])
def batch_create():
    """
    API endpoint which creates a batch of TLS certificates

    URL:
        /batch
    Methods Supported:
        POST
    Request Data:
        A JSON in the format {'certificates': list of certificates in the format specified by :class:`TLSCertificate` `.from_dict()`}
    Returns:
        On success: A JSON in the format {'created': number of certificates created, 'ids': list of certificate IDs}, Error code 201
        On failure: A JSON with an 'error' field, Error code 400
    """

    # retrieve certificate
    data = request.get_json(force=True)
    entries = data.get("certificates", [])
    if not entries:
        return jsonify({"error": "No certificates provided"}), 400

    # parse each certificate to a table entry
    created_ids = []
    for entry in entries:
        cert = TLSCertificate.from_dict(entry)
        db.session.add(cert)
        db.session.flush()
        created_ids.append(cert.id)

    # save changes to database
    db.session.commit()

    return jsonify({"created": len(created_ids), "ids": created_ids}), 201

@certificate_bp.route("/expiring", methods=["GET"])
def expiring():
    """
    API endpoint which retrieves all certificates which expire in the next <n> days

    URL:
        /expiring
    Methods Supported:
        GET
    Request Data:
        an argument "days", of which's value is <n>. Defaults to 30
    Returns:
        On success: A JSON in the format {'days_window': <n>, 'count': number of certificates found, 'certificates': list of certificates in the format specified by :class:`TLSCertificate` `.to_dict()`}, Error code 200
        On failure: #TODO
    """
    
    days = int(request.args.get("days", 30))
    now = time.time()
    cutoff = now + days * 86400 # days to seconds

    #TODO: handle errors

    # query all certificates that lie within the expiry range
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
    """
    API endpoint which retrieves all certificates which have expired

    URL:
        /expired
    Methods Supported:
        GET
    Returns:
        On success: A JSON in the format {'count': number of certificates found, 'certificates': list of certificates in the format specified by :class:`TLSCertificate` `.to_dict()`}, Error code 200
        On failure: #TODO
    """
    
    #TODO: handle errors

    now = time.time()
    certs = TLSCertificate.query.filter(TLSCertificate.valid_to < now).all()
    return jsonify({
        "count": len(certs),
        "certificates": [c.to_dict() for c in certs],
    }), 200


@certificate_bp.route("/search", methods=["GET"])
def search():
    """
    API endpoint which searches for certificates by subject

    URL:
        /search
    Methods Supported:
        GET
    Request Data:
        arguments to filter by: "subject", "issuer", "protocol", "compliance"
    Returns:
        On success: A JSON in the format {'count': number of certificates found, 'certificates': list of certificates in the format specified by :class:`TLSCertificate` `.to_dict()`}, Error code 200
        On failure: A JSON with an 'error' field, Error code 400
    """
    query = TLSCertificate.query

    # filter by subject
    subject = request.args.get("subject")
    if subject:
        query = query.filter(TLSCertificate.subject_name.ilike(f"%{subject}%"))

    # filter by issuer
    issuer = request.args.get("issuer")
    if issuer:
        query = query.filter(TLSCertificate.issuer.ilike(f"%{issuer}%"))

    # filter by protocol
    protocol = request.args.get("protocol")
    if protocol:
        query = query.filter(TLSCertificate.protocol == protocol)

    # filter by compliance
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
    """
    API endpoint which retrieves some statistics about all TLS certificates

    URL:
        /stats
    Methods Supported:
        GET
    Returns:
        On success: A JSON in the format {
            "total": total number of certificates,
            "expired": number of certificates expired,
            "expiring_within_30_days": number of certificates expiring soon,
            "with_issues": number of certificates with issues,
            "by_compliance": dict of {transparency compliance type, number of certificates},
            "by_protocol": dict of {protocol type, number of certificates}
        }, Error code 200
        On failure: #TODO
    """
    
    now = time.time()

    # get all certificates
    all_certs = TLSCertificate.query.all()
    total = len(all_certs)

    # retrieve statistics
    expired_count = sum(1 for c in all_certs if c.valid_to < now)
    expiring_soon = sum(1 for c in all_certs if now <= c.valid_to <= now + 30 * 86400)
    with_issues = sum(1 for c in all_certs if c.evaluate_cert()["issues"])

    # retrieve statistics about how many certificates satisfy a transparency compliance type
    compliance_counts = {}
    for c in all_certs:
        key = c.certificate_transparency_compliance.value
        compliance_counts[key] = compliance_counts.get(key, 0) + 1

    # retrieve statistics about how many certificates satisfy a protocol type
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
    """
    API endpoint which evaluates the validity of a given certificate

    URL:
        /<certificate_id>/evaluate, where <certificate_id> (int) is the primary key of the TLS certificate
    Methods Supported:
        GET
    Returns:
        On success: A JSON in the format {
            "certificate_id": certificate id,
            "subject": subject name,
            "issuer": issuer,
            "protocol": protocol,
            "cipher": cipher,
            more fields as defined by :class:`TLSCertificate` `._evaluate_id()`,
        }, Error code 200
        On failure: Error code 404
    """

    cert: TLSCertificate = TLSCertificate.query.get_or_404(cert_id)
    findings = cert._evaluate_cert()
    return jsonify({
        "certificate_id": cert_id,
        "subject": cert.subject_name,
        "issuer": cert.issuer,
        "protocol": cert.protocol,
        "cipher": cert.cipher,
        **findings,
    }), 200
