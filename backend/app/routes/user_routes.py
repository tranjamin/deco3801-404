from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.user import User

user_bp: Blueprint = Blueprint("user_bp", __name__)

@user_bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    """
    Retrieves the currently authenticated user's information.
    ---
    tags:
      - Users
    responses:
      200:
        description: User information retrieved successfully
      401:
        description: Unauthorized or invalid token
      404:
        description: User not found
    """
    current_user_id: int = int(get_jwt_identity())
    
    user: User = User.query.get_or_404(current_user_id)
    return jsonify(user.to_dict()), 200