from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
import sqlalchemy
import os
from datetime import timedelta
import psycopg2
from dotenv import load_dotenv

db: SQLAlchemy = SQLAlchemy()
jwt: JWTManager = JWTManager()

def create_app(test=False):
    if not test:
        # load in any environment variables from .env
        load_dotenv()

    # create app
    app: Flask = Flask(__name__)
    
    # load CORS
    CORS(app)
    app.config["CORS_HEADERS"] = 'Content-Type'
    
    # convert environment variables to a URL
    db_url = sqlalchemy.URL(
        "postgresql+psycopg2", 
        username=os.environ["DB_USERNAME"],
        password=os.environ["DB_PASSWORD"],
        host=os.environ["DB_HOSTNAME"],
        database=os.environ["DB_DATABASE"],
        port=int(os.environ["DB_PORT"]),
        query={}, # type: ignore
    )

    # set database uri and additional configs
    app.config["SQLALCHEMY_DATABASE_URI"] = db_url.render_as_string(hide_password=False)
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "change-this-jwt-secret")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=15)
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)

    # init app
    db.init_app(app)
    jwt.init_app(app)

    from app.routes.certificate_routes import certificate_bp
    from app.routes.policy_routes import policy_bp
    from app.routes.evaluation_routes import evaluation_bp 
    from app.routes.auth_routes import auth_bp   
    from app.routes.report_routes import report_bp
    
    # initialise database schema
    with app.app_context():
        db.create_all()

    # load in blueprint
    app.register_blueprint(certificate_bp, url_prefix="/api/certificates")
    app.register_blueprint(policy_bp, url_prefix="/api/policies/")
    app.register_blueprint(evaluation_bp, url_prefix="/api/evaluate")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(report_bp, url_prefix="/api/reports")

    return app

