import functools
import enum

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

class Flags(enum.Enum):
    """
    An enumerated class to define different evaluation flags. Flags are encoded by a bitvector to be stored in the certificate database.

    Values --> (bit position, string encoding):
        WARN_EXPIRED --> (0, "expired")
        WARN_EXPIRING --> (1, "expiring")
        WARN_SHORT_LIFESPAN --> (2, "lifespan")
        WARN_PROTOCOL --> (3, "protocol")
        WARN_SUBJECT_NAME --> (4, "subject")
        WARN_ISSUER --> (5, "issuer")
        WARN_CIPHER --> (6, "cipher")
        WARN_SCT --> (7, "security_compliance")
    """
    WARN_EXPIRED = (0, "expired")
    WARN_EXPIRING = (1, "expiring")
    WARN_SHORT_LIFESPAN = (2, "lifespan")
    WARN_PROTOCOL = (3, "protocol")
    WARN_SUBJECT_NAME = (4, "subject")
    WARN_ISSUER = (5, "issuer")
    WARN_CIPHER = (6, "cipher")
    WARN_SECURITY_COMPLIANCE = (7, "security_compliance")
    
    @classmethod
    @functools.cache
    def lookup_str2int(cls) -> dict[str, int]:
        return {cls[x].value[1] : cls[x].value[0] for x in cls.__members__}

    @classmethod
    @functools.cache
    def lookup_int2str(cls) -> dict[int, str]:
        return {cls[x].value[0] : cls[x].value[1] for x in cls.__members__}
    
    @staticmethod
    def encode(issues: list[str]) -> int:
        """Convert a list of issues to a bitvector"""
        encoded_issues: int = 0
        for ele in issues:
            if ele in Flags.lookup_str2int().keys():
                encoded_issues |= (1 << Flags.lookup_str2int()[ele])
            
        return encoded_issues
    
    @staticmethod
    def decode(bitvector: int) -> list[str]:
        """Convert a bitvector to a list of issues"""
        issues: list[str] = []
        for i in range(len(Flags)):
            if bitvector & (1 << i):
                issues.append(Flags.lookup_int2str()[i])
        return issues    

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
    def lookup_str2int(cls) -> dict[str, int]:
        return {cls[x].value[1] : cls[x].value[0] for x in cls.__members__}

    @classmethod
    @functools.cache
    def lookup_int2str(cls) -> dict[int, str]:
        return {cls[x].value[0] : cls[x].value[1] for x in cls.__members__}
    
    @staticmethod
    def encode(protocols: list[str]) -> int:
        """Convert a list of protocols to a bitvector"""
        valid_protocols: int = 0
        for ele in protocols:
            if ele in Protocols.lookup_str2int().keys():
                valid_protocols |= (1 << Protocols.lookup_str2int()[ele])
            
        return valid_protocols
    
    @staticmethod
    def decode(bitvector: int) -> list[str]:
        """Convert a bitvector to a list of protocols"""
        valid_protocols: list[str] = []
        for i in range(len(Protocols)):
            if bitvector & (1 << i):
                valid_protocols.append(Protocols.lookup_int2str()[i])
        return valid_protocols
