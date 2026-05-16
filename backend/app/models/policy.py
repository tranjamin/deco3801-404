from __future__ import annotations
from typing import Any, List

from app import db
from sqlalchemy.orm import Mapped
from sqlalchemy.dialects.postgresql import ARRAY

from app.models.utils import Protocols

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.user import User

POLICY_NAME_MAXLEN = 50
POLICY_DESC_MAXLEN = 255
POLICY_SUBJ_MAXLEN = 50
POLICY_ISSU_MAXLEN = 50
POLICY_CIPH_MAXLEN = 50
POLICY_DOMA_MAXLEN = 50
POLICY_MAX_ARRAY_SIZE = 50

class CertificatePolicy(db.Model):
    """
    The SQLAlchemy database model corresponding to the SQL table storing a certificate policy.
    Each instance of this class represents one row of data.

    Database columns:
        id (integer): the primary key for the certificate, set to autoincrement
        active (bool): if this policy is active
        description (string[255]): a description of this policy
        name (string[50]): the name of this policy
        
        valid_protocols (integer): the protocols which are considered valid, encoded as a bitvector
        valid_subjects (ARRAY(string[50])): subjects which are considered valid
        valid_issuers (ARRAY(string[50])): certificate authorities which are considered valid
        valid_ciphers (ARRAY(string[50])): ciphers which are valid
        valid_domains (string[50]): the domains this policy applies to
        
        min_certificate_lifespan (integer): the minimum number of days certificates can be valid for
        min_certificate_days_left (integer): minimum number of days remaining a certificate must be valid for
    Inherits from:
        flask_sqlalchemy.extension.SQLAlchemy
    """

    # defines the table name
    __tablename__: str = "certificate_policies"

    # defines the column tables, refer to docstring for details
    id: Mapped[int] = db.Column(db.Integer, primary_key=True, autoincrement=True)
    active: Mapped[bool] = db.Column(db.Boolean, default=True, nullable=False)
    description: Mapped[str] = db.Column(db.String(POLICY_DESC_MAXLEN), nullable=False)
    name: Mapped[str] = db.Column(db.String(POLICY_NAME_MAXLEN), nullable=False)
    
    valid_protocols: Mapped[int] = db.Column(db.Integer, nullable=False)
    valid_subjects: Mapped[List[str]] = db.Column(ARRAY(db.String(POLICY_SUBJ_MAXLEN)), nullable=False)
    valid_issuers: Mapped[List[str]] = db.Column(ARRAY(db.String(POLICY_ISSU_MAXLEN)), nullable=False)
    valid_ciphers: Mapped[List[str]] = db.Column(ARRAY(db.String(POLICY_CIPH_MAXLEN)), nullable=False)
    valid_domains: Mapped[List[str]] = db.Column(ARRAY(db.String(POLICY_DOMA_MAXLEN)), nullable=False)
    
    min_certificate_lifespan: Mapped[int] = db.Column(db.Integer, nullable=False)
    min_certificate_days_left: Mapped[int] = db.Column(db.Integer, nullable=False)

    user_id: Mapped[int] = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    user: Mapped[User] = db.relationship("User", back_populates="policies") # type: ignore
    
    def __init__(self, **kwargs: Any):
        super().__init__(**kwargs)

    def to_dict(self) -> dict[str, Any]:
        """Converts the data from an SQL table to a dictionary"""
        return {
            "id": self.id,
            "active": self.active,
            "description": self.description,
            "name": self.name,
            
            "validProtocols": Protocols.decode(self.valid_protocols),
            "validSubjects": self.valid_subjects,
            "validIssuers": self.valid_issuers,
            "validCiphers": self.valid_ciphers,
            "domains": self.valid_domains,
            
            "minCertificateLifespan": self.min_certificate_lifespan,
            "minCertificateDaysLeft": self.min_certificate_days_left,
        }
        
    @staticmethod
    def from_dict(data: dict[str, Any]) -> CertificatePolicy | None:
        """
        Creates a TLSCertificate instance from a dictionary. Returns None if dictionary is invalid, on the following conditions:
            - Fields have the incorrect data type (lists can be parsed from strings)
            - All missing data is allowed and replaced with defaults
            - Lifespan data is <0
        """

        data = data.copy()

        # trim down all strings to their required length. modifies the data
        # ensure correct data types
        
        ## 
        if isinstance(data.get("name", "Unnamed Policy"), str):
            data["name"] = data.get("name", "Unnamed Policy")[:POLICY_NAME_MAXLEN]
        else:
            return None
        
        ##
        if isinstance(data.get("description", "No description provided"), str):
            data["description"] = data.get("description", "No description provided")[:POLICY_DESC_MAXLEN]
        else:
            return None
        
        ##
        if isinstance(data.get("validProtocols"), str):
            data["validProtocols"] = [data["validProtocols"]]
        elif not isinstance(data.get("validProtocols", []), list):
            return None 
        for protocol in data.get("validProtocols", []):
            if not isinstance(protocol, str):
                return None
        protocol_bv: int = Protocols.encode(data.get("validProtocols", []))
        
        ##
        if isinstance(data.get("validSubjects"), str):
            data["validSubjects"] = [data["validSubjects"][:POLICY_SUBJ_MAXLEN]]
        elif not isinstance(data.get("validSubjects", []), list):
            return None
        else:
            for subject in data.get("validSubjects", []):
                if not isinstance(subject, str):
                    return None
            data["validSubjects"] = [i[:POLICY_SUBJ_MAXLEN] for i in data.get("validSubjects", [])][:POLICY_MAX_ARRAY_SIZE]
        
        ##
        if isinstance(data.get("validIssuers"), str):
            data["validIssuers"] = [data["validIssuers"][:POLICY_ISSU_MAXLEN]]
        elif not isinstance(data.get("validIssuers", []), list):
            return None
        else:
            for issuers in data.get("validIssuers", []):
                if not isinstance(issuers, str):
                    return None
            data["validIssuers"] = [i[:POLICY_ISSU_MAXLEN] for i in data.get("validIssuers", [])][:POLICY_MAX_ARRAY_SIZE]
            
        ##
        if isinstance(data.get("validCiphers"), str):
            data["validCiphers"] = [data["validCiphers"][:POLICY_CIPH_MAXLEN]]
        elif not isinstance(data.get("validCiphers", []), list):
            return None
        else:
            for issuers in data.get("validCiphers", []):
                if not isinstance(issuers, str):
                    return None
            data["validCiphers"] = [i[:POLICY_CIPH_MAXLEN] for i in data.get("validCiphers", [])][:POLICY_MAX_ARRAY_SIZE]
        
        ##
        if isinstance(data.get("domains"), str):
            data["domains"] = [data["domains"][:POLICY_DOMA_MAXLEN]]
        elif not isinstance(data.get("domains", []), list):
            return None
        else:
            for domains in data.get("domains", []):
                if not isinstance(domains, str):
                    return None
            data["domains"] = [i[:POLICY_DOMA_MAXLEN] for i in data.get("domains", [])][:POLICY_MAX_ARRAY_SIZE]
        
        ##
        if not isinstance(data.get("minCertificateLifespan", 0), int):
            return None
        elif data.get("minCertificateLifespan", 0) < 0:
            return None
        
        ##
        if not isinstance(data.get("minCertificateDaysLeft", 0), int):
            return None
        elif data.get("minCertificateDaysLeft", 0) < 0:
            return None
        
        # extraneous fields are ignored
        # any other errors are simply ignored or replaced by defaults in the constructor
        policy = CertificatePolicy(
            name=data.get("name", "Unnamed Policy"),
            description=data.get("description", "No description provided"),
            
            valid_protocols=protocol_bv,
            valid_subjects=data.get("validSubjects", []),
            valid_issuers=data.get("validIssuers", []),
            valid_ciphers=data.get("validCiphers", []),
            valid_domains=data.get("domains", []),
            
            min_certificate_lifespan=data.get("minCertificateLifespan", 0),
            min_certificate_days_left=data.get("minCertificateDaysLeft", 0),
        )

        return policy
    