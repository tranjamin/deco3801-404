from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import sqlalchemy
from typing import *
import os
import psycopg2
from dotenv import load_dotenv

HELP_STRING = """
<h2>API Endpoints:</h2>
<br>    /api/certificates/ : top-level route for retrieving certificates
<br>        [GET] / : retrieves all certificates. returns a list of certificate JSONs
<br>        [GET] /&lt;id&gt; : retrieves a certificate by ID. returns a certificate JSON
<br>        [POST] / : stores a certificate. requires a certificate JSON and returns the stored certificate's JSON
<br>        [DELETE] /&lt;id&gt; : deletes a certificate by ID. returns {"message": &lt;message&gt;}
<br>        [POST] /batch : creates multiple certificates. requires a {"certificates": &lt;list of certificate JSONs&gt;, returns {"created": &lt;number created&gt;, "ids": &lt;list of certificate IDs&gt;}
<br>        [GET] /expiring : gets certificates expiring soon. requires a {"days": &lt;max days until expiry&gt;} and returns {"days window": &lt;max days until expiry&gt;, "count": &lt;num certificates found&gt;, "certificates": &lt;list of certificate JSONs&gt;}
<br>        [GET] /expired : gets expired certificates. returns {"count": &lt;num certificates found&gt;, "certificates": &lt;list of certificate JSONs&gt;}
<br>        [GET] /search : gets a filtered list of certificates. requires a list of filters, {"subject": &lt;subject&gt;, "issuer": &lt;issuer&gt;, "protocol": &lt;protocol&gt;, "compliance": &lt;transparency compliance&gt;}, all optional, and returns {"count": &lt;num certificates found&gt;, "certificates": &lt;list of certificate JSONs&gt;}
<br>        [GET] /stats : gets statistics for the stored certificates. returns the following stats in a JSON: "total", "expiring_within_30_days", "expired", "with_issues", "by_compliance", "by_protocol".
<br>        [GET] /create_dummy : stores a dummy certificate when navigated to. returns the dummy certificate's JSON
<br>        [GET] /evaluate : evaluates the validity of a certificate against the default policy. Not fully implemented yet.      
<br>         
<br>    /api/policies/ : top-level route for retrieving policies
<br>        [GET] / : retrieves all policies. returns a list of policy JSONs
<br>        [GET] /&lt;id&gt; : retrieves a policy by ID. returns a policy JSON
<br>        [POST] / : stores a policy. requires a policy JSON and returns the stored policy's JSON
<br>        [DELETE] /&lt;id&gt; : deletes a policy by ID. returns {"message": &lt;message&gt;}
<br>        [PUT] /&lt;id&gt;/active : sets if a policy is active or not. requires a {"active": &lt;true/false&gt;} and returns {"message": &lt;message&gt;}
<br>        [POST] /batch : stores multiple policies. requires a {"policies": &lt;list of policy JSONs&gt;, returns {"created": &lt;number created&gt;, "ids": &lt;list of policy IDs&gt;}
<br>        [GET] /create_dummy : stores a dummy policy when navigated to. returns the dummy policy's JSON
<br>
<h2>Required Data Formats:</h2>
<br>
<br>Certificate JSON:
<br>"id": integer - only in response, ignored in request
<br>"protocol": choice of either "tls 1.0", "tls 1.1", "tls 1.2", "tls 1.3"
<br>"cipher": string (max 50)
<br>"subjectName": string (max 255)
<br>"sanList": list of strings (max 255)
<br>"issuer": string (max 255)
<br>"validFrom": float
<br>"validTo": float
<br>"mac": string (max 100)
<br>"certificateId": integer
<br>"keyExchange": string (max 50)
<br>"keyExchangeGroup": string (max 50), optional
<br>"signedCertificateTimestampList": ? only returned
<br>"certificateTransparencyCompliance": choice of "unknown", "not-compliant", or "compliant"
<br>"serverSignatureAlgorithm": integer
<br>"encryptedClientHello": boolean
<br>
<br>Policy JSON:
<br>"id": integer - only in response, ignored in request
<br>"active": boolean - only in response, ignored in request
<br>"description": string (max 255)
<br>"domain": string (max 50)
<br>
<br>"validProtocols": list of the following options: "tls 1.0", "tls 1.1", "tls 1.2", "tls 1.3"
<br>"validSubjects": list of string(max 50)
<br>"validIssuers": list of string(max 50)
<br>"validSans": list of string(max 50)
<br>"validCiphers": list of string(max 50)
<br>"minCertificateLifespan": int (in days)
<br>"minCertificateDaysLeft": int
<br>"needsSct": boolean
"""

# load in any environment variables from .env
load_dotenv()

db: "SQLAlchemy" = SQLAlchemy()

def create_app():
    # create app
    app: "Flask" = Flask(__name__)
    
    # load CORS
    CORS(app)
    app.config["CORS_HEADERS"] = 'Content-Type'
    
    @app.route("/")
    def info():
        return HELP_STRING

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
