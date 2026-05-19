from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
)
from werkzeug.security import check_password_hash, generate_password_hash
from typing import Dict, Any

from app import db
from app.models.user import User
from app.models.user import USER_NAME_MAXLEN

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
        On success: A JSON containing 'access_token', 'refresh_token', and 'user', Error code 201
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

    identity: str = str(user.id)
    access_token: str = create_access_token(identity=identity)
    refresh_token: str = create_refresh_token(identity=identity)
    return jsonify({"access_token": access_token, "refresh_token": refresh_token, "user": user.to_dict()}), 201


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
        On success: A JSON containing 'access_token', 'refresh_token', and 'user', Error code 200
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

    identity: str = str(user.id)
    access_token: str = create_access_token(identity=identity)
    refresh_token: str = create_refresh_token(identity=identity)
    return jsonify({"access_token": access_token, "refresh_token": refresh_token, "user": user.to_dict()}), 200


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """
    API endpoint which issues a new access token using a valid refresh token.

    URL:
        /refresh
    Methods Supported:
        POST
    Requires:
        Authorization header with a valid refresh token: Bearer <refresh_token>
    Returns:
        On success: A JSON containing 'access_token', Error code 200
        On failure: Error code 401 (if unauthorized/invalid token) or 404 (if user no longer exists)
    """
    user_id: str = get_jwt_identity()

    # ensure user still exists    
    if User.query.get(int(user_id)) is None:
        return jsonify({"message": "User no longer exists"}), 404

    access_token: str = create_access_token(identity=user_id)
    return jsonify({"access_token": access_token}), 200


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
    
    # ensure user still exists
    if User.query.get(int(user_id)) is None:
        return jsonify({"message": "User no longer exists"})
    
    return jsonify({"authenticated": True}), 200

@auth_bp.route("/change_password", methods=["POST"])
@jwt_required()
def change_password():
    """
    API endpoint which changes a user's password.

    URL:
        /change_password
    Methods Supported:
        POST
    Requires:
        JSON data with the following fields: "current_password", "new_password"
    Returns:
        On success: A JSON with an 'password_updated' boolean, Error code 200
        On failure: Error code 401 (if unauthorized/invalid token) or 404 (if user no longer exists)
    """
    data: Dict[str, Any] = request.get_json(force=True) or {}
    current_password: str = str(data.get("current_password", ""))
    new_password: str = str(data.get("new_password", ""))

    if not current_password or not new_password:
        return jsonify({"error": "current_password and new_password required"}), 400

    # checks if JWT token is authenticated
    user_id: str = get_jwt_identity()
    user: User | None = User.query.get(int(user_id))
    
    # checks if current password is correct
    if user is None or (not user.check_password(current_password)):
        return jsonify({"message": "unauthorised"}), 401

    # updates password
    user.set_password(new_password)
    db.session.commit()

    return jsonify({"password_updated": True}), 200

@auth_bp.route("/change_username", methods=["POST"])
@jwt_required()
def change_username():
    """
    API endpoint which changes a user's username.

    URL:
        /change_username
    Methods Supported:
        POST
    Requires:
        JSON data with the following fields: "current_password", "new_username"
    Returns:
        On success: A JSON with a 'username_updated' boolean, Error code 200
        On failure: JSON with an 'error' field, Error code 400 (if missing/invalid fields), 401 (if unauthorized/invalid token) or 404 (if user no longer exists)
    """
    data: dict = request.get_json(force=True, silent=True) or {}
    current_password = str(data.get("current_password", ""))
    new_username = str(data.get("new_username", "")).strip()
    if not current_password or not new_username:
        return jsonify({"message": "current_password and new_username required"}), 400

    user_id: str = get_jwt_identity()
    user: User | None = User.query.get(int(user_id))

    if user is None or (not user.check_password(current_password)):
        return jsonify({"error": "unauthorised"}), 401

    new_username: str = new_username[:USER_NAME_MAXLEN]

    existing_user : User | None = User.query.filter_by(username=new_username).first()
    if existing_user and existing_user.id != user.id:
        return jsonify({"message": "username already taken"}), 409

    if new_username == user.username:
        return jsonify({"message": "new username cannot be the same as old username"}), 400

    user.username = new_username
    db.session.commit()
    return jsonify({"success": True}), 200