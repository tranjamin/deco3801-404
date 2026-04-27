import time
from app import db


class DomainVisit(db.Model):
    __tablename__ = "domain_visits"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    domain = db.Column(db.String(255), nullable=False, index=True)
    visited_at = db.Column(db.Float, nullable=False, default=time.time, index=True)

    certificate_id = db.Column(db.Integer, db.ForeignKey("tls_certificates.id"), nullable=True)
    protocol = db.Column(db.String(50), nullable=True)
    cipher = db.Column(db.String(100), nullable=True)
    issuer = db.Column(db.String(255), nullable=True)
    subject_name = db.Column(db.String(255), nullable=True)
    valid_from = db.Column(db.Float, nullable=True)
    valid_to = db.Column(db.Float, nullable=True)

    evaluation_passed = db.Column(db.Boolean, nullable=False, default=False)
    issues_found = db.Column(db.JSON, nullable=False, default=list)
    days_until_expiry = db.Column(db.Float, nullable=True)

    policy_results = db.Column(db.JSON, nullable=False, default=list)

    user_agent = db.Column(db.Text, nullable=True)
    tab_id = db.Column(db.Integer, nullable=True)

    certificate = db.relationship("TLSCertificate", backref="visits")

    def to_dict(self):
        return {
            "id": self.id,
            "domain": self.domain,
            "visited_at": self.visited_at,
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
    def from_certificate_evaluation(domain, cert, evaluation_result, policy_results=None, user_agent=None, tab_id=None):
        now = time.time()

        return DomainVisit(
            domain=domain,
            visited_at=now,
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
