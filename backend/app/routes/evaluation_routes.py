from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from typing import Dict, Any

from app import db
from app.models.certificate import TLSCertificate
from app.models.policy import CertificatePolicy
from app.models.user import User
from app.models.evaluation import evaluate_against_policy

# represents this collection of endpoints
evaluation_bp: Blueprint = Blueprint("evaluation_bp", __name__)

@evaluation_bp.route("/", methods=["GET"])
@jwt_required()
def evaluation_route():
    """
    API endpoint which evaluates a certificate against a policy and returns the evaluation result.

    URL:
        /
    Methods Supported:
        GET
    Request Data:
        JSON in the format {"certificate_id": <certificate_id>, "policy_id": <policy_id>}
    Returns:
        On success: an Evaluation JSON, Error code 200
        On failure: 
            Error code 400 if JSON is malformed
            Error code 404 for other errors
    """
    # get the user
    user_id: int = int(get_jwt_identity())
    user: User = User.query.get_or_404(user_id)
    
    # .get_json handles any errors
    data: Dict[str, Any] = request.get_json(force=True)
    if data.get("certificate_id") is None or data.get("policy_id") is None:
        return "Bad JSON Request", 400
        
    cert: TLSCertificate = TLSCertificate.query.get_or_404(data.get("certificate_id"))
    policy: CertificatePolicy = CertificatePolicy.query.get_or_404(data.get("policy_id"))

    if cert.user_id != user_id and user_id != "master":
        return 404
    if policy.user_id != user_id and user_id != "master":
        return 404
    
    _, return_json = evaluate_against_policy(cert, policy)
    
    return jsonify(return_json), 200
