import enum
from app import db


class CertificateTransparencyCompliance(enum.Enum):
    unknown = "unknown"
    not_compliant = "not-compliant"
    compliant = "compliant"


class TLSCertificate(db.Model):
    """
    Stores TLS security details for a request, mirroring Network.SecurityDetails
    from the Chrome DevTools Protocol.
    """
    __tablename__ = "tls_certificates"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # TLS connection details
    protocol = db.Column(db.String(50), nullable=False)           # e.g. "TLS 1.2", "QUIC"
    key_exchange = db.Column(db.String(100), nullable=False)
    key_exchange_group = db.Column(db.String(100), nullable=True)  # optional
    cipher = db.Column(db.String(100), nullable=False)
    mac = db.Column(db.String(100), nullable=True)                 # optional; AEAD ciphers omit this

    # Certificate identity
    certificate_id = db.Column(db.Integer, nullable=False)         # Security.CertificateId
    subject_name = db.Column(db.String(255), nullable=False)
    issuer = db.Column(db.String(255), nullable=False)

    # Certificate validity window (Unix timestamps / TimeSinceEpoch)
    valid_from = db.Column(db.Float, nullable=False)
    valid_to = db.Column(db.Float, nullable=False)

    # Transparency & algorithm
    certificate_transparency_compliance = db.Column(
        db.Enum(CertificateTransparencyCompliance),
        nullable=False,
    )
    server_signature_algorithm = db.Column(db.Integer, nullable=True)  # TLS SignatureScheme; optional
    encrypted_client_hello = db.Column(db.Boolean, nullable=False, default=False)

    # One-to-many: Subject Alternative Names
    san_entries = db.relationship(
        "SANEntry", back_populates="certificate", cascade="all, delete-orphan"
    )

    # One-to-many: Signed Certificate Timestamps
    sct_list = db.relationship(
        "SignedCertificateTimestamp", back_populates="certificate", cascade="all, delete-orphan"
    )

    def to_dict(self):
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


class SANEntry(db.Model):
    """
    Stores Subject Alternative Name (SAN) DNS names and IP addresses
    for a TLS certificate (Network.SecurityDetails.sanList).
    """
    __tablename__ = "san_entries"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    certificate_fk = db.Column(
        db.Integer, db.ForeignKey("tls_certificates.id"), nullable=False
    )
    name = db.Column(db.String(255), nullable=False)  # DNS name or IP address

    certificate = db.relationship("TLSCertificate", back_populates="san_entries")


class SignedCertificateTimestamp(db.Model):
    """
    Stores a single Signed Certificate Timestamp (SCT) entry
    from Network.SecurityDetails.signedCertificateTimestampList.
    """
    __tablename__ = "signed_certificate_timestamps"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    certificate_fk = db.Column(
        db.Integer, db.ForeignKey("tls_certificates.id"), nullable=False
    )

    status = db.Column(db.String(50), nullable=False)        # e.g. "verified", "invalid"
    origin = db.Column(db.String(50), nullable=False)        # e.g. "embedded", "tls-extension"
    log_description = db.Column(db.String(255), nullable=True)
    log_id = db.Column(db.String(255), nullable=True)
    timestamp = db.Column(db.Float, nullable=False)          # TimeSinceEpoch
    hash_algorithm = db.Column(db.String(50), nullable=True)
    signature_algorithm = db.Column(db.String(50), nullable=True)
    signature_data = db.Column(db.Text, nullable=True)       # base64-encoded signature

    certificate = db.relationship("TLSCertificate", back_populates="sct_list")

    def to_dict(self):
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
