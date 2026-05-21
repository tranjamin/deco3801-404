from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from typing import List, Dict, Any

from app import db
from app.models.policy import CertificatePolicy
from app.models.user import User

# represents this collection of endpoints
policy_bp: Blueprint = Blueprint("policy_bp", __name__)

@policy_bp.route("/", methods=["GET"])
@jwt_required()
def get_all():
    """
    API endpoint which retrieves all certificate policies

    URL:
        /
    Methods Supported:
        GET
    Returns:
        On success: A JSON containing a list of certificates in the format specified by :class:`TLSPolicy` `.to_dict()`, Error code 200
        On failure: {"message": "User does not exist"}, 404 
    """

    # get the user
    user_id: int = int(get_jwt_identity())
    user: User | None = User.query.get(user_id)

    if user is None:
        return jsonify({"message": "User does not exist"}), 404 

    # get the certificate
    certs: List[CertificatePolicy] = CertificatePolicy.query.filter(
        CertificatePolicy.user_id == user_id
    ) # type: ignore

    return jsonify([c.to_dict() for c in certs]), 200

@policy_bp.route("/<int:policy_id>", methods=["GET"])
@jwt_required()
def get_one(policy_id: int):
    """
    API endpoint which retrieves a certificate policy by ID

    URL:
        /<policy_id>, where policy_id (int) is the primary key of the certificate policy
    Methods Supported:
        GET
    Returns:
        On success: A JSON containing the requested certificate policy in the format specified by :class:`CertificatePolicy` `.to_dict()`, Error code 200
        On failure: {"message": "Policy not found"}, 404 if the policy is not found
    """
    # get the user
    user_id: int = int(get_jwt_identity())
    user: User | None = User.query.get(user_id)
    
    # get the policy by id
    policy: CertificatePolicy | None = CertificatePolicy.query.get(policy_id)

    # handle missing user or policy, or unauthorised user
    if (user is None) or (policy is None) or (policy.user_id != user_id):
        return jsonify({"message": "Policy not found"}), 404

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
        On success: {"message": f"Updated to <active-status>"}, 200
        On failure: {"message": <error-message>}, <error code>
    """    
    # get the user
    user_id: int = int(get_jwt_identity())
    user: User | None = User.query.get(user_id)

    data: Dict[str, Any] | None = request.get_json(force=True, silent=True)
    policy: CertificatePolicy | None = CertificatePolicy.query.get(policy_id)

    # handle edge cases
    if user is None:
        return jsonify({"message": "User not found"}), 404
    elif data is None or data.get("active") is None:
        return jsonify({"message": "Malformed request"}), 400
    if policy is None or (policy.user_id != user_id):
        return jsonify({"message": "Policy not found"}), 404

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
        On failure: {"error": "Request cannot be formatted as a certificate policy"}, 400 if the request is formatted incorrectly
    """


    data: Dict[str, Any] | None= request.get_json(force=True, silent=True)
    
    # handle missing data
    if data is None:
        return jsonify({"error": "Request cannot be formatted as a certificate policy"}), 400
    
    # create a policy
    policy: CertificatePolicy | None = CertificatePolicy.from_dict(data)

    # handle badly formatted data
    if policy is None:
        return jsonify({"error": "Request cannot be formatted as a certificate policy"}), 400

    # assign policy to user
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
        On success: {"message": "Deleted"}, 200
        On failure: {"message": <error-message>}, 404 
    """
    # get the user
    user_id: int = int(get_jwt_identity())
    user: User | None = User.query.get(user_id)
    
    # handle user missing
    if user is None:
        return jsonify({"message": "User does not exist"}), 404 

    # get the policy
    policy: CertificatePolicy | None = CertificatePolicy.query.get(policy_id)

    # handle missing policy
    if policy is None or policy.user_id != user_id:
        return jsonify({"message": "Policy does not exist"}), 404 
    
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
        On failure: {"message": <error-message>}, 404 
    """
    # get the user
    user_id: int = int(get_jwt_identity())
    user: User | None = User.query.get(user_id)

    # handle missing user
    if user is None:
        return jsonify({"message": "User does not exist"}), 404 

    # get the policy
    policy: CertificatePolicy | None = CertificatePolicy.query.get(policy_id)

    # handle missing policy or unauthorised user
    if policy is None or (policy.user_id != user_id):
        return jsonify({"message": "Policy does not exist"}), 404 

    # get the updated policy
    data: Dict[str, Any] | None = request.get_json(force=True, silent=True)
    if data is None:
        return jsonify({"message": "Invalid new data. Policy will not be updated."}), 400

    new_policy: CertificatePolicy | None = CertificatePolicy.from_dict(data)
    if new_policy is None:
        return jsonify({"message": "Invalid new data. Policy will not be updated."}), 400
    
    # update fields one by one, except for the user
    policy.description = new_policy.description
    policy.name = new_policy.name
    policy.valid_protocols = new_policy.valid_protocols
    policy.valid_subjects = new_policy.valid_subjects
    policy.valid_issuers = new_policy.valid_issuers
    policy.valid_ciphers = new_policy.valid_ciphers
    policy.valid_domains = new_policy.valid_domains
    policy.min_certificate_lifespan = new_policy.min_certificate_lifespan
    policy.min_certificate_days_left = new_policy.min_certificate_days_left

    db.session.commit()
    return jsonify({"message": "Updated"}), 200