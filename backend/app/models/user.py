from __future__ import annotations

from app import db
from typing import *
from werkzeug.security import check_password_hash, generate_password_hash


class User(db.Model):
    """The SQLAlchemy model for application users."""

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(80), nullable=False, unique=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)

    certificates = db.relationship("TLSCertificate", back_populates="user")
    policies = db.relationship("CertificatePolicy", back_populates="user")

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password, method="pbkdf2:sha256")

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "username": self.username,
            "certificateIds": [certificate.id for certificate in self.certificates],
            "policyIds": [policy.id for policy in self.policies],
        }
