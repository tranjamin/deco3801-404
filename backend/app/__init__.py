from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import sqlalchemy
from typing import *
import os
import psycopg2
from dotenv import load_dotenv

# load in any environment variables from .env
load_dotenv()

db: "SQLAlchemy" = SQLAlchemy()

def create_app():
    # create app
    app: "Flask" = Flask(__name__)

    # convert environment variables to a URL
    db_url = sqlalchemy.URL(
        "postgresql+psycopg2", 
        username=os.environ["DB_USERNAME"],
        password=os.environ["DB_PASSWORD"],
        host=os.environ["DB_HOSTNAME"],
        database=os.environ["DB_DATABASE"],
        port=os.environ["DB_PORT"],
        query={},
    )

    # set database uri and additional configs
    app.config["SQLALCHEMY_DATABASE_URI"] = db_url.render_as_string(hide_password=False)
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # init app
    db.init_app(app)

    from app.models import certificate, policy  # noqa: F401

    # initialise database schema
    with app.app_context():
        db.create_all()

    # load in blueprint
    from app.routes.certificate_routes import certificate_bp
    from app.routes.policy_routes import policy_bp
    
    app.register_blueprint(certificate_bp, url_prefix="/api/certificates")
    app.register_blueprint(policy_bp, url_prefix="/api/policies/")

    return app
