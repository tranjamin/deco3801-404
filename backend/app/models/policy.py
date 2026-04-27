from __future__ import annotations
import enum
from app import db
from typing import Any, List
import functools
from sqlalchemy.orm import Mapped

from sqlalchemy.dialects.postgresql import ARRAY

POLICY_NAME_MAXLEN = 50
POLICY_DESC_MAXLEN = 255
POLICY_SUBJ_MAXLEN = 50
POLICY_SANS_MAXLEN = 50
POLICY_ISSU_MAXLEN = 50
POLICY_CIPH_MAXLEN = 50

class Protocols(enum.Enum):
    """
    An enumerated class to define different TLS protocols. Valid protocols are encoded by a bitvector and are enumerated by the format TLS<subversion nnumber>V<version number>.

    Values --> (bit position, string encoding):
        TLS1V0 --> (0, "tls 1.0")
        TLS1V1 --> (1, "tls 1.1")
        TLS1V2 --> (2, "tls 1.2")
        TLS1V3 --> (3, "tls 1.3")
    """
    TLS1V0 = (0, "tls 1.0")
    TLS1V1 = (1, "tls 1.1")
    TLS1V2 = (2, "tls 1.2")
    TLS1V3 = (3, "tls 1.3")
    
    @classmethod
    @functools.cache
    def lookup_str2int(cls) -> dict[str, int]:
        return {cls[x].value[1] : cls[x].value[0] for x in cls.__members__}

    @classmethod
    @functools.cache
    def lookup_int2str(cls) -> dict[int, str]:
        return {cls[x].value[0] : cls[x].value[1] for x in cls.__members__}
    
    @staticmethod
    def encode(protocols: list[str]) -> int:
        """Convert a list of protocols to a bitvector"""
        valid_protocols: int = 0
        for ele in protocols:
            if ele in Protocols.lookup_str2int().keys():
                valid_protocols |= (1 << Protocols.lookup_str2int()[ele])
            
        return valid_protocols
    
    @staticmethod
    def decode(bitvector: int) -> list[str]:
        """Convert a bitvector to a list of protocols"""
        valid_protocols: list[str] = []
        for i in range(len(Protocols)):
            if bitvector & (1 << i):
                valid_protocols.append(Protocols.lookup_int2str()[i])
        return valid_protocols

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
        valid_sans (ARRAY(string[50])): sans for this policy
        valid_issuers (ARRAY(string[50])): certificate authorities which are considered valid
        valid_ciphers (ARRAY(string[50])): ciphers which are valid
        
        min_certificate_lifespan (integer): the minimum number of days certificates can be valid for
        min_certificate_days_left (integer): minimum number of days remaining a certificate must be valid for
        
        needs_sct (bool): if certificates are required to have a SCT

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
    valid_sans: Mapped[List[str]] = db.Column(ARRAY(db.String(POLICY_SANS_MAXLEN)), nullable=False)
    valid_issuers: Mapped[List[str]] = db.Column(ARRAY(db.String(POLICY_ISSU_MAXLEN)), nullable=False)
    valid_ciphers: Mapped[List[str]] = db.Column(ARRAY(db.String(POLICY_CIPH_MAXLEN)), nullable=False)
    
    min_certificate_lifespan: Mapped[int] = db.Column(db.Integer, nullable=False)
    min_certificate_days_left: Mapped[int] = db.Column(db.Integer, nullable=False)
    
    needs_sct: Mapped[bool] = db.Column(db.Boolean, nullable=False)  

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
            "validSans": self.valid_sans,
            "validCiphers": self.valid_ciphers,            
            
            "minCertificateLifespan": self.min_certificate_lifespan,
            "minCertificateDaysLeft": self.min_certificate_days_left,
            
            "needsSct": self.needs_sct,
        }
        
    @staticmethod
    def from_dict(data: dict[str, Any]) -> CertificatePolicy | None:
        """
        Creates a TLSCertificate instance from a dictionary. Returns None if dictionary is invalid, on the following conditions:
            - Fields have the incorrect data type (lists can be parsed from strings)
            - Some required fields are missing (validProtocols, validSubjects)
        """

        # trim down all strings to their required length. modifies the data
        # ensure correct data types
        
        ## 
        if isinstance(data.get("name", ""), str):
            data["name"] = data["name"][:POLICY_NAME_MAXLEN]
        else:
            return None
        
        ##
        if isinstance(data.get("description", ""), str):
            data["description"] = data["description"][:POLICY_DESC_MAXLEN]
        else:
            return None
        
        ##
        if isinstance(data.get("validProtocols"), str):
            data["validProtocols"] = [data["validProtocols"]]
        elif not isinstance(data.get("validProtocols"), list):
            return None 
        protocol_bv: int = Protocols.encode(data.get("validProtocols", []))
        if not protocol_bv:
            return None
        
        ##
        if isinstance(data.get("validSubjects"), str):
            data["validSubjects"] = [data["validSubjects"][:POLICY_SUBJ_MAXLEN]]
        elif not isinstance(data.get("validSubjects"), list):
            return None
        else:
            data["validSubjects"] = [i[:POLICY_SUBJ_MAXLEN] for i in data["validSubjects"]]
        
        ##
        if isinstance(data.get("validIssuers"), str):
            data["validIssuers"] = [data["validIssuers"][:POLICY_ISSU_MAXLEN]]
        elif not isinstance(data.get("validIssuers"), list):
            return None
        else:
            data["validIssuers"] = [i[:POLICY_ISSU_MAXLEN] for i in data["validIssuers"]]
            
        ##
        if isinstance(data.get("validSans"), str):
            data["validSans"] = [data["validSans"][:POLICY_SANS_MAXLEN]]
        elif not isinstance(data.get("validSans"), list):
            return None
        else:
            data["validSans"] = [i[:POLICY_SANS_MAXLEN] for i in data["validSans"]]
            
        ##
        if isinstance(data.get("validCiphers"), str):
            data["validCiphers"] = [data["validCiphers"][:POLICY_CIPH_MAXLEN]]
        elif not isinstance(data.get("validCiphers"), list):
            return None
        else:
            data["validCiphers"] = [i[:POLICY_CIPH_MAXLEN] for i in data["validCiphers"]]
        
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
        
        ##
        if not isinstance(data.get("needsSct", False), bool):
            return None
        
        # extraneous fields are ignored
        # any other errors are simply ignored or replaced by defaults in the constructor
        policy = CertificatePolicy(
            name=data.get("name", "Unnamed Policy"),
            description=data.get("description", "No description provided"),
            
            valid_protocols=protocol_bv,
            valid_subjects=data.get("validSubjects", []),
            valid_issuers=data.get("validIssuers", []),
            valid_sans=data.get("validSans", []),
            valid_ciphers=data.get("validCiphers", []),
            
            min_certificate_lifespan=data.get("minCertificateLifespan", 0),
            min_certificate_days_left=data.get("minCertificateDaysLeft", 0),
            
            needs_sct=data.get("needsSct", False),
        )

        return policy
    