from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from typing import List, Dict, Any, Literal

from app import db
from app.models.policy import CertificatePolicy
from app.models.utils import Protocols

# represents this collection of endpoints
policy_bp: Blueprint = Blueprint("policy_bp", __name__)

@policy_bp.route("/", methods=["GET"])
def get_all():
    """
    API endpoint which retrieves all certificate policies

    URL:
        /
    Methods Supported:
        GET
    Returns:
        On success: A JSON containing a list of certificates in the format specified by :class:`TLSPolicy` `.to_dict()`, Error code 200
    """
    certs: List[CertificatePolicy] = CertificatePolicy.query.all() # type: ignore
    return jsonify([c.to_dict() for c in certs]), 200

@policy_bp.route("/<int:policy_id>", methods=["GET"])
def get_one(policy_id: int):
    """
    API endpoint which retrieves a certificate policy by ID

    URL:
        /<policy_id>, where policy_id (int) is the primary key of the certificate policy
    Methods Supported:
        GET
    Returns:
        On success: A JSON containing the requested certificate policy in the format specified by :class:`CertificatePolicy` `.to_dict()`, Error code 200
        On failure: Error code 404
    """
    # automatically handles any errors
    policy: CertificatePolicy = CertificatePolicy.query.get_or_404(policy_id)
    return jsonify(policy.to_dict()), 200

@policy_bp.route("/<int:policy_id>/active", methods=["PUT"])
@jwt_required()
def update_active(policy_id: int):
    """
    API endpoint which sets a certificate policy to be active or inactive by ID

    URL:
        /<policy_id>/active, where policy_id (int) is the primary key of the certificate policy
    Methods Supported:
        PUT
    Request Data:
        JSON of {"active": bool}
    Returns:
        On success: A JSON with a 'message' field, Error code 200
        On failure: Error code 404
    """    
    data: Dict[str, Any] = request.get_json(force=True)
    policy: CertificatePolicy = CertificatePolicy.query.get_or_404(policy_id)
    policy.active = data.get("active", False)
    db.session.commit()
    return jsonify({"message": f"Updated to {policy.active}"}), 200

@policy_bp.route("/", methods=["POST"])
@jwt_required()
def create():
    """
    API endpoint which stores a certificate policy

    URL:
        /
    Methods Supported:
        POST
    Request Data:
        JSON in a format readable by :class:`CertificatePolicy` `.from_dict()`
    Returns:
        On success: A JSON containing the parsed certificate policy data in the format specified by :class:`CertificatePolicy` `.to_dict()`, Error code 201
        On failure: JSON with an 'error' field, Error code 400
    """
    data: Dict[str, Any] = request.get_json(force=True)
    policy: CertificatePolicy | None = CertificatePolicy.from_dict(data)

    if policy is None:
        return jsonify({"error": "Request cannot be formatted as a certificate policy"}), 400

    user_id: int = int(get_jwt_identity())
    policy.user_id = user_id
    
    db.session.add(policy)
    db.session.commit()
    return jsonify(policy.to_dict()), 201


@policy_bp.route("/<int:policy_id>", methods=["DELETE"])
@jwt_required()
def delete(policy_id: int):
    """
    API endpoint which deletes a certificate policy by ID

    URL:
        /<policy_id>, where policy_id (int) is the primary key of the certificate policy
    Methods Supported:
        DELETE
    Returns:
        On success: A JSON with a 'message' field, Error code 200
        On failure: Error code 404
    """
    policy: CertificatePolicy = CertificatePolicy.query.get_or_404(policy_id)
    db.session.delete(policy)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200

@policy_bp.route("/<int:policy_id>/update", methods=["PUT"])
@jwt_required()
def update_policy(policy_id: int):
    """
    API endpoint which modifies a certificate policy by ID

    URL:
        /<policy_id>, where policy_id (int) is the primary key of the certificate policy
    Methods Supported:
        PUT
    Request Data:
        JSON in a format readable by :class:`CertificatePolicy` `.from_dict()`
    Returns:
        On success: A JSON containing the parsed certificate policy data in the format specified by :class:`CertificatePolicy` `.to_dict()`, Error code 201
        On failure: JSON with an 'error' field, Error code 400
    """
    policy: CertificatePolicy = CertificatePolicy.query.get_or_404(policy_id)

    data: Dict[str, Any] = request.get_json(force=True)
    new_policy: CertificatePolicy | None = CertificatePolicy.from_dict(data)
    if new_policy is None:
        return jsonify({"error": "Invalid new data. Policy will not be updated."}), 200
    
    policy.description = new_policy.description
    policy.name = new_policy.name
    policy.valid_protocols = new_policy.valid_protocols
    policy.valid_subjects = new_policy.valid_subjects
    policy.valid_sans = new_policy.valid_sans
    policy.valid_issuers = new_policy.valid_issuers
    policy.valid_ciphers = new_policy.valid_ciphers
    policy.min_certificate_lifespan = new_policy.min_certificate_lifespan
    policy.min_certificate_days_left = new_policy.min_certificate_days_left

    db.session.commit()
    return jsonify({"message": "Updated"}), 200

@policy_bp.route("/batch", methods=["POST"])
def batch_create():
    """
    API endpoint which creates a batch of certificate policies

    URL:
        /batch
    Methods Supported:
        POST
    Request Data:
        A JSON in the format {'policies': list of policies in the format specified by :class:`CertificatePolicy` `.from_dict()`}
    Returns:
        On success: A JSON in the format {'created': number of policies created, 'ids': list of policy IDs}, Error code 201
        On failure: A JSON with an 'error' field, Error code 400
    """

    # retrieve certificate
    data: Dict[str, Any] = request.get_json(force=True)
    entries: List[Any] = data.get("policies", [])
    if not entries:
        return jsonify({"error": "No policies provided"}), 400

    # parse each certificate to a table entry
    created_ids: List[int] = []
    for entry in entries:
        policy: CertificatePolicy | None = CertificatePolicy.from_dict(entry)
        if policy is not None:
            db.session.add(policy)
            db.session.flush()
            created_ids.append(policy.id)

    # save changes to database
    db.session.commit()

    return jsonify({"created": len(created_ids), "ids": created_ids}), 201

@policy_bp.route("/create_dummy", methods=["GET"])
def create_dummy_data():
    """
    API endpoint which creates a dummy certificate policy when navigating to it.

    URL:
        /create_dummy
    Methods Supported:
        GET
    Returns:
        On success: A JSON containing the parsed certificate policy data in the format specified by :class:`CertificatePolicy` `.to_dict()`, Error code 201
        On failure: JSON with an 'error' field, Error code 400
    """
    policy = CertificatePolicy(
        description="A dummy certificate policy created by navigating to /api/policies/create_dummy",
        name="Dummy Policy",
        
        valid_protocols=Protocols.encode(["tls 1.0", "tls 1.1"]),
        valid_subjects=["Dummy subject 1", "Dummy subject 2"],
        valid_issuers=["Dummy issuer 1", "Dummy issuer 2"],
        valid_sans=["www.san1.dummy.com", "www.san2.dummy.com"],
        valid_ciphers=["Dummy cipher 1", "Dummy cipher 2"],
        
        min_certificate_lifespan=45,
        min_certificate_days_left=7,
    )

    db.session.add(policy)
    db.session.commit()
    return jsonify(policy.to_dict()), 201