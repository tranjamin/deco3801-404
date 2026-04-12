from __future__ import annotations
import enum
from app import db
from typing import *
import time
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
    def lookup_str2int(cls):
        return {x[0] : x[1] for x in cls.__members__}

    @classmethod
    @functools.cache
    def lookup_int2str(cls):
        return {x[1] : x[0] for x in cls.__members__}
    
    def encode(protocols: list[str]) -> int:
        """Convert a list of protocols to a bitvector"""
        valid_protocols: int = 0
        for ele in protocols:
            valid_protocols |= (1 << Protocols.lookup_str2int()[ele])
            
        return valid_protocols
    
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
        valid_protocols (integer): the protocols which are considered valid, encoded as a bitvector
        valid_subjects (ARRAY(string[50])): subjects which are considered valid
        valid_sans (): ?
        valid_issuers (): certificate authorities whcih are considered valid
        validity_lifespan (integer): the number of days certificates are valid for
        still_valid_lifespan (integer): minimum number of days a certificate must still be valid for 
        has_sct (bool): ?
        
    Inherits from:
        flask_sqlalchemy.extension.SQLAlchemy
    """

    # defines the table name
    __tablename__ = "certificate_policies"

    # defines the column tables, refer to docstring for details
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    valid_protocols = db.Column(db.Integer, nullable=False)
    valid_subjects = db.Column(ARRAY(db.String(255)), nullable=False)
    valid_issuers = db.Column(ARRAY(db.String(255)), nullable=False)
    validity_lifespan = db.Column(db.Integer, nullable=False)
    still_valid_lifespan = db.Column(db.Integer, nullable=False)
    has_sct = db.Column(db.Boolean, nullable=False)
    
    # TODO: determine whether to link the valid_sans to another table or just have it as a string
    valid_sans = db.Column(ARRAY(db.String(255)), nullable=False)

    def to_dict(self) -> dict[str, Any]:
        """Converts the data from an SQL table to a dictionary"""
        return {
            "id": self.id,
            "valid_protocols": Protocols.decode(self.valid_protocols),
            "valid_subjects": self.valid_subjects,
            "valid_issuers": self.valid_issuers,
            "validity_lifespan": self.validity_lifespan,
            "still_valid_lifespan": self.still_valid_lifespan,
            "has_sct": self.has_sct,
            "valid_sans": self.valid_sans,
        }
        
    @staticmethod
    def from_dict(data: dict[str, Any]) -> CertificatePolicy | None:
        """Creates a TLSCertificate instance from a dictionary. Returns None if dictionary is invalid"""

        # TODO: perform data cleaning and checking first. return None if invalid

        policy = CertificatePolicy(
            valid_protocols=Protocols.encode(data["valid_protocols"]),
            valid_subjects=data["valid_subjects"],
            valid_issuers=data.get("valid_issuers"),
            validity_lifespan=data["validity_lifespan"],
            still_valid_lifespan=data.get("still_valid_lifespan"),
            has_sct=data["has_sct"],
            valid_sans=data["valid_sans"],
        )

        return policy

class EvaluationResult(db.Model):
    """
    
    """
    
    