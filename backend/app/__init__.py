from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from typing import *

db: "SQLAlchemy" = SQLAlchemy()

def create_app():
    app: "Flask" = Flask(__name__)
    
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///tls_certificates.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    from app.models import certificate  # noqa: F401

    # initialise database schema
    with app.app_context():
        db.create_all()

    # load in blueprint
    from app.routes.certificate_routes import certificate_bp
    app.register_blueprint(certificate_bp, url_prefix="/api/certificates")

    return app
