import time
from flask import Blueprint, request, jsonify
from typing import List, Dict, Any

from app import db
from app.models.certificate import TLSCertificate, CertificateTransparencyCompliance
from app.models.evaluation import evaluate_against_policy
from app.models.policy import CertificatePolicy

# represents this collection of endpoints
certificate_bp: Blueprint = Blueprint("certificate_bp", __name__)

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
    """
    certs: List[TLSCertificate] = TLSCertificate.query.all() # type: ignore
    return jsonify([c.to_dict() for c in certs]), 200


@certificate_bp.route("/<int:cert_id>", methods=["GET"])
def get_one(cert_id: int):
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
    # returns 404 if failed
    cert: TLSCertificate = TLSCertificate.query.get_or_404(cert_id)
    return jsonify(cert.to_dict()), 200


@certificate_bp.route("/", methods=["POST"])
def create():
    """
    API endpoint which stores a TLS certificate.
    Certificate is evaluated against all currently existing policies and errors are unioned.

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
    # .get_json handles any errors
    data: Dict[str, Any] = request.get_json(force=True)
    cert: TLSCertificate | None = TLSCertificate.from_dict(data)
    
    if cert is None:
        return jsonify({"error": "Request cannot be formatted as a TLS certificate"}), 400
    
    policies: List[CertificatePolicy] = CertificatePolicy.query.all()
    cert.evaluate_against_policies_and_store(policies)

    db.session.add(cert)
    db.session.commit()
    return jsonify(cert.to_dict()), 201

@certificate_bp.route("/create_dummy", methods=["GET"])
def create_dummy():
    """
    API endpoint which creates a dummy certificate policy when navigating to it.

    URL:
        /create_dummy
    Methods Supported:
        GET
    Returns:
        On success: A JSON containing the parsed TLS certificate data in the format specified by :class:`TLSCertificate` `.to_dict()`, Error code 201
        On failure: JSON with an 'error' field, Error code 400
    """
    
    cert = TLSCertificate(
        url="127.0.0.1",
        protocol="tls 1.0",
        cipher="Dummy cipher",
        subject_name="Dummy subject name",
        san_list=["SAN 1", "SAN 2"],
        issuer="Dummy issuer",
        valid_from=0,
        valid_to=1,
        certificate_transparency_compliance=CertificateTransparencyCompliance.UNKNOWN,
    )
    
    policies: List[CertificatePolicy] = CertificatePolicy.query.all()
    cert.evaluate_against_policies_and_store(policies)

    db.session.add(cert)
    db.session.commit()
    return jsonify(cert.to_dict()), 201

@certificate_bp.route("/<int:cert_id>", methods=["DELETE"])
def delete(cert_id: int):
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
    # automatically handles any errors
    cert: TLSCertificate = TLSCertificate.query.get_or_404(cert_id)
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
    # .get_json handles any errors
    data: Dict[str, Any] = request.get_json(force=True)
    entries: List[Any] = data.get("certificates", [])
    if not entries:
        return jsonify({"error": "No certificates provided"}), 400

    # parse each certificate to a table entry
    created_ids: List[Any] = []
    for entry in entries:
        cert: TLSCertificate | None = TLSCertificate.from_dict(entry)
        if cert is not None:
            db.session.add(cert)
            created_ids.append(cert.id)
            db.session.flush() # we may want to flush less frequently than this

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
    now: float = time.time()
    cutoff: float = now + days * 86400 # days to seconds

    #TODO: handle errors

    # query all certificates that lie within the expiry range
    certs: List[TLSCertificate] = TLSCertificate.query.filter(  # type: ignore
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

    now: float = time.time()
    certs: List[TLSCertificate] = TLSCertificate.query.filter(TLSCertificate.valid_to < now).all() # type: ignore
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
    subject: str | None = request.args.get("subject")
    if subject:
        query = query.filter(TLSCertificate.subject_name.ilike(f"%{subject}%"))

    # filter by issuer
    issuer: str | None = request.args.get("issuer")
    if issuer:
        query = query.filter(TLSCertificate.issuer.ilike(f"%{issuer}%"))

    # filter by protocol
    protocol: str | None = request.args.get("protocol")
    if protocol:
        query = query.filter(TLSCertificate.protocol == protocol)

    # filter by compliance
    compliance: str | None = request.args.get("compliance")
    if compliance:
        try:
            compliance_enum = CertificateTransparencyCompliance(compliance)
            query = query.filter(
                TLSCertificate.certificate_transparency_compliance == compliance_enum
            )
        except ValueError:
            return jsonify({"error": f"Invalid compliance value: {compliance}"}), 400

    results: List[TLSCertificate] = query.all() # type: ignore
    return jsonify({
        "count": len(results),
        "certificates": [c.to_dict() for c in results],
    }), 200