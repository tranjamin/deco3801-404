from flask import Flask
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def create_app():
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///tls_certificates.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    from app.models import certificate  # noqa: F401

    with app.app_context():
        db.create_all()

    from app.routes.certificate_routes import certificate_bp
    app.register_blueprint(certificate_bp, url_prefix="/api/certificates")

    return app
