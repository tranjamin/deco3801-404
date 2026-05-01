from __future__ import annotations
import enum
from app import db
from sqlalchemy.orm import Mapped
from sqlalchemy.dialects.postgresql import ARRAY
from typing import Any, List

from app.models.utils import Flags, CertificateTransparencyCompliance
from app.models.policy import CertificatePolicy
from app.models.evaluation import evaluate_against_policy
from app.models.user import User

CERT_URL_MAXLEN = 255
CERT_PROT_MAXLEN = 50
CERT_CIPH_MAXLEN = 50
CERT_SUBJ_MAXLEN = 50
CERT_SANS_MAXLEN = 50
CERT_ISSU_MAXLEN = 50
CERT_MAX_SANS = 50

class TLSCertificate(db.Model):
    """
    The SQLAlchemy database model corresponding to the SQL table storing TLS Certificate Data.
    Each instance of this class represents one row of data.

    Database columns:
        id (integer): the primary key for the certificate, set to autoincrement
        issues (integer): the bitvector of issues this certificate has, evaluated on insertion
        url (string[255]): the url this certificate came from
        protocol (string[50]): the certificate protocol used
        cipher (string[50]): the cipher used
        subject_name (string[255]): the subject name of the certificate
        san_list (list(string[255])): the SANs associated with this certificate
        issuer (string[50]): the issuer of the certificate
        valid_from (float): the timestamp that the certificate was issued
        valid_to (float): the timestamp that the certificate expires at
        certificate_transparency_compliance (enum): whether the certificate was marked as compliant or not

    Inherits from:
        flask_sqlalchemy.extension.SQLAlchemy
    """

    # defines the table name
    __tablename__: str = "tls_certificates"

    # defines the column tables, refer to docstring for details
    id: Mapped[int] = db.Column(db.Integer, primary_key=True, autoincrement=True)
    issues: Mapped[int] = db.Column(db.Integer, nullable=False)
    url: Mapped[str] = db.Column(db.String(CERT_URL_MAXLEN), nullable=False)
    protocol: Mapped[str] = db.Column(db.String(CERT_PROT_MAXLEN), nullable=False)
    cipher: Mapped[str] = db.Column(db.String(CERT_CIPH_MAXLEN), nullable=False)
    subject_name: Mapped[str] = db.Column(db.String(CERT_SUBJ_MAXLEN), nullable=False)
    san_list: Mapped[List[str]] = db.Column(ARRAY(db.String(CERT_SANS_MAXLEN)), nullable=False)
    issuer: Mapped[str] = db.Column(db.String(CERT_ISSU_MAXLEN), nullable=False)
    valid_from: Mapped[float] = db.Column(db.Float, nullable=False)
    valid_to: Mapped[float] = db.Column(db.Float, nullable=False)
    certificate_transparency_compliance: Mapped[CertificateTransparencyCompliance] = db.Column(
        db.Enum(CertificateTransparencyCompliance),
        nullable=False,
    )

    user_id: Mapped[int] = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    user: Mapped[User] = db.relationship("User", back_populates="certificates")

    def __init__(self, **kwargs: Any):
        super().__init__(**kwargs)

    def to_dict(self) -> dict[str, Any]:
        """Converts the data from an SQL table to a dictionary"""
        return {
            "id": self.id,
            "issues": Flags.decode(self.issues),
            "url": self.url,
            "protocol": self.protocol,
            "cipher": self.cipher,
            "subjectName": self.subject_name,
            "sanList": self.san_list,
            "issuer": self.issuer,
            "validFrom": self.valid_from,
            "validTo": self.valid_to,
            "certificateTransparencyCompliance": self.certificate_transparency_compliance.value,
        }
        
    def evaluate_against_policies_and_store(self, policies: List[CertificatePolicy]):
        # evaluate against policies
        combined_bv: int = 0
                
        for policy in policies:
            bv, _ = evaluate_against_policy(self, policy)
            combined_bv |= bv
        
        self.issues = combined_bv
        
    @staticmethod
    def from_dict(data: dict[str, Any]) -> TLSCertificate | None:
        """        
        Creates a TLSCertificate instance from a dictionary. Returns None if dictionary is invalid, on the following conditions:
            - Fields have the incorrect data type (lists can be parsed from strings)
            - Some required fields are missing (url, protocol)
            - Times are incorrect or out of order
        """

        # trim down all strings to their required length. modifies the data
        # ensure correct data types
        
        ##
        if isinstance(data.get("url"), str):
            data["url"] = data["url"][:CERT_URL_MAXLEN]
        else:
            return None

        ##
        if isinstance(data.get("protocol"), str):
            data["protocol"] = data["protocol"][:CERT_PROT_MAXLEN]
        else:
            return None
        
        ##
        if isinstance(data.get("cipher", ""), str):
            data["cipher"] = data["cipher"][:CERT_CIPH_MAXLEN]
        else:
            return None
        
        ##
        if isinstance(data.get("subjectName", ""), str):
            data["subjectName"] = data["subjectName"][:CERT_SUBJ_MAXLEN]
        else:
            return None
        
        ##
        if isinstance(data.get("sanList"), str):
            data["sanList"] = [data["sanList"][:CERT_SANS_MAXLEN]]
        elif not isinstance(data.get("sanList", []), list):
            return None
        else:
            data["sanList"] = [i[:CERT_SANS_MAXLEN] for i in data["sanList"]][:CERT_MAX_SANS]
                
        ##
        if not isinstance(data.get("validFrom", -1), int):
            return None
        elif data.get("validFrom", -1) < 0:
            return None
        
        ##
        if not isinstance(data.get("validTo", -1), int):
            return None
        elif data.get("validTo", -1) <= data.get("validFrom", -1):
            return None

        ##
        if data.get("certificateTransparencyCompliance", "unknown") not in ["unknown", "not-compliant", "compliant"]:
            return None

        # calculate 
        cert = TLSCertificate(
            url=data.get("url", ""),
            protocol=data.get("protocol", ""),
            cipher=data.get("cipher", ""),
            subject_name=data.get("subjectName", ""),
            san_list=data.get("sanList", []),
            issuer=data.get("issuer", ""),
            valid_from=data.get("validFrom", 0.0),
            valid_to=data.get("validTo", 0.0),
            certificate_transparency_compliance=CertificateTransparencyCompliance(
                data.get("certificateTransparencyCompliance", "unknown")
            ),
        )
        return cert