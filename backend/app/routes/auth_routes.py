from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from typing import Dict, Any

from app import db
from app.models.user import User

auth_bp: Blueprint = Blueprint("auth_bp", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    """
    API endpoint which registers a new user.

    URL:
        /register
    Methods Supported:
        POST
    Request Data:
        JSON in a format readable by :class:`User` `.from_dict()`
    Returns:
        On success: A JSON containing 'accessToken' and 'user' in the format specified by :class:`User` `.to_dict()`, Error code 201
        On failure: JSON with an 'error' field, Error code 400 or 409
    """
    data: Dict[str, Any] = request.get_json(force=True) or {}
    user: User | None = User.from_dict(data)

    if user is None:
        return jsonify({"error": "Request cannot be formatted as a user"}), 400

    if User.query.filter_by(username=user.username).first() is not None:
        return jsonify({"error": "Username is already taken"}), 409

    db.session.add(user)
    db.session.commit()

    token: str = create_access_token(identity=str(user.id))
    return jsonify({"accessToken": token, "user": user.to_dict()}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    """
    API endpoint which authenticates a user and returns a JWT.

    URL:
        /login
    Methods Supported:
        POST
    Request Data:
        JSON with 'username' and 'password' fields.
    Returns:
        On success: A JSON containing 'accessToken' and 'user' in the format specified by :class:`User` `.to_dict()`, Error code 200
        On failure: JSON with an 'error' field, Error code 400 or 401
    """
    data: Dict[str, Any] = request.get_json(force=True) or {}

    username: str = str(data.get("username") or "").strip()
    password: str = str(data.get("password") or "")

    if not username or not password:
        return jsonify({"error": "username and password are required"}), 400

    user: User | None = User.query.filter_by(username=username).first()
    if user is None or not user.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401

    token: str = create_access_token(identity=str(user.id))
    return jsonify({"accessToken": token, "user": user.to_dict()}), 200


@auth_bp.route("/check", methods=["GET"])
@jwt_required()
def check():
    """
    API endpoint which checks if the user is authenticated and their token is valid.

    URL:
        /check
    Methods Supported:
        GET
    Returns:
        On success: A JSON with an 'authenticated' boolean, Error code 200
        On failure: Error code 401 (if unauthorized/invalid token) or 404 (if user no longer exists)
    """
    user_id: str = get_jwt_identity()
    User.query.get_or_404(int(user_id))
    
    return jsonify({"authenticated": True}), 200