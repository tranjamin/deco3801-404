from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.policy import CertificatePolicy
    from app.models.certificate import TLSCertificate
from app.models.utils import Flags, CertificateTransparencyCompliance, Protocols

from typing import Dict, Any, Tuple
import time
import re
import math

def evaluate_against_policy(cert: TLSCertificate, policy: CertificatePolicy) -> Tuple[int, Dict[str, Any]]:
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
    now: int = int(time.time())
    days_until_expiry: int = (cert.valid_to - now) // 86400 # seconds to days, rounded down

    # print(f"Evaluating against a policy {policy.to_dict()}")

    # check expiry date - either expired or under days until expiry
    if cert.valid_to < now:
        warnings |= (1 << Flags.WARN_EXPIRED.value[0])
        print(f"Issue: expired because .valid_to is {cert.valid_to} and now is {now}")
    elif days_until_expiry < policy.min_certificate_days_left:
        warnings |= (1 << Flags.WARN_EXPIRING.value[0])
        print(f"Issue: expiring because policy min certificate days left is {policy.min_certificate_days_left} days until expiry is {days_until_expiry}")
    
    # check to see if certificate lifespan is too short - but only if it is more than 0
    if policy.min_certificate_lifespan and ((cert.valid_to - cert.valid_from) // 86400 < policy.min_certificate_lifespan):
        warnings |= (1 << Flags.WARN_SHORT_LIFESPAN.value[0])
        print(f"Issue: certificate lifespan because policy min certificate lifespan is {policy.min_certificate_lifespan} and lifespan is {(cert.valid_to - cert.valid_from) // 86400}")

    # check if protocols are weak - but only if there is at least one valid protocol
    if policy.valid_protocols and (cert.protocol not in Protocols.decode(policy.valid_protocols)):
        warnings |= (1 << Flags.WARN_PROTOCOL.value[0])
        print(f"Issue: protocol is {cert.protocol} and allowed protocols are {Protocols.decode(policy.valid_protocols)}")

    # check for valid subjects - but only if there is at least one valid subject
    if len(policy.valid_subjects) and (cert.subject_name not in policy.valid_subjects):
        warnings |= (1 << Flags.WARN_SUBJECT_NAME.value[0])
        print(f"Issue: subject is {cert.subject_name} allowed subjects is {policy.valid_subjects}")
    
    # check for valid isuers - but only if there is at least one issuer
    if len(policy.valid_issuers) and (cert.issuer not in policy.valid_issuers):
        warnings |= (1 << Flags.WARN_ISSUER.value[0])
        print(f"Issue: issuer because certificate issuer is {cert.issuer} and policy allowed issuers is {policy.valid_issuers}")

    # check for valid ciphers - but only if there is at least one cipher
    if len(policy.valid_ciphers) and (cert.cipher not in policy.valid_ciphers):
        warnings |= (1 << Flags.WARN_CIPHER.value[0])
        print(f"Issue: ciphers because certificate cipher is {cert.cipher} and policy allowed ciphers is {policy.valid_ciphers}")
    
    # check to see if the certificate is transparent
    if cert.certificate_transparency_compliance != CertificateTransparencyCompliance.COMPLIANT:
        print(f"Issue: transparency compliance between transparency is {cert.certificate_transparency_compliance}")
        warnings |= (1 << Flags.WARN_SECURITY_COMPLIANCE.value[0])

    return warnings, {
        "isExpired": bool(warnings & (1 << Flags.WARN_EXPIRED.value[0])),
        "daysUntilExpiry": days_until_expiry,
        "issues": Flags.decode(warnings),
        "pass": not bool(warnings),
    }

def satisfies_domain(certificate_domain: str, policy_domains: list[str]) -> bool:
    """
    Determines whether a certificate domain falls within the policy domains.

    Parameters:
        certificate_domain: the domain of the certificate to test
        policy_domains: a list of allowed policies. policies can contain wildcards (*) that can replace domain levels, and double wildcards (**) that can replace multiple domain levels

    Returns:
        True if the certificate satisfies at least one of the policy domains
    """
    if len(policy_domains) == 0:
        return True

    # regex symbols for * and ** wildcards
    single_wildcard: str = f"[^{re.escape(".")}]*"
    double_wildcard: str = f".*"

    for policy_domain in policy_domains:
        regex: str = re.escape(policy_domain) # escape everything
        regex = regex.replace(re.escape("*"), single_wildcard) # register * wildcards as anything except for .
        regex = regex.replace(f"{single_wildcard}{single_wildcard}", double_wildcard) # register ** wildcards as anything
        regex = f"^{regex}$" # add start and end
        if re.search(regex, certificate_domain, re.IGNORECASE):
            return True

    return False