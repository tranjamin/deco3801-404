from flask import Blueprint, request, jsonify
from app import db
from app.models.certificate import (
    TLSCertificate,
    SANEntry,
    SignedCertificateTimestamp,
    CertificateTransparencyCompliance,
)

certificate_bp = Blueprint("certificate_bp", __name__)


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

    db.session.add(cert)
    db.session.commit()
    return jsonify(cert.to_dict()), 201


@certificate_bp.route("/<int:cert_id>", methods=["DELETE"])
def delete(cert_id):
    cert = TLSCertificate.query.get_or_404(cert_id)
    db.session.delete(cert)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200
