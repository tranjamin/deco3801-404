from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
import sqlalchemy
import os
from datetime import timedelta
# import psycopg2
from dotenv import load_dotenv

HELP_STRING = """
<h2>API Endpoints:</h2>
<br>    /api/certificates/ : top-level route for retrieving certificates
<br>        [GET] / : retrieves all certificates. returns a list of certificate JSONs
<br>        [GET] /&lt;id&gt; : retrieves a certificate by ID. returns a certificate JSON
<br>        [POST] / : stores a certificate. requires a certificate JSON and returns the stored certificate's JSON
<br>        [DELETE] /&lt;id&gt; : deletes a certificate by ID. returns {"message": &lt;message&gt;}
<br>         
<br>    /api/policies/ : top-level route for retrieving policies
<br>        [GET] / : retrieves all policies. returns a list of policy JSONs
<br>        [GET] /&lt;id&gt; : retrieves a policy by ID. returns a policy JSON
<br>        [POST] / : stores a policy. requires a policy JSON and returns the stored policy's JSON
<br>        [DELETE] /&lt;id&gt; : deletes a policy by ID. returns {"message": &lt;message&gt;}
<br>        [PUT] /&lt;id&gt;/active : sets if a policy is active or not. requires a {"active": &lt;true/false&gt;} and returns {"message": &lt;message&gt;}
<br>        [PUT] /&lt;id&gt;/update : updates a policy with new details. requires a policy JSON and returns {"message": <message>}
<br>
<br>    /api/evaluate/ : top-level route for evaluating certificates against policies
<br>        [GET] / : evaluates a policy. requires a {"certificate_id": &ltcertificate_id&gt, "policy_id": &ltpolicy_id&gt} and returns an Evaluation Result

<h2>Required Data Formats:</h2>
<br>
<br>Certificate JSON:
<br>"id": integer - only in response, ignored in request
<br>"protocol": choice of either "tls 1.0", "tls 1.1", "tls 1.2", "tls 1.3", "quic"
<br>"cipher": string (max 50)
<br>"subjectName": string (max 50)
<br>"sanList": list of strings (max 50)
<br>"issuer": string (max 50)
<br>"validFrom": float
<br>"validTo": float
<br>"url": string (max 255)
<br>"issues": list of strings
<br>
<br>Policy JSON:
<br>"id": integer - only in response, ignored in request
<br>"active": boolean - only in response, ignored in request
<br>"description": string (max 255)
<br>"name": string (max 50)
<br>"domains": list of strings (max 50)
<br>
<br>"validProtocols": list of the following options: "tls 1.0", "tls 1.1", "tls 1.2", "tls 1.3"
<br>"validSubjects": list of string(max 50)
<br>"validIssuers": list of string(max 50)
<br>"validSans": list of string(max 50)
<br>"validCiphers": list of string(max 50)
<br>"minCertificateLifespan": int (in days)
<br>"minCertificateDaysLeft": int
<br>
<br>Evaluation JSON:
<br> "isExpired": bool, True if certificate has expired
<br> "daysUntilExpiry": int (in days)
<br> "issues": list of issues flagged, in the format specified by `class:Flags`
<br> "pass": bool, True if all checks passed
"""

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
    
    @app.route("/")
    def info():
        return HELP_STRING
    
    @app.route("/DANGER/DELETE", methods=["GET"])
    def delete_database():
        """
        API endpoint which deletes the policy database. ONLY USED FOR ADMIN

        URL:
            /DANGER/DELETE
        Methods Supported:
            GET
        Returns:
            On success: TODO
            On failure: TODO
        """
        db.session.execute(sqlalchemy.text(f"DROP TABLE tls_certificates CASCADE;"))
        db.session.execute(sqlalchemy.text("DROP TABLE certificate_policies CASCADE;"))
        db.session.commit()
        # db.drop_all()
        return "Success", 200

    # convert environment variables to a URL
    # print("Creating database URL...")
    db_url = sqlalchemy.URL(
        "postgresql+psycopg2", 
        username=os.environ["DB_USERNAME"],
        password=os.environ["DB_PASSWORD"],
        host=os.environ["DB_HOSTNAME"],
        database=os.environ["DB_DATABASE"],
        port=int(os.environ["DB_PORT"]),
        query={}, # type: ignore
    )
    # print(f"Created database URL {db_url.render_as_string(hide_password=True)}")

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

