from flask import Blueprint, request, jsonify
from typing import Dict, Any

from app import db
from app.models.certificate import TLSCertificate
from app.models.policy import CertificatePolicy
from app.models.evaluation import evaluate_against_policy

# represents this collection of endpoints
evaluation_bp: Blueprint = Blueprint("evaluation_bp", __name__)

@evaluation_bp.route("/", methods=["GET"])
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
    
    # .get_json handles any errors
    data: Dict[str, Any] = request.get_json(force=True)
    if data.get("certificate_id") is None or data.get("policy_id") is None:
        return "Bad JSON Request", 400
        
    cert: TLSCertificate = TLSCertificate.query.get_or_404(data.get("certificate_id"))
    policy: CertificatePolicy = CertificatePolicy.query.get_or_404(data.get("policy_id"))
    
    _, return_json = evaluate_against_policy(cert, policy)
    
    return jsonify(return_json), 200
