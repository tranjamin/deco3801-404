from __future__ import annotations

import time
from typing import Any, TYPE_CHECKING

from app import db
from sqlalchemy.orm import Mapped

if TYPE_CHECKING:
    from app.models.certificate import TLSCertificate
    from app.models.user import User


class DomainVisit(db.Model):
    __tablename__ = "domain_visits"

    id: Mapped[int] = db.Column(db.Integer, primary_key=True, autoincrement=True)
    domain: Mapped[str] = db.Column(db.String(255), nullable=False, index=True)
    visited_at: Mapped[float] = db.Column(
        db.Float, nullable=False, default=time.time, index=True
    )

    user_id: Mapped[int] = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=False
    )
    certificate_id: Mapped[int | None] = db.Column(
        db.Integer, db.ForeignKey("tls_certificates.id"), nullable=True
    )
    protocol: Mapped[str | None] = db.Column(db.String(50), nullable=True)
    cipher: Mapped[str | None] = db.Column(db.String(100), nullable=True)
    issuer: Mapped[str | None] = db.Column(db.String(255), nullable=True)
    subject_name: Mapped[str | None] = db.Column(db.String(255), nullable=True)
    valid_from: Mapped[float | None] = db.Column(db.Float, nullable=True)
    valid_to: Mapped[float | None] = db.Column(db.Float, nullable=True)

    evaluation_passed: Mapped[bool] = db.Column(
        db.Boolean, nullable=False, default=False
    )
    issues_found: Mapped[list[str]] = db.Column(db.JSON, nullable=False, default=list)
    days_until_expiry: Mapped[float | None] = db.Column(db.Float, nullable=True)

    policy_results: Mapped[list[dict[str, Any]]] = db.Column(
        db.JSON, nullable=False, default=list
    )

    user_agent: Mapped[str | None] = db.Column(db.Text, nullable=True)
    tab_id: Mapped[int | None] = db.Column(db.Integer, nullable=True)

    certificate: Mapped["TLSCertificate"] = db.relationship(
        "TLSCertificate", backref="visits"
    )
    user: Mapped["User"] = db.relationship("User", backref="domain_visits")

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "domain": self.domain,
            "visited_at": self.visited_at,
            "user_id": self.user_id,
            "certificate_id": self.certificate_id,
            "protocol": self.protocol,
            "cipher": self.cipher,
            "issuer": self.issuer,
            "subject_name": self.subject_name,
            "valid_from": self.valid_from,
            "valid_to": self.valid_to,
            "evaluation_passed": self.evaluation_passed,
            "issues_found": self.issues_found,
            "days_until_expiry": self.days_until_expiry,
            "policy_results": self.policy_results,
            "user_agent": self.user_agent,
            "tab_id": self.tab_id,
        }

    @staticmethod
    def from_certificate_evaluation(
        user_id: int,
        domain: str,
        cert: TLSCertificate | None,
        evaluation_result: dict[str, Any],
        policy_results: list[dict[str, Any]] | None = None,
        user_agent: str | None = None,
        tab_id: int | None = None,
    ) -> DomainVisit:
        return DomainVisit(
            user_id=user_id,
            domain=domain,
            visited_at=time.time(),
            certificate_id=cert.id if cert else None,
            protocol=cert.protocol if cert else None,
            cipher=cert.cipher if cert else None,
            issuer=cert.issuer if cert else None,
            subject_name=cert.subject_name if cert else None,
            valid_from=cert.valid_from if cert else None,
            valid_to=cert.valid_to if cert else None,
            evaluation_passed=evaluation_result.get("pass", False),
            issues_found=evaluation_result.get("issues", []),
            days_until_expiry=evaluation_result.get("days_until_expiry"),
            policy_results=policy_results or [],
            user_agent=user_agent,
            tab_id=tab_id,
        )
