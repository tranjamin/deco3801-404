from __future__ import annotations
import enum
from app import db
from sqlalchemy.orm import Mapped
from typing import Dict, Any, List
import time

class CertificateConfig():
    WEAK_CIPHERS: set[str] = {"RC4", "DES", "3DES", "NULL", "EXPORT", "MD5"}
    WEAK_PROTOCOLS: set[str] = {"SSL 2.0", "SSL 3.0", "TLS 1.0", "TLS 1.1"}
    DAYS_TIL_EXPIRY_WARN: int = 30

class CertificateTransparencyCompliance(enum.Enum):
    """
    An enumerated class to define whether a certificate has been evaluated as compliant or noncompliant. Defined by strings.

    Values --> string:
        UNKNOWN --> unknown
        NON_COMPLIANT --> not-compliant
        COMPLIANT --> compliant
    """
    UNKNOWN = "unknown"
    NON_COMPLIANT = "not-compliant"
    COMPLIANT = "compliant"

class TLSCertificate(db.Model):
    """
    The SQLAlchemy database model corresponding to the SQL table storing TLS Certificate Data.
    Each instance of this class represents one row of data.

    Database columns:
        id (integer): the primary key for the certificate, set to autoincrement
        protocol (string[50]): ?
        key_exchange (string[50]): ?
        key_exchange_group (string[50]): [optional] ?
        cipher (string[50]): ?
        mac (string[100]): [optional] ?
        certificate_id (integer): ?
        subject_name (string[255]): ?
        issuer (string[255]): the issuer of the certificate
        valid_from (float): the timestamp that the certificate was issued
        valid_to (float): the timestamp that the certificate expires at
        certificate_transparency_compliance (enum): whether the certificate was marked as compliant or not
        server_signature_algorithm (integer): [optional] ?
        encrypted_client_hello (bool): [default False] ?

    Inherits from:
        flask_sqlalchemy.extension.SQLAlchemy
    """

    # defines the table name
    __tablename__: str = "tls_certificates"

    # defines the column tables, refer to docstring for details
    id: Mapped[int] = db.Column(db.Integer, primary_key=True, autoincrement=True)
    protocol: Mapped[str] = db.Column(db.String(50), nullable=False)
    key_exchange: Mapped[str] = db.Column(db.String(100), nullable=False)
    key_exchange_group: Mapped[str] = db.Column(db.String(100), nullable=True)
    cipher: Mapped[str] = db.Column(db.String(100), nullable=False)
    mac: Mapped[str] = db.Column(db.String(100), nullable=True)
    certificate_id: Mapped[int] = db.Column(db.Integer, nullable=False)
    subject_name: Mapped[str] = db.Column(db.String(255), nullable=False)
    issuer: Mapped[str] = db.Column(db.String(255), nullable=False)
    valid_from: Mapped[float] = db.Column(db.Float, nullable=False)
    valid_to: Mapped[float] = db.Column(db.Float, nullable=False)
    certificate_transparency_compliance: Mapped[CertificateTransparencyCompliance] = db.Column(
        db.Enum(CertificateTransparencyCompliance),
        nullable=False,
    )
    server_signature_algorithm: Mapped[int] = db.Column(db.Integer, nullable=True)
    encrypted_client_hello: Mapped[bool] = db.Column(db.Boolean, nullable=False, default=False)

    # links this table with the SAN entries table
    # san_entries is a list of SANEntry instances, cascading all changes and deleting unowned entries
    san_entries: Mapped[List[SANEntry]] = db.relationship(
        "SANEntry", back_populates="certificate", cascade="all, delete-orphan"
    ) # type: ignore

    # links this table with the SAN entries table
    # san_entries is a list of SANEntry instances, cascading all changes and deleting unowned entries
    sct_list: Mapped[List[SignedCertificateTimestamp]] = db.relationship(
        "SignedCertificateTimestamp", back_populates="certificate", cascade="all, delete-orphan"
    ) # type: ignore

    def __init__(self, **kwargs: Any):
        super().__init__(**kwargs)

    def to_dict(self) -> dict[str, Any]:
        """Converts the data from an SQL table to a dictionary"""
        return {
            "id": self.id,
            "protocol": self.protocol,
            "keyExchange": self.key_exchange,
            "keyExchangeGroup": self.key_exchange_group,
            "cipher": self.cipher,
            "mac": self.mac,
            "certificateId": self.certificate_id,
            "subjectName": self.subject_name,
            "sanList": [s.name for s in self.san_entries],
            "issuer": self.issuer,
            "validFrom": self.valid_from,
            "validTo": self.valid_to,
            "signedCertificateTimestampList": [sct.to_dict() for sct in self.sct_list],
            "certificateTransparencyCompliance": self.certificate_transparency_compliance.value,
            "serverSignatureAlgorithm": self.server_signature_algorithm,
            "encryptedClientHello": self.encrypted_client_hello,
        }
        
    @staticmethod
    def from_dict(data: dict[str, Any]) -> TLSCertificate | None:
        """Creates a TLSCertificate instance from a dictionary. Returns None if dictionary is invalid"""

        # TODO: perform data cleaning and checking first. return None if invalid

        # calculate 
        cert = TLSCertificate(
            protocol=data.get("protocol", ""),
            key_exchange=data.get("keyExchange", ""),
            key_exchange_group=data.get("keyExchangeGroup", None),
            cipher=data.get("cipher", ""),
            mac=data.get("mac"),
            certificate_id=data.get("certificateId", 0),
            subject_name=data.get("subjectName", ""),
            issuer=data.get("issuer", ""),
            valid_from=data.get("validFrom", 0.0),
            valid_to=data.get("validTo", 0.0),
            certificate_transparency_compliance=CertificateTransparencyCompliance(
                data.get("certificateTransparencyCompliance", "unknown")
            ),
            server_signature_algorithm=data.get("serverSignatureAlgorithm"),
            encrypted_client_hello=data.get("encryptedClientHello", False),
        )

        # register any SANs
        for san in data.get("sanList", []):
            cert.san_entries.append(SANEntry(name=san))

        # register any timestampes
        for sct_data in data.get("signedCertificateTimestampList", []):
            cert.sct_list.append(
                SignedCertificateTimestamp(
                    status=sct_data["status"],
                    origin=sct_data["origin"],
                    log_description=sct_data.get("logDescription"),
                    log_id=sct_data.get("logId"),
                    timestamp=sct_data["timestamp"],
                    hash_algorithm=sct_data.get("hashAlgorithm"),
                    signature_algorithm=sct_data.get("signatureAlgorithm"),
                    signature_data=sct_data.get("signatureData"),
                )
            )

        return cert
    
    def evaluate_cert(self) -> Dict[str, Any]:
        """
        Evaluate a TLS certificate against the default policy.

        Returns a dictionary with the following keys:
            is_expired (bool)
            days_until_expiry (int)
            issues (list[str])
            pass (bool)
        """

        # stores any issues with the certificate we have detected
        issues: List[str] = []
        
        # calculate time
        now: float = time.time()
        days_until_expiry: int = int(self.valid_to - now) // 86400 # seconds to days

        # check expiry date
        if self.valid_to < now:
            issues.append("expired")
        elif days_until_expiry < CertificateConfig.DAYS_TIL_EXPIRY_WARN:
            issues.append("expiring_soon")

        # check if protocols are weak
        if self.protocol in CertificateConfig.WEAK_PROTOCOLS:
            issues.append("weak_protocol")

        # check if ciphers are weak
        if any(w in self.cipher.upper() for w in CertificateConfig.WEAK_CIPHERS):
            issues.append("weak_cipher")

        # check if certificate transparency is compliant
        if self.certificate_transparency_compliance == CertificateTransparencyCompliance.NON_COMPLIANT:
            issues.append("not_ct_compliant")

        return {
            "is_expired": self.valid_to < now,
            "days_until_expiry": days_until_expiry,
            "issues": issues,
            "pass": len(issues) == 0,
        }

class SANEntry(db.Model):
    """
    The SQLAlchemy database model corresponding to the SQL table storing SAN Entries.
    Each SAN (Subject Alternative Name) specifies additional host names that this TLS certificate certifies 
    Each instance of this class represents one row of data.

    Database columns:
        id (integer): the primary key for the SAN Entry, set to autoincrement
        certificate_fk (integer): the foreign key for the ::class::`TLSCertificate` entry this SAN belongs to
        name (string[255]): the subject alternative name registered for a TLS certificate

    Inherits from:
        flask_sqlalchemy.extension.SQLAlchemy
    """

    # defines the table name
    __tablename__: str = "san_entries"

    # defines the table columns, see docstring for details
    id: Mapped[int] = db.Column(db.Integer, primary_key=True, autoincrement=True)
    certificate_fk: Mapped[int] = db.Column(db.Integer, db.ForeignKey("tls_certificates.id"), nullable=False)
    name: Mapped[str] = db.Column(db.String(255), nullable=False)

    # links this table with the TLS certificate table
    # the certificate attribute here is the instance of TLSCertificate
    certificate = db.relationship("TLSCertificate", back_populates="san_entries")

    def __init__(self, **kwargs: Any):
        super().__init__(**kwargs)

class SignedCertificateTimestamp(db.Model):
    """
    The SQLAlchemy database model corresponding to the SQL table storing Signed Certificate Timestamps.
    Each instance of this class represents one row of data.

    Database columns:
        id (integer): the primary key for the timestamp, set to autoincrement
        certificate_fk (integer): the foreign key for the ::class::`TLSCertificate` entry this timestamp belongs to
        status (string[50]): ?
        origin (string[50]): ?
        log_description (string[255]): [optional] ?
        log_id (string[255]): [optional] ?
        timestamp (float): ?
        hash_algorithm (string[50]): [optional] ?
        signature_algorithm (string[50]): [optional] ?
        signature_data (text): [optional] ? 

    Inherits from:
        flask_sqlalchemy.extension.SQLAlchemy
    """

    # defines the table name
    __tablename__ = "signed_certificate_timestamps"

    # defines the table columns, see docstring for details
    id: Mapped[int] = db.Column(db.Integer, primary_key=True, autoincrement=True)
    certificate_fk: Mapped[int] = db.Column(db.Integer, db.ForeignKey("tls_certificates.id"), nullable=False)
    status: Mapped[str] = db.Column(db.String(50), nullable=False)
    origin: Mapped[str] = db.Column(db.String(50), nullable=False)
    log_description: Mapped[str] = db.Column(db.String(255), nullable=True)
    log_id: Mapped[str] = db.Column(db.String(255), nullable=True)
    timestamp: Mapped[float] = db.Column(db.Float, nullable=False)
    hash_algorithm: Mapped[str] = db.Column(db.String(50), nullable=True)
    signature_algorithm: Mapped[str] = db.Column(db.String(50), nullable=True)
    signature_data: Mapped[str] = db.Column(db.Text, nullable=True)

    # links this table with the TLS certificate table
    # the certificate attribute here is the instance of TLSCertificate
    certificate: Mapped[List[TLSCertificate]] = db.relationship("TLSCertificate", back_populates="sct_list") # type: ignore
    
    def __init__(self, **kwargs: Any):
        super().__init__(**kwargs)

    def to_dict(self) -> dict[str, Any]:
        """Converts the data from an SQL table entry to a dictionary"""
        return {
            "status": self.status,
            "origin": self.origin,
            "logDescription": self.log_description,
            "logId": self.log_id,
            "timestamp": self.timestamp,
            "hashAlgorithm": self.hash_algorithm,
            "signatureAlgorithm": self.signature_algorithm,
            "signatureData": self.signature_data,
        }
