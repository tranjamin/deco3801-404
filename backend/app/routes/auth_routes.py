from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

from app import db
from app.models.user import User


auth_bp: Blueprint = Blueprint("auth_bp", __name__)


def _missing_fields(data: dict, fields: list[str]) -> list[str]:
    missing: list[str] = []
    for field in fields:
        value = data.get(field)
        if value is None or (isinstance(value, str) and not value.strip()):
            missing.append(field)
    return missing


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(force=True) or {}
    required = ["username", "password"]
    missing = _missing_fields(data, required)
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    username = str(data["username"]).strip()

    if User.query.filter_by(username=username).first() is not None:
        return jsonify({"error": "Username is already taken"}), 409

    user = User(
        username=username,
        password_hash="",
    )
    user.set_password(str(data["password"]))

    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"accessToken": token, "user": user.to_dict()}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(force=True) or {}

    username = str(data.get("username") or "").strip()
    password = str(data.get("password") or "")

    if not username or not password:
        return jsonify({"error": "username and password are required"}), 400

    user = User.query.filter_by(username=username).first()
    if user is None or not user.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({"accessToken": token, "user": user.to_dict()}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(int(user_id))
    return jsonify(user.to_dict()), 200
