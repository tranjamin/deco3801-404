from __future__ import annotations
from typing import Any, List

from app import db
from sqlalchemy.orm import Mapped
from werkzeug.security import check_password_hash, generate_password_hash
from app.models.certificate import TLSCertificate
from app.models.policy import CertificatePolicy

USER_NAME_MAXLEN = 80
USER_PASS_MAXLEN = 255

class User(db.Model):
    """
    The SQLAlchemy database model corresponding to the SQL table storing application users.
    Each instance of this class represents one row of data.

    Database columns:
        id (integer): the primary key for the user, set to autoincrement
        username (string[80]): the unique username for the user
        password_hash (string[255]): the hashed password for the user

    Inherits from:
        flask_sqlalchemy.extension.SQLAlchemy
    """

    # defines the table name
    __tablename__: str = "users"

    # defines the column tables, refer to docstring for details
    id: Mapped[int] = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = db.Column(db.String(USER_NAME_MAXLEN), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = db.Column(db.String(USER_PASS_MAXLEN), nullable=False)

    # relationships
    certificates: Mapped[List[TLSCertificate]] = db.relationship("TLSCertificate", back_populates="user")
    policies: Mapped[List[CertificatePolicy]] = db.relationship("CertificatePolicy", back_populates="user")

    def __init__(self, **kwargs: Any):
        super().__init__(**kwargs)

    def set_password(self, password: str) -> None:
        """Hashes and sets the user's password."""
        self.password_hash = generate_password_hash(password, method="pbkdf2:sha256")

    def check_password(self, password: str) -> bool:
        """Verifies a password against the stored hash."""
        return check_password_hash(self.password_hash, password)

    def to_dict(self) -> dict[str, Any]:
        """Converts the data from an SQL table to a dictionary"""
        return {
            "id": self.id,
            "username": self.username,
            "certificates": [certificate.id for certificate in self.certificates],
            "policies": [policy.id for policy in self.policies],
        }

    @staticmethod
    def from_dict(data: dict[str, Any]) -> User | None:
        """        
        Creates a User instance from a dictionary. Returns None if dictionary is invalid, on the following conditions:
            - Fields have the incorrect data type
            - Required fields are missing (username, password)
        """
        
        ##
        if isinstance(data.get("username"), str) and data.get("username"):
            data["username"] = data["username"][:USER_NAME_MAXLEN]
        else:
            return None

        ##
        if not isinstance(data.get("password"), str) or not data.get("password"):
            return None

        user = User(
            username=data.get("username")
        )
        user.set_password(data["password"])
        
        return user