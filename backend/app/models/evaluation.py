from app.models.policy import CertificatePolicy, Protocols
from app.models.certificate import TLSCertificate, CertificateTransparencyCompliance

from __future__ import annotations
from typing import *
import time

def evaluate_against_policy(cert: TLSCertificate, policy: CertificatePolicy) -> dict:
    """
    Evaluate a TLS certificate against a certificate policy.

    Returns a dictionary with the following keys:
        is_expired (bool)
        days_until_expiry (int)
        issues (list[str])
        pass (bool)
    """

    # stores any issues with the certificate we have detected
    issues = []
    
    # calculate time
    now = time.time()
    days_until_expiry = (cert.valid_to - now) // 86400 # seconds to days

    # check expiry date
    if cert.valid_to < now:
        issues.append("expired")
    elif days_until_expiry < policy.still_valid_lifespan:
        issues.append("expiring_soon")
    
    if (cert.valid_from - cert.valid_to) // 86400 < policy.validity_lifespan:
        issues.append("lifespan_too_short")

    # check if protocols are weak
    if cert.protocol not in Protocols.decode(policy.valid_protocols):
        issues.append("weak_protocol")

    # check for valid subjects
    if cert.subject_name not in policy.valid_subjects:
        issues.append("incorrect subject name")
    
    if cert.issue not in policy.valid_issuers:
        issues.append("invalid issuer")
    
    if policy.has_sct and cert.certificate_transparency_compliance == CertificateTransparencyCompliance.NON_COMPLIANT:
        issues.append("noncompliant SCT")

    return {
        "is_expired": cert.valid_to < now,
        "days_until_expiry": days_until_expiry,
        "issues": issues,
        "pass": len(issues) == 0,
    }
