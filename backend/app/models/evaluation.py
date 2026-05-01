from __future__ import annotations

# from app.models.policy import CertificatePolicy
# from app.models.certificate import TLSCertificate
from app.models.utils import Flags, CertificateTransparencyCompliance, Protocols

from typing import Dict, Any, Tuple
import time

def evaluate_against_policy(cert: 'TLSCertificate', policy: 'CertificatePolicy') -> Tuple[int, Dict[str, Any]]:
    """
    Evaluate a TLS certificate against a certificate policy.

    Returns a dictionary with the following keys:
        is_expired (bool)
        days_until_expiry (int)
        issues (list[str])
        pass (bool)
    Also returns a bitector corresponding to the issues found
    """
    
    # stores issues in a bitvector
    warnings: int = 0
    
    # calculate time
    now: float = time.time()
    days_until_expiry: int = int(cert.valid_to - now) // 86400 # seconds to days

    # check expiry date
    if cert.valid_to < now:
        warnings |= (1 << Flags.WARN_EXPIRED.value[0])
    elif days_until_expiry < policy.min_certificate_days_left:
        warnings |= (1 << Flags.WARN_EXPIRING.value[0])
    
    if (cert.valid_from - cert.valid_to) // 86400 < policy.min_certificate_lifespan:
        warnings |= (1 << Flags.WARN_SHORT_LIFESPAN.value[0])

    # check if protocols are weak
    if cert.protocol not in Protocols.decode(policy.valid_protocols):
        warnings |= (1 << Flags.WARN_PROTOCOL.value[0])

    # check for valid subjects
    if cert.subject_name not in policy.valid_subjects:
        warnings |= (1 << Flags.WARN_SUBJECT_NAME.value[0])
    
    if cert.issuer not in policy.valid_issuers:
        warnings |= (1 << Flags.WARN_ISSUER.value[0])
    
    if cert.certificate_transparency_compliance == CertificateTransparencyCompliance.NON_COMPLIANT:
        warnings |= (1 << Flags.WARN_SECURITY_COMPLIANCE.value[0])

    return warnings, {
        "isExpired": bool(warnings & 1),
        "daysUntilExpiry": days_until_expiry,
        "issues": Flags.decode(warnings),
        "pass": not bool(warnings),
    }
