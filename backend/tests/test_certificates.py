# type: ignore
from re import L

from flask.testing import FlaskCliRunner, FlaskClient
import pytest
import warnings

from app import create_app
from app.models.certificate import (
    CERT_SANS_MAXLEN, CERT_CIPH_MAXLEN, CERT_ISSU_MAXLEN, 
    CERT_MAX_SANS, CERT_PROT_MAXLEN, CERT_SUBJ_MAXLEN, CERT_URL_MAXLEN
)
from test_fixtures import *

def test_certificate_routes_no_jwt(client: FlaskClient):
    """All routes should return 401 if there is no authorization header"""
    assert client.get("/api/certificates/").status_code == 401
    assert client.post("/api/certificates/").status_code == 401
    assert client.get("/api/certificates/0").status_code == 401
    assert client.delete("/api/certificates/0").status_code == 401

def test_certificate_routes_with_jwt(client: FlaskClient, access_headers: dict):
    """If the authorization header has been provided, should not return 401"""
    assert client.get("/api/certificates/", headers=access_headers).status_code != 401
    assert client.post("/api/certificates/", headers=access_headers).status_code != 401
    assert client.get("/api/certificates/0", headers=access_headers).status_code != 401
    assert client.delete("/api/certificates/0", headers=access_headers).status_code != 401

def test_api_certificates_get__empty(client: FlaskClient, access_headers: dict):
    """
    /api/certificates/ (GET)
    should return an empty JSON list if no certificates have been added
    """
    response = client.get("/api/certificates/", headers=access_headers)
    assert isinstance(response.json, list)
    assert len(response.json) == 0

def test_api_certificates_post__set(client: FlaskClient, access_headers: dict, valid_certificate: dict):
    """
    /api/certificates (POST)
    should allow us to add a certificate and return the stored certificate, which should be identical
    """
    # send certificate
    response = client.post("/api/certificates/", headers=access_headers, json=valid_certificate)
    
    # check response status
    assert response.status_code == 201 and response.json is not None
    
    # check that response fields are the same
    assert response.json['url'] == valid_certificate['url']
    assert response.json['protocol'] == valid_certificate['protocol']
    assert response.json['cipher'] == valid_certificate['cipher']
    assert response.json['subjectName'] == valid_certificate['subjectName']
    assert response.json['sanList'] == valid_certificate['sanList']
    assert response.json['issuer'] == valid_certificate['issuer']
    assert response.json['validFrom'] == valid_certificate['validFrom']
    assert response.json['validTo'] == valid_certificate['validTo']
    assert response.json['certificateTransparencyCompliance'] == valid_certificate['certificateTransparencyCompliance']

    # check data types of the response fields
    try:
        assert isinstance(response.json['url'], str)
        assert isinstance(response.json['protocol'], str)
        assert isinstance(response.json['cipher'], str)
        assert isinstance(response.json['subjectName'], str)
        assert isinstance(response.json['sanList'], list)
        assert isinstance(response.json['issues'], list)
        assert isinstance(response.json['issuer'], str)
        assert isinstance(response.json['certificateTransparencyCompliance'], str)
        assert isinstance(response.json['validFrom'], int)
        assert isinstance(response.json['validTo'], int)
        assert isinstance(response.json['visitedAt'], int)
        assert isinstance(response.json['id'], int)
    except AssertionError as e:
        warnings.warn(f"Warning: unexpected data type in certificate response. Error is {e}")

def test_api_certificates_id_get(client: FlaskClient, access_headers: dict, valid_certificate: dict):
    """
    /api/certificates/<id> (GET)
    should allow us to get a certificate by its id
    """
    
    # create certificate
    response_set = client.post("/api/certificates/", headers=access_headers, json=valid_certificate)
    assert response_set.status_code == 201

    # get the certificate by its id
    response_get = client.get(f"/api/certificates/{response_set.json['id']}", headers=access_headers)
    assert response_get.status_code == 200
    
    # certificates should be identical
    assert response_get.json == response_set.json

def test_api_certificates_id_get__unauthorised_or_invalid(client: FlaskClient, access_headers: dict, access_headers_two: dict, valid_certificate: dict):
    """
    /api/certificates/<id> (GET)
    should return the same error code if the certificate id doesn't exist or belongs to another user
    """
    # create a certificate
    response_set = client.post("/api/certificates/", headers=access_headers, json=valid_certificate)
    assert response_set.status_code == 201

    # get a certificate from a different user
    response_one = client.get(f"/api/certificates/{int(response_set.json['id'])}", headers=access_headers_two)  
    
    # get a certificate from an nonexistant id
    response_two = client.get(f"/api/certificates/{int(response_set.json['id'] + 1)}", headers=access_headers)
    
    # check that responses are the same
    assert response_one.status_code == 404 and response_two.status_code == 404
    assert response_one.data == response_two.data

def test_api_certificates_delete(client: FlaskClient, access_headers: dict, valid_certificate: dict):
    """
    /api/certificates/ (DELETE)
    should be able to delete a certificate
    """
    # create certificate
    response_set = client.post("/api/certificates/", headers=access_headers, json=valid_certificate)
    assert response_set.status_code == 201

    # delete certificate
    response_get = client.delete(f"/api/certificates/{response_set.json['id']}", headers=access_headers)
    assert response_get.status_code == 200

def test_api_certificates_delete__unauthorised_or_invalid(client: FlaskClient, access_headers: dict, access_headers_two: dict, valid_certificate: dict):
    """
    /api/certificates/ (DELETE)
    should not be able to delete a certificate belonging to a different user or that does not exist
    these two cases should return the same response
    """
    # create certificate
    response_set = client.post("/api/certificates/", headers=access_headers, json=valid_certificate)
    assert response_set.status_code == 201

    # try to delete from a different user
    response_one = client.delete(f"/api/certificates/{int(response_set.json['id'])}", headers=access_headers_two)  
    
    # try to delete a nonexistant certificate
    response_two = client.delete(f"/api/certificates/{int(response_set.json['id'] + 1)}", headers=access_headers)
    
    # responses should be identical
    assert response_one.status_code == 404 and response_two.status_code == 404
    assert response_one.data == response_two.data

def test_api_certificates_get__one(client: FlaskClient, access_headers: dict, valid_certificate: dict):
    """
    /api/certificates/ (GET)
    should be able to retrieve all user's certificates, if only a single has been added
    """
    # create certificate
    response_set = client.post("/api/certificates/", headers=access_headers, json=valid_certificate)
    assert response_set.status_code == 201

    response = client.get("/api/certificates/", headers=access_headers, json=valid_certificate)
    assert response.status_code == 200
    assert response.json == [response_set.json]

def test_api_certificates_get__multiple(client: FlaskClient, access_headers: dict, access_headers_two: dict, valid_certificate: dict, valid_certificate_two: dict):
    """
    /api/certificates/ (GET)
    should we able to get multiple certificates from a user, if set
    should not be able to get certificates belonging to other users
    """

    # adds two certificates to user 1 and one to user 2
    response_set = client.post("/api/certificates/", headers=access_headers, json=valid_certificate)
    response_set2 = client.post("/api/certificates/", headers=access_headers, json=valid_certificate_two)
    response_set3 = client.post("/api/certificates/", headers=access_headers_two, json=valid_certificate)

    # tries to get both certificates from user 1
    response_get = client.get("/api/certificates/", headers=access_headers, json=valid_certificate)
    assert response_get.status_code == 200
    assert len(response_get.json) == 2 and response_set.json in response_get.json and response_set2.json in response_get.json

    # tries to get 1 certificate from user 2
    response_get2 = client.get("/api/certificates/", headers=access_headers_two, json=valid_certificate)
    assert response_get2.status_code == 200
    assert len(response_get2.json) == 1 and response_set3.json in response_get2.json

def test_api_certificates_post__handle_duplicates(client: FlaskClient, access_headers: dict, access_headers_two: dict, valid_certificate: dict):
    """
    /api/certificates/ (POST)
    should detect duplicate certificates and only update the latest certificate
    should only detect duplicate certificates belonging to the active user    
    """
    
    # create a certificate for both users
    client.post("/api/certificates/", headers=access_headers, json=valid_certificate)
    client.post("/api/certificates/", headers=access_headers_two, json=valid_certificate)

    # checks that both users had certificates added (duplicate not detected)
    response = client.get("/api/certificates/", headers=access_headers, json=valid_certificate)
    assert response.status_code == 200 and len(response.json) == 1
    response = client.get("/api/certificates/", headers=access_headers_two, json=valid_certificate)
    assert response.status_code == 200 and len(response.json) == 1

    # try adding to duplicate certificates
    for _ in range(10):
        client.post("/api/certificates/", headers=access_headers, json=valid_certificate)

    # ensure that only one certificate remains at the end
    response = client.get("/api/certificates/", headers=access_headers, json=valid_certificate)
    assert response.status_code == 200 and len(response.json) == 1

def test_api_certificates_post__update(client: FlaskClient, access_headers: dict, access_headers_two: dict, valid_certificate: dict):
    """
    /api/certificates/ (POST)
    a duplicate certificate belonging to the same site should update the certificate instead of adding a new one
    this should only happen to certificates with the current active user
    changing the url, san list or subject name should not count as an update, and should add a new certificate
    """
    
    # add a certificate to two users
    cert1 = client.post("/api/certificates/", headers=access_headers, json=valid_certificate).json
    cert2 = client.post("/api/certificates/", headers=access_headers_two, json=valid_certificate).json

    # create an altered certificate
    updated_certificate = valid_certificate
    updated_certificate["validFrom"] += 1
    updated_certificate["validTo"] += 1
    updated_certificate["issuer"] = "updated-issuer"
    updated_certificate["protocol"] = "updated-protocol"
    updated_certificate["cipher"] = "updated-cipher"
    updated_certificate["certificateTransparencyCompliance"] = "unknown"

    # add the altered certificate
    cert3 = client.post("/api/certificates/", headers=access_headers, json=updated_certificate).json
    
    # check that the first certificate was updated and no new certificate was added
    response = client.get("/api/certificates/", headers=access_headers, json=valid_certificate)
    assert response.status_code == 200 and len(response.json) == 1
    assert response.json[0]['id'] == cert1['id']
    assert response.json[0]['validFrom'] == cert3['validFrom']
    assert response.json[0]['validTo'] == cert3['validTo']
    assert response.json[0]['issuer'] == cert3['issuer']
    assert response.json[0]['protocol'] == cert3['protocol']
    assert response.json[0]['cipher'] == cert3['cipher']
    
    # alter the url (no duplicate should be detected)
    updated_certificate["url"] = "https://www.google.com/help"
    client.post("/api/certificates/", headers=access_headers, json=updated_certificate)
    
    # alter the san list (no duplicate should be detected)
    updated_certificate["sanList"] = ["nothing-sanlist"]
    client.post("/api/certificates/", headers=access_headers, json=updated_certificate)
    
    # alter the subject name (no duplicate should be detected)
    updated_certificate["subjectName"] = "nothing-subject-name"
    client.post("/api/certificates/", headers=access_headers, json=updated_certificate)

    # ensure that none of the above were detected as duplicates
    response = client.get("/api/certificates/", headers=access_headers, json=valid_certificate)
    assert response.status_code == 200 and len(response.json) == 4

    # ensure the other user was not affected
    response = client.get("/api/certificates/", headers=access_headers_two, json=valid_certificate)
    assert response.status_code == 200 and len(response.json) == 1

def test_api_certificates_post__edge_cases(client: FlaskClient, access_headers: dict, valid_certificate: dict):
    """
    /api/certificates/ (POST)
    Tests various edge cases with the certificate formatting 
    """
    # san list string should be parsable to a list
    edge_cases_cert = valid_certificate.copy()
    edge_cases_cert["sanList"] = "singleton-san-list"
    
    # check it was successful and sanlist was parsed
    response = client.post("/api/certificates/", headers=access_headers, json=edge_cases_cert)
    assert response.status_code == 201 and response.json is not None
    assert response.json["sanList"] == ["singleton-san-list"]
    
    # cipher, subject name, issuer, san list and transparency compliance are optional
    edge_cases_cert = valid_certificate.copy()
    edge_cases_cert.pop("cipher", None)
    edge_cases_cert.pop("sanList", None)
    edge_cases_cert.pop("certificateTransparencyCompliance", None)
    edge_cases_cert.pop("subjectName", None)
    edge_cases_cert.pop("issuer", None)

    # check it was successful and optional arguments was filled with defaults
    response = client.post("/api/certificates/", headers=access_headers, json=edge_cases_cert)
    assert response.status_code == 201 and response.json is not None
    assert response.json["cipher"] == ""
    assert response.json["sanList"] == []
    assert response.json["certificateTransparencyCompliance"] == "unknown"
    assert response.json["subjectName"] == ""
    assert response.json["issuer"] == ""

    # the remaining fields are mandatory    
    edge_cases_cert = valid_certificate.copy(); edge_cases_cert.pop("url", None)
    assert client.post("/api/certificates/", headers=access_headers, json=edge_cases_cert).status_code == 400
    
    edge_cases_cert = valid_certificate.copy(); edge_cases_cert.pop("protocol", None)
    assert client.post("/api/certificates/", headers=access_headers, json=edge_cases_cert).status_code == 400

    edge_cases_cert = valid_certificate.copy(); edge_cases_cert.pop("validFrom", None)
    assert client.post("/api/certificates/", headers=access_headers, json=edge_cases_cert).status_code == 400
    
    edge_cases_cert = valid_certificate.copy(); edge_cases_cert.pop("validTo", None)
    assert client.post("/api/certificates/", headers=access_headers, json=edge_cases_cert).status_code == 400
    
    # check that all certificate transparency compliance values are allowable
    for x in ["compliant", "not-compliant", "unknown"]:
        edge_cases_cert = valid_certificate.copy()
        edge_cases_cert["certificateTransparencyCompliance"] = x
        response = client.post("/api/certificates/", headers=access_headers, json=edge_cases_cert)
        assert response.status_code == 201 and response.json is not None
        assert response.json["certificateTransparencyCompliance"] == x
        
    # check invalid values of certificate transparency compliance
    edge_cases_cert = valid_certificate.copy()
    edge_cases_cert["certificateTransparencyCompliance"] = "not-a-valid-string"
    assert client.post("/api/certificates/", headers=access_headers, json=edge_cases_cert).status_code == 400

    # check dates cannot be negative
    edge_cases_cert = valid_certificate.copy()
    edge_cases_cert["validFrom"] = -1
    assert client.post("/api/certificates/", headers=access_headers, json=edge_cases_cert).status_code == 400

    edge_cases_cert =  valid_certificate.copy()
    edge_cases_cert["validTo"] = -1
    assert client.post("/api/certificates/", headers=access_headers, json=edge_cases_cert).status_code == 400

    # check end date cannot be ealier than start date
    edge_cases_cert = valid_certificate.copy()
    edge_cases_cert["validTo"] = 200
    edge_cases_cert["validTo"] = 100
    assert client.post("/api/certificates/", headers=access_headers, json=edge_cases_cert).status_code == 400

    # all data should be suitably truncated to prevent exploitation
    long_string = "abcdefg" * 100
    edge_cases_cert = valid_certificate.copy()
    edge_cases_cert["url"] = long_string
    edge_cases_cert["protocol"] = long_string
    edge_cases_cert["issuer"] = long_string
    edge_cases_cert["cipher"] = long_string
    edge_cases_cert["subjectName"] = long_string
    edge_cases_cert["sanList"] = [long_string] * 100
    
    # ensure data has been truncated
    response = client.post("/api/certificates/", headers=access_headers, json=edge_cases_cert)
    assert response.status_code == 201
    assert response.json["url"] == long_string[:CERT_URL_MAXLEN]
    assert response.json["protocol"] == long_string[:CERT_PROT_MAXLEN]
    assert response.json["issuer"] == long_string[:CERT_ISSU_MAXLEN]
    assert response.json["cipher"] == long_string[:CERT_CIPH_MAXLEN]
    assert response.json["subjectName"] == long_string[:CERT_SUBJ_MAXLEN]
    assert len(response.json["sanList"]) == CERT_MAX_SANS
    for san in response.json["sanList"]:
        assert san == long_string[:CERT_SANS_MAXLEN]
        
    # input data should require the right data type
    edge_cases_cert = valid_certificate.copy(); edge_cases_cert["url"] = 5;
    assert client.post("/api/certificates/", headers=access_headers, json=edge_cases_cert).status_code == 400
    
    edge_cases_cert = valid_certificate.copy(); edge_cases_cert["issuer"] = 5;
    assert client.post("/api/certificates/", headers=access_headers, json=edge_cases_cert).status_code == 400
    
    edge_cases_cert = valid_certificate.copy(); edge_cases_cert["cipher"] = 5;
    assert client.post("/api/certificates/", headers=access_headers, json=edge_cases_cert).status_code == 400
    
    edge_cases_cert = valid_certificate.copy(); edge_cases_cert["protocol"] = 5;
    assert client.post("/api/certificates/", headers=access_headers, json=edge_cases_cert).status_code == 400
    
    edge_cases_cert = valid_certificate.copy(); edge_cases_cert["certificateTransparencyCompliance"] = 5;
    assert client.post("/api/certificates/", headers=access_headers, json=edge_cases_cert).status_code == 400
    
    edge_cases_cert = valid_certificate.copy(); edge_cases_cert["subjectName"] = 5;
    assert client.post("/api/certificates/", headers=access_headers, json=edge_cases_cert).status_code == 400
    
    edge_cases_cert = valid_certificate.copy(); edge_cases_cert["sanList"] = ["fine-san", False];
    assert client.post("/api/certificates/", headers=access_headers, json=edge_cases_cert).status_code == 400
    
    edge_cases_cert = valid_certificate.copy(); edge_cases_cert["validFrom"] = "text";
    assert client.post("/api/certificates/", headers=access_headers, json=edge_cases_cert).status_code == 400
    
    edge_cases_cert = valid_certificate.copy(); edge_cases_cert["validTo"] = "text";
    assert client.post("/api/certificates/", headers=access_headers, json=edge_cases_cert).status_code == 400
    
    edge_cases_cert = valid_certificate.copy(); edge_cases_cert["validFrom"] = 5.0;
    assert client.post("/api/certificates/", headers=access_headers, json=edge_cases_cert).status_code == 400
    
    edge_cases_cert = valid_certificate.copy(); edge_cases_cert["validTo"] = 5.0;
    assert client.post("/api/certificates/", headers=access_headers, json=edge_cases_cert).status_code == 400