from flask import Flask, jsonify, request
import json
import os
import secrets
from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity

app = Flask(__name__)

db_url = os.environ.get("DATABASE_URL", "sqlite:///local.db")
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "super-secret-dev-key")

db = SQLAlchemy(app)
jwt = JWTManager(app)

# Not finalised data models, just a starting point for development. Adjust as needed.
class Organisation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    invite_code = db.Column(db.String(12), unique=True, nullable=False, index=True)
    users = db.relationship('User', backref='organisation', lazy=True)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(256), nullable=False)
    organisation_id = db.Column(db.Integer, db.ForeignKey('organisation.id'), nullable=True)
    certificates = db.relationship('Certificate', backref='owner', lazy=True)

class Certificate(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    certificate = db.Column(db.Text, nullable=False) # JSON string
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

# Test endpoint
@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "ok", 
        "message": "ready"
    }), 200

# Not finalised endpoints, just a starting point for development. Adjust as needed.
@app.route("/api/register", methods=["POST"])
def register():
    """
    Register a new user account.

    Parameters:
        JSON body:
            username (str, required): Unique username for the account.
            password (str, required): Plaintext password to be hashed and stored.

    Returns:
        201: {
            "status": "success",
            "message": "User registered successfully.",
            "access_token": "<jwt>",
            "user": {
                "id": int,
                "username": str,
                "organisation_id": int | null
            }
        }
        400: {
            "status": "error",
            "message": "Username and password are required." | "Username already exists."
        }
    """
    pass

@app.route("/api/login", methods=["POST"])
def login():
    """
    Authenticate an existing user.

    Parameters:
        JSON body:
            username (str, required): Existing username.
            password (str, required): Account password.

    Returns:
        200: {
            "status": "success",
            "access_token": "<jwt>",
            "user": {
                "id": int,
                "username": str,
                "organisation_id": int | null
            }
        }
        400: {
            "status": "error",
            "message": "Username and password are required."
        }
        401: {
            "status": "error",
            "message": "Invalid credentials."
        }
    """
    pass

@app.route("/api/organisations/create", methods=["POST"])
def create_organisation():
    """
    Create an organisation and generate a shareable invite code.

    Parameters:
        Auth:
            Bearer token (JWT) for the currently logged-in user.
        JSON body:
            name (str, required): Unique organisation name.

    Returns:
        201: {
            "status": "success",
            "message": "Organisation created successfully.",
            "organisation": {
                "id": int,
                "name": str,
                "invite_code": str
            }
        }
        400: {
            "status": "error",
            "message": "Organisation name is required." |
                       "Organisation name already exists." |
                       "User already belongs to an organisation."
        }
        401: {"msg": "Missing Authorisation Header"}
        404: {
            "status": "error",
            "message": "User not found."
        }
    """
    pass

@app.route("/api/organisations/join", methods=["POST"])
def join_organisation():
    """
    Join an existing organisation via invite code.

    Parameters:
        Auth:
            Bearer token (JWT) for the currently logged-in user.
        JSON body:
            invite_code (str, required): Organisation invite code.

    Returns:
        200: {
            "status": "success",
            "message": "Joined organisation successfully.",
            "organisation": {
                "id": int,
                "name": str
            }
        }
        400: {
            "status": "error",
            "message": "Invite code is required." |
                       "User already belongs to an organisation."
        }
        401: {"msg": "Missing Authorisation Header"}
        404: {
            "status": "error",
            "message": "Invalid invite code." | "User not found."
        }
    """
    pass


@app.route("/api/me", methods=["GET"])
@jwt_required()
def get_me():
    """
    Return the currently authenticated user's profile and organisation membership.

    Parameters:
        Auth:
            Bearer token (JWT) for the current user.

    Returns:
        200: {
            "status": "success",
            "user": {
                "id": int,
                "username": str,
                "organisation": null | {
                    "id": int,
                    "name": str,
                    "invite_code": str
                }
            }
        }
        401: {"msg": "Missing Authorisation Header"}
        404: {
            "status": "error",
            "message": "User not found."
        }
    """
    pass

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run()