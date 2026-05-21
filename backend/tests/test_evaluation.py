# type: ignore
from re import L

from flask.testing import FlaskCliRunner, FlaskClient
import pytest
import warnings
from copy import deepcopy

from app import create_app
from test_fixtures import *

# define some real-life certificates and policies for testing
UQ_CERT = {
  "url": "https://uq.edu.au/libraries/uq/js/chunks/analytics.es6-CAkIlpd_.js",
  "protocol": "TLS 1.3",
  "cipher": "AES_256_GCM",
  "subjectName": "uq.edu.au",
  "sanList": [
    "uq.edu.au",
    "www.uq.edu.au"
  ],
  "issuer": "DigiCert Global G2 TLS RSA SHA256 2020 CA1",
  "validFrom": 1764028800,
  "validTo": 1795564799,
  "certificateTransparencyCompliance": "compliant"
}

WIKIPEDIA_CERT = {
    "url": "https://www.wikipedia.org/portal/wikipedia.org/assets/img/Wikipedia-logo-v2@2x.png",
    "protocol": "TLS 1.3",
    "cipher": "AES_128_GCM",
    "subjectName": "*.wikipedia.org",
    "sanList": [
        "*.m.mediawiki.org",
        "*.m.wikibooks.org",
        "*.m.wikidata.org",
        "*.m.wikimedia.org",
        "*.m.wikinews.org",
        "*.m.wikipedia.org",
        "*.m.wikiquote.org",
        "*.m.wikisource.org",
        "*.m.wikiversity.org",
        "*.m.wikivoyage.org",
        "*.m.wiktionary.org",
        "*.mediawiki.org",
        "*.planet.wikimedia.org",
        "*.wikibooks.org",
        "*.wikidata.org",
        "*.wikifunctions.org",
        "*.wikimedia.org",
        "*.wikimediafoundation.org",
        "*.wikinews.org",
        "*.wikipedia.org",
        "*.wikiquote.org",
        "*.wikisource.org",
        "*.wikiversity.org",
        "*.wikivoyage.org",
        "*.wiktionary.org",
        "*.wmfusercontent.org",
        "mediawiki.org",
        "w.wiki",
        "wikibooks.org",
        "wikidata.org",
        "wikifunctions.org",
        "wikimedia.org",
        "wikimediafoundation.org",
        "wikinews.org",
        "wikipedia.org",
        "wikiquote.org",
        "wikisource.org",
        "wikiversity.org",
        "wikivoyage.org",
        "wiktionary.org",
        "wmfusercontent.org"
    ],
    "issuer": "E7",
    "validFrom": 1775595150,
    "validTo": 1783371149,
    "certificateTransparencyCompliance": "unknown"
}

LEARN_UQ_CERT = {
    "url": r"https://auth.uq.edu.au/idp/module.php/core/loginuserpass.php?AuthState=_162610a4a0fed696c762e4c56edacc3a07a563079d%3Ahttps%3A%2F%2Fauth.uq.edu.au%2Fidp%2Fsaml2%2Fidp%2FSSOService.php%3Fspentityid%3Dhttps%253A%252F%252Flearn.uq.edu.au%252Fauth-saml%252Fa%26cookieTime%3D1779149217",
    "protocol": "TLS 1.3",
    "cipher": "AES_128_GCM",
    "subjectName": "auth.uq.edu.au",
    "sanList": [
        "auth.uq.edu.au"
    ],
    "issuer": "DigiCert Global G2 TLS RSA SHA256 2020 CA1",
    "validFrom": 1773187200,
    "validTo": 1790380799,
    "certificateTransparencyCompliance": "compliant"
}

BASE_POLICY = {
        "name": "Random Policy",
        "description": "Random policy",
        "validProtocols": ["QUIC", "TLS 1.3"],
        "validSubjects": ["uq.edu.au"],
        "validIssuers": ["DigiCert Global G2 TLS RSA SHA256 2020 CA1"],
        "validCiphers": ["AES_256_GCM", "AES_128_GCM"],
        "domains": ["uq.edu.au"],
        "minCertificateLifespan": 180,
        "minCertificateDaysLeft": 30,
    }

def test_certificate_routes_no_jwt(client: FlaskClient):
    """All routes should return 401 if there is no authorization header"""
    assert client.get("/api/evaluate/").status_code == 401

def test_certificate_routes_with_jwt(client: FlaskClient, access_headers: dict):
    """If the authorization header has been provided, should not return 401"""
    assert client.get("/api/evaluate/", headers=access_headers).status_code != 401
    
def test_evaluation_good(client: FlaskClient, access_headers: dict):
    """Certificates should have 0 issues when they adhere to a policy"""
    assert client.post("/api/policies/", headers=access_headers, json=BASE_POLICY).status_code == 201
    response = client.post("/api/certificates/", headers=access_headers, json=UQ_CERT)
    assert response.json["issues"] == []
    
def test_evaluation_bad_protocol(client: FlaskClient, access_headers: dict):
    """Policy evaluation should detect a protocol violation"""
    policy = deepcopy(BASE_POLICY)
    policy["validProtocols"] = ["TLS 1.2", "QUIC"]
    assert client.post("/api/policies/", headers=access_headers, json=policy).status_code == 201
    response = client.post("/api/certificates/", headers=access_headers, json=UQ_CERT)
    assert response.json["issues"] == ["protocol"]
    
def test_evaluation_missing_protocol(client: FlaskClient, access_headers: dict):
    """Policy evaluation should skip protocol evaluation if the policy does not specify it"""
    policy = deepcopy(BASE_POLICY)
    policy.pop("validProtocols")
    assert client.post("/api/policies/", headers=access_headers, json=policy).status_code == 201
    response = client.post("/api/certificates/", headers=access_headers, json=UQ_CERT)
    assert response.json["issues"] == []

def test_evaluation_bad_cipher(client: FlaskClient, access_headers: dict):
    """Policy evaluation should detect a cipher violation"""
    policy = deepcopy(BASE_POLICY)
    policy["validCiphers"] = ["FAKE CIPHER"]
    assert client.post("/api/policies/", headers=access_headers, json=policy).status_code == 201
    response = client.post("/api/certificates/", headers=access_headers, json=UQ_CERT)
    assert response.json["issues"] == ["cipher"]

def test_evaluation_missing_cipher(client: FlaskClient, access_headers: dict):
    """Policy evaluation should skip cipher evaluation if the policy does not specify it"""
    policy = deepcopy(BASE_POLICY)
    policy.pop("validCiphers")
    assert client.post("/api/policies/", headers=access_headers, json=policy).status_code == 201
    response = client.post("/api/certificates/", headers=access_headers, json=UQ_CERT)
    assert response.json["issues"] == []

def test_evaluation_bad_protocol_cipher(client: FlaskClient, access_headers: dict):
    """Policy evaluation should detect multiple violations"""
    policy = deepcopy(BASE_POLICY)
    policy["validCiphers"] = ["FAKE CIPHER"]    
    policy["validProtocols"] = ["QUIC"]
    assert client.post("/api/policies/", headers=access_headers, json=policy).status_code == 201
    response = client.post("/api/certificates/", headers=access_headers, json=UQ_CERT)
    assert len(response.json["issues"]) == 2 and "cipher" in response.json["issues"] and "protocol" in response.json["issues"]
    
def test_evaluation_bad_issuer(client: FlaskClient, access_headers: dict):
    """Policy evaluation should detect an issuer violation"""
    policy = deepcopy(BASE_POLICY)
    policy["validIssuers"] = ["FAKE ISSUER"]
    assert client.post("/api/policies/", headers=access_headers, json=policy).status_code == 201
    response = client.post("/api/certificates/", headers=access_headers, json=UQ_CERT)
    assert response.json["issues"] == ["issuer"]

def test_evaluation_missing_issuer(client: FlaskClient, access_headers: dict):
    """Policy evaluation should skip issuer evaluation if the policy does not specify it"""
    policy = deepcopy(BASE_POLICY)
    policy.pop("validIssuers")
    assert client.post("/api/policies/", headers=access_headers, json=policy).status_code == 201
    response = client.post("/api/certificates/", headers=access_headers, json=UQ_CERT)
    assert response.json["issues"] == []

def test_evaluation_bad_subject(client: FlaskClient, access_headers: dict):
    """Policy evaluation should detect a subject violation"""
    policy = deepcopy(BASE_POLICY)
    policy["validSubjects"] = ["FAKE SUBJECT"]
    assert client.post("/api/policies/", headers=access_headers, json=policy).status_code == 201
    response = client.post("/api/certificates/", headers=access_headers, json=UQ_CERT)
    assert response.json["issues"] == ["subject"]
    
def test_evaluation_missing_subject(client: FlaskClient, access_headers: dict):
    """Policy evaluation should skip subject evaluation if the policy does not specify it"""
    policy = deepcopy(BASE_POLICY)
    policy.pop("validSubjects")
    assert client.post("/api/policies/", headers=access_headers, json=policy).status_code == 201
    response = client.post("/api/certificates/", headers=access_headers, json=UQ_CERT)
    assert response.json["issues"] == []
    
def test_evaluation_bad_lifspan(client: FlaskClient, access_headers: dict):
    """Policy evaluation should detect a lifespan violation"""
    policy = deepcopy(BASE_POLICY)
    policy["minCertificateLifespan"] = 366
    assert client.post("/api/policies/", headers=access_headers, json=policy).status_code == 201
    response = client.post("/api/certificates/", headers=access_headers, json=UQ_CERT)
    assert response.json["issues"] == ["lifespan"]
    
def test_evaluation_missing_lifespan(client: FlaskClient, access_headers: dict):
    """Policy evaluation should skip lifespan evaluation if the policy does not specify it"""
    policy = deepcopy(BASE_POLICY)
    policy["minCertificateLifespan"] = 0
    assert client.post("/api/policies/", headers=access_headers, json=policy).status_code == 201
    response = client.post("/api/certificates/", headers=access_headers, json=UQ_CERT)
    assert response.json["issues"] == []
    
def test_evaluation_bad_daysleft(client: FlaskClient, access_headers: dict):
    """Policy evaluation should detect an expiring soon violation"""
    policy = deepcopy(BASE_POLICY)
    policy["minCertificateDaysLeft"] = 366
    assert client.post("/api/policies/", headers=access_headers, json=policy).status_code == 201
    response = client.post("/api/certificates/", headers=access_headers, json=UQ_CERT)
    assert response.json["issues"] == ["expiring"]
    
def test_evaluation_missing_daysleft(client: FlaskClient, access_headers: dict):
    """Policy evaluation should skip expiring soon evaluation if the policy does not specify it"""
    policy = deepcopy(BASE_POLICY)
    policy["minCertificateDaysLeft"] = 0
    assert client.post("/api/policies/", headers=access_headers, json=policy).status_code == 201
    response = client.post("/api/certificates/", headers=access_headers, json=UQ_CERT)
    assert response.json["issues"] == []
    
def test_evaluation_bad_expired(client: FlaskClient, access_headers: dict):
    """Policy evaluation should detect an expired violation"""
    policy = deepcopy(BASE_POLICY)
    cert = deepcopy(UQ_CERT)
    cert["validTo"] = int(time.time() - 1000)
    assert client.post("/api/policies/", headers=access_headers, json=policy).status_code == 201
    response = client.post("/api/certificates/", headers=access_headers, json=cert)
    assert "expired" in response.json["issues"]
    
def test_evaluation_dayzero(client: FlaskClient, access_headers: dict):
    """Policy evaluation should not say expired if there is between 0 and 1 day left before expiring"""
    policy = deepcopy(BASE_POLICY)
    cert = deepcopy(UQ_CERT)
    cert["validTo"] = int(time.time() + 1000)
    assert client.post("/api/policies/", headers=access_headers, json=policy).status_code == 201
    response = client.post("/api/certificates/", headers=access_headers, json=cert)
    assert "expiring" in response.json["issues"] and "expired" not in response.json["issues"]

def test_evaluation_only_active_policies(client: FlaskClient, access_headers: dict):
    """Policy evaluation should only consider active policies"""
    policy = deepcopy(BASE_POLICY)
    policy["validSubjects"] = ["FAKE SUBJECT"]
    policy_id = client.post("/api/policies/", headers=access_headers, json=policy).json["id"]
    assert client.put(f"/api/policies/{policy_id}/active", headers=access_headers, json={"active": False}).status_code == 200
    response = client.post("/api/certificates/", headers=access_headers, json=UQ_CERT)
    assert len(response.json["issues"]) == 0
    
def test_evaluation_only_users_policies(client: FlaskClient, access_headers: dict, access_headers_two: dict):
    """Policy evaluation should only consider this user's policies"""
    policy = deepcopy(BASE_POLICY)    
    policy["validSubjects"] = ["FAKE SUBJECT"]

    client.post("/api/policies/", headers=access_headers, json=policy)
    response = client.post("/api/certificates/", headers=access_headers_two, json=UQ_CERT)
    assert len(response.json["issues"]) == 0

def test_evaluation_expired_no_policies(client: FlaskClient, access_headers: dict):
    """Policy evaluation should check expiry even with no policies"""
    cert = deepcopy(UQ_CERT)
    cert["validTo"] = int(time.time() - 1000)

    response = client.post("/api/certificates/", headers=access_headers, json=cert)
    assert response.json["issues"] == ["expired"]
    
def test_evaluation_noncompliant_no_policies(client: FlaskClient, access_headers: dict):
    """Policy evaluation should check transparency compliance even with no policies"""
    cert = deepcopy(UQ_CERT)
    cert["certificateTransparencyCompliance"] = "unknown"

    response = client.post("/api/certificates/", headers=access_headers, json=cert)
    assert response.json["issues"] == ["security_compliance"]
    
def test_evaluation_domain_matching(client: FlaskClient, access_headers: dict):
    """Policy evaluation should match domains correctly, including wildcards"""
    policy = deepcopy(BASE_POLICY)    
    policy["validSubjects"] = ["FAKE SUBJECT"]

    # domains should include
    for domains in ["uq.edu.au", "*.uq.edu.au", "www.uq.edu.au", "**", "*.uq.edu.*", "uq.**", "**.au"]:
        policy["domains"] = domains
        client.post("/api/policies/", headers=access_headers, json=policy)
        response = client.post("/api/certificates/", headers=access_headers, json=UQ_CERT)
        assert response.json["issues"] == ["subject"]

    # domains should exclude
    for domains in ["uq.edu", "*.wikipedia.org", "*.au","learn.uq.edu.au"]:
        policy["domains"] = domains
        client.post("/api/policies/", headers=access_headers, json=policy)
        response = client.post("/api/certificates/", headers=access_headers, json=UQ_CERT)
        assert response.json["issues"] == ["subject"]
        
def test_evaluation_reevaluate(client: FlaskClient, access_headers: dict):
    """Certificates should be reevaluated when updated"""
    assert client.post("/api/policies/", headers=access_headers, json=BASE_POLICY).status_code == 201
    response = client.post("/api/certificates/", headers=access_headers, json=UQ_CERT)
    assert response.json["issues"] == []
    
    policy = deepcopy(BASE_POLICY)
    policy["validCiphers"] = ["FAKE CIPHER"]
    assert client.post("/api/policies/", headers=access_headers, json=policy).status_code == 201
    response = client.post("/api/certificates/", headers=access_headers, json=UQ_CERT)
    assert response.json["issues"] == ["cipher"]