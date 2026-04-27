from __future__ import annotations
import enum
import stat
from app import db
<<<<<<< Updated upstream
from typing import Any
=======
from typing import *
>>>>>>> Stashed changes
import functools

from sqlalchemy.dialects.postgresql import ARRAY

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
    __tablename__ = "certificate_policies"

    # defines the column tables, refer to docstring for details
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    active = db.Column(db.Boolean, default=True, nullable=False)
    description = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    
    valid_protocols = db.Column(db.Integer, nullable=False)
    valid_subjects = db.Column(ARRAY(db.String(50)), nullable=False)
    valid_sans = db.Column(ARRAY(db.String(50)), nullable=False)
    valid_issuers = db.Column(ARRAY(db.String(50)), nullable=False)
    valid_ciphers = db.Column(ARRAY(db.String(50)), nullable=False)
    
    min_certificate_lifespan = db.Column(db.Integer, nullable=False)
    min_certificate_days_left = db.Column(db.Integer, nullable=False)
    
    needs_sct = db.Column(db.Boolean, nullable=False)  

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
        """Creates a TLSCertificate instance from a dictionary. Returns None if dictionary is invalid"""

        # TODO: perform data cleaning and checking first. return None if invalid

        policy = CertificatePolicy(
            name=data.get("name", "Unnamed Policy"),
            description=data.get("description", "No description provided"),
            
            valid_protocols=Protocols.encode(data.get("validProtocols", [])),
            valid_subjects=data.get("validSubjects", []),
            valid_issuers=data.get("validIssuers", []),
            valid_sans=data.get("validSans", []),
            valid_ciphers=data.get("validCiphers", []),
            
            min_certificate_lifespan=data.get("minCertificateLifespan", 0),
            min_certificate_days_left=data.get("minCertificateDaysLeft", 0),
            
            needs_sct=data.get("needsSct", False),
        )

        return policy
    