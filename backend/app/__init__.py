from flask import Flask
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def create_app():
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///tls_certificates.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    from app.models import certificate  # noqa: F401
    from app.models import domain_visit  # noqa: F401

    with app.app_context():
        db.create_all()

    from app.routes.certificate_routes import certificate_bp
    from app.routes.report_routes import report_bp
    app.register_blueprint(certificate_bp, url_prefix="/api/certificates")
    app.register_blueprint(report_bp, url_prefix="/api/reports")

    @app.after_request
    def add_cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        return response

    return app
