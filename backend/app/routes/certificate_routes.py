import time
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from typing import List, Dict, Any

from flask_sqlalchemy.query import Query

from app import db
from app.models.certificate import TLSCertificate
from app.models.evaluation import satisfies_domain
from app.models.policy import CertificatePolicy
from app.models.user import User

# represents this collection of endpoints
certificate_bp: Blueprint = Blueprint("certificate_bp", __name__)

@certificate_bp.route("/", methods=["GET"])
@jwt_required()
def get_all():
    """
    API endpoint which retrieves all TLS certificates belonging to the active user

    URL:
        /
    Methods Supported:
        GET
    Returns:
        On success: A JSON containing a list of certificates in the format specified by :class:`TLSCertificate` `.to_dict()`, Error code 200
        On failure: {"message": "User does not exist"}, 404
    """
    # get the user from the JWT token
    user_id: int = int(get_jwt_identity())
    user: User | None = User.query.get(user_id)

    if user is None:
        return jsonify({"message": "User does not exist"}), 404 

    if user.username == "master": # temporary master password
        certs: List[TLSCertificate] = TLSCertificate.query.all() # type: ignore
    else: # collect user's certificates
        certs: List[TLSCertificate] = TLSCertificate.query.filter(
            TLSCertificate.user_id == user_id
        ) # type: ignore

    return jsonify([c.to_dict() for c in certs]), 200


@certificate_bp.route("/<int:cert_id>", methods=["GET"])
@jwt_required()
def get_one(cert_id: int):
    """
    API endpoint which retrieves a TLS certificate by ID

    URL:
        /<cert_id>, where cert_id (int) is the primary key of the TLS certificate
    Methods Supported:
        GET
    Returns:
        On success: A JSON containing the requested TLS certificate in the format specified by :class:`TLSCertificate` `.to_dict()`, Error code 200
        On failure: {"message": "Certificate not found"}, 404 if the certificate is not found
    """
    # get the user
    user_id: int = int(get_jwt_identity())
    user: User | None = User.query.get(user_id)

    # gets the certificate by id
    cert: TLSCertificate | None = TLSCertificate.query.get(cert_id)

    # error if certificate does not exists
    if user is None or cert is None:
        return jsonify({"message": "Certificate not found"}), 404 
    elif user.username != "master" and cert.user_id != user_id:
        return jsonify({"message": "Certificate not found"}), 404 

    return jsonify(cert.to_dict()), 200


@certificate_bp.route("/", methods=["POST"])
@jwt_required()
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
        On failure:
            {"message": "Request cannot be formatted as a TLS certificate"}, 400 if request is badly formatted
    """
    # convert data to tls certificate
    data: Dict[str, Any] | None = request.get_json(force=True, silent=True)
    cert: TLSCertificate | None = TLSCertificate.from_dict(data) if data is not None else None
    
    # badly formatted data
    if cert is None:
        return jsonify({"message": "Request cannot be formatted as a TLS certificate"}), 400
    
    # get user id
    user_id: int = int(get_jwt_identity())
    cert.user_id = user_id

    # get the list of active policies belonging to this user
    policies: List[CertificatePolicy] = CertificatePolicy.query.filter(
            CertificatePolicy.user_id == user_id,
            CertificatePolicy.active == True,
        ) # type: ignore
    
    # only keep policies this certificate applies to
    print(f"Testing for policies")
    applicable_policies: List[CertificatePolicy] = []
    for policy in policies:
        if satisfies_domain(cert.domain_name(), policy.valid_domains):
            applicable_policies.append(policy)
            print(f"Policy match: {policy.to_dict()}")

    # silently continue if there are no policies which match
    if not len(applicable_policies):
        print(f"No policies... continuing")
        
    # evaluate against the policies and store it in the certificate
    cert.evaluate_against_policies_and_store(applicable_policies)

    # check if an existing certificate exists for the same site (url, subject name and san list are the same)
    existing_certificates: Query = TLSCertificate.query.filter(
        TLSCertificate.user_id == cert.user_id,
        TLSCertificate.url == cert.url,
        TLSCertificate.subject_name == cert.subject_name,
        TLSCertificate.san_list == cert.san_list,
    ) # type: ignore

    num_certificates: int = existing_certificates.count()
    if num_certificates: # update the first certificate found
        print(f"Found an existing certificate")
        existing_certificates[0].update_certificate(cert)
        
        # also delete older certificates, which may be artifacts of concurrency
        for i in range(1, num_certificates):
            db.session.delete(existing_certificates[i])

        db.session.commit()
        return jsonify(existing_certificates[0].to_dict()), 201
    else: # add a new certificate
        db.session.add(cert)
        db.session.commit()
        return jsonify(cert.to_dict()), 201

@certificate_bp.route("/<int:cert_id>", methods=["DELETE"])
@jwt_required()
def delete(cert_id: int):
    """
    API endpoint which deletes a TLS certificate by ID

    URL:
        /<cert_id>, where cert_id (int) is the primary key of the TLS certificate
    Methods Supported:
        DELETE
    Returns:
        On success: {"message": "Deleted"}, 200
        On failure: {"message": "Certificate not found"}, 404 if the certificate does not exist for this user, or the user if not found
    """
    # get the user
    user_id: int = int(get_jwt_identity())
    user: User | None = User.query.get(user_id)

    # get the certificate
    cert: TLSCertificate | None = TLSCertificate.query.get(cert_id)

    # error if the certificate/user does not exist of if the cert does not belong to the user
    if user is None or cert is None:
        return jsonify({"message": "Certificate not found"}),  404
    elif user.username != "master" and cert.user_id != user_id:
        return jsonify({"message": "Certificate not found"}), 404

    db.session.delete(cert)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200