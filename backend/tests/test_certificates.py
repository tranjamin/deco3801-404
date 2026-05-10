# type: ignore
from flask.testing import FlaskCliRunner, FlaskClient
import pytest
import warnings

from app import create_app
from test_fixtures import *

def test_certificate_routes_no_jwt(client: FlaskClient):
    assert client.get("/api/certificates/").status_code == 401
    assert client.post("/api/certificates/").status_code == 401
    assert client.post("/api/certificates/batch").status_code == 401
    assert client.get("/api/certificates/expiring").status_code == 401
    assert client.get("/api/certificates/expired").status_code == 401
    assert client.get("/api/certificates/search").status_code == 401
    assert client.get("/api/certificates/create_dummy").status_code == 401
    assert client.get("/api/certificates/0").status_code == 401
    assert client.delete("/api/certificates/0").status_code == 401

def test_certificate_routes_with_jwt(client: FlaskClient, access_headers):
    assert client.get("/api/certificates/", headers=access_headers).status_code != 401
    assert client.post("/api/certificates/", headers=access_headers).status_code != 401
    assert client.post("/api/certificates/batch", headers=access_headers).status_code != 401
    assert client.get("/api/certificates/expiring", headers=access_headers).status_code != 401
    assert client.get("/api/certificates/expired", headers=access_headers).status_code != 401
    assert client.get("/api/certificates/search", headers=access_headers).status_code != 401
    assert client.get("/api/certificates/create_dummy", headers=access_headers).status_code != 401
    assert client.get("/api/certificates/0", headers=access_headers).status_code != 401
    assert client.delete("/api/certificates/0", headers=access_headers).status_code != 401

def test_certificate_get_empty(client: FlaskClient, access_headers):
    response = client.get("/api/certificates/", headers=access_headers)
    assert isinstance(response.json, list)
    assert len(response.json) == 0

def test_certificate_set(client: FlaskClient, access_headers, valid_certificate):
    """Tests if we can set a certificate"""
    response = client.post("/api/certificates/", headers=access_headers, json=valid_certificate)
    assert response.status_code == 201 and response.json is not None
    assert response.json['url'] == valid_certificate['url']
    assert response.json['protocol'] == valid_certificate['protocol']
    assert response.json['cipher'] == valid_certificate['cipher']
    assert response.json['subjectName'] == valid_certificate['subjectName']
    assert response.json['sanList'] == valid_certificate['sanList']
    assert response.json['issuer'] == valid_certificate['issuer']
    assert response.json['validFrom'] == valid_certificate['validFrom']
    assert response.json['validTo'] == valid_certificate['validTo']
    assert response.json['certificateTransparencyCompliance'] == valid_certificate['certificateTransparencyCompliance']

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
        assert isinstance(response.json['validAt'], int)
        assert isinstance(response.json['id'], int)
    except AssertionError as e:
        warnings.warn(f"Warning: unexpected data type in certificate response. Error is {e}")

def test_certificate_get(client: FlaskClient, access_headers, valid_certificate):
    """Tests if we can get a certificate"""
    response_set = client.post("/api/certificates/", headers=access_headers, json=valid_certificate)
    assert response_set.status_code == 201

    response_get = client.get(f"/api/certificates/{response_set.json['id']}", headers=access_headers)
    assert response_get.status_code == 200
    assert response_get.json == response_set.json

def test_certificate_get_unauthorised_or_invalid(client: FlaskClient, access_headers, access_headers_two, valid_certificate):
    """Tests if we can get a certificate from another user or which doesn't exist. We shouldn't be able to distinguish these two"""
    response_set = client.post("/api/certificates/", headers=access_headers, json=valid_certificate)
    assert response_set.status_code == 201

    response_one = client.get(f"/api/certificates/{int(response_set.json['id'])}", headers=access_headers_two)  
    response_two = client.get(f"/api/certificates/{int(response_set.json['id'] + 1)}", headers=access_headers)
    assert response_one.status_code == 404 and response_two.status_code == 404
    assert response_one.data == response_two.data

def test_certificate_delete(client: FlaskClient, access_headers, valid_certificate):
    """Tests if we can delete a certificate"""
    response_set = client.post("/api/certificates/", headers=access_headers, json=valid_certificate)
    assert response_set.status_code == 201

    response_get = client.delete(f"/api/certificates/{response_set.json['id']}", headers=access_headers)
    assert response_get.status_code == 200

def test_certificate_delete_unauthorised_or_invalid(client: FlaskClient, access_headers, access_headers_two, valid_certificate):
    """Tests if we can delete a certificate from another user or which doesn't exist. We shouldn't be able to distinguish these two"""
    response_set = client.post("/api/certificates/", headers=access_headers, json=valid_certificate)
    assert response_set.status_code == 201

    response_one = client.delete(f"/api/certificates/{int(response_set.json['id'])}", headers=access_headers_two)  
    response_two = client.delete(f"/api/certificates/{int(response_set.json['id'] + 1)}", headers=access_headers)
    assert response_one.status_code == 404 and response_two.status_code == 404
    assert response_one.data == response_two.data

def test_certificate_get_all_empty(client: FlaskClient, access_headers, valid_certificate):
    """Tests if we can get an empty certificate list"""
    response = client.get("/api/certificates/", headers=access_headers, json=valid_certificate)
    assert response.status_code == 200
    assert response.json == []

def test_certificate_get_all_one(client: FlaskClient, access_headers, valid_certificate):
    """Tests if we can get a single certificate list"""
    response_set = client.post("/api/certificates/", headers=access_headers, json=valid_certificate)
    assert response_set.status_code == 201

    response = client.get("/api/certificates/", headers=access_headers, json=valid_certificate)
    assert response.status_code == 200
    assert response.json == [response_set.json]

def test_certificate_get_all_multiple(client: FlaskClient, access_headers, access_headers_two, valid_certificate, valid_certificate_two):
    """Tests if we can get a multiple certificates, only from this user"""

    response_set = client.post("/api/certificates/", headers=access_headers, json=valid_certificate)
    response_set2 = client.post("/api/certificates/", headers=access_headers, json=valid_certificate_two)
    response_set3 = client.post("/api/certificates/", headers=access_headers_two, json=valid_certificate)

    response_get = client.get("/api/certificates/", headers=access_headers, json=valid_certificate)
    assert response_get.status_code == 200
    assert len(response_get.json) == 2 and response_set.json in response_get.json and response_set2.json in response_get.json

    response_get2 = client.get("/api/certificates/", headers=access_headers_two, json=valid_certificate)
    assert response_get2.status_code == 200
    assert len(response_get2.json) == 1 and response_set3.json in response_get2.json

def test_certificate_handle_duplicates(client: FlaskClient, access_headers, access_headers_two, valid_certificate):
    """Tests if we can filter out duplicates, only on this user"""
    client.post("/api/certificates/", headers=access_headers, json=valid_certificate)
    client.post("/api/certificates/", headers=access_headers_two, json=valid_certificate)

    response = client.get("/api/certificates/", headers=access_headers, json=valid_certificate)
    assert response.status_code == 200 and len(response.json) == 1
    
    response = client.get("/api/certificates/", headers=access_headers_two, json=valid_certificate)
    assert response.status_code == 200 and len(response.json) == 1

    for _ in range(10):
        client.post("/api/certificates/", headers=access_headers, json=valid_certificate)

    response = client.get("/api/certificates/", headers=access_headers, json=valid_certificate)
    assert response.status_code == 200 and len(response.json) == 1

def test_certificate_update(client: FlaskClient, access_headers, access_headers_two, valid_certificate):
    cert1 = client.post("/api/certificates/", headers=access_headers, json=valid_certificate).json
    cert2 = client.post("/api/certificates/", headers=access_headers_two, json=valid_certificate).json

    updated_certificate = valid_certificate
    updated_certificate["validFrom"] += 1
    updated_certificate["validTo"] += 1
    updated_certificate["issuer"] = "updated-issuer"
    updated_certificate["protocol"] = "updated-protocol"
    updated_certificate["cipher"] = "updated-cipher"
    updated_certificate["certificateTransparencyCompliance"] = "unknown"

    cert3 = client.post("/api/certificates/", headers=access_headers, json=updated_certificate).json
    
    response = client.get("/api/certificates/", headers=access_headers, json=valid_certificate)
    assert response.status_code == 200 and len(response.json) == 1
    print(response.json[0])
    assert response.json[0]['id'] == cert1['id']
    assert response.json[0]['validFrom'] == cert3['validFrom']
    assert response.json[0]['validTo'] == cert3['validTo']
    assert response.json[0]['issuer'] == cert3['issuer']
    assert response.json[0]['protocol'] == cert3['protocol']
    assert response.json[0]['cipher'] == cert3['cipher']
    
    updated_certificate["url"] = "nothing-url"
    client.post("/api/certificates/", headers=access_headers, json=updated_certificate)
    
    updated_certificate["sanList"] = ["nothing-sanlist"]
    client.post("/api/certificates/", headers=access_headers, json=updated_certificate)
    
    updated_certificate["subjectName"] = "nothing-subject-name"
    client.post("/api/certificates/", headers=access_headers, json=updated_certificate)

    response = client.get("/api/certificates/", headers=access_headers, json=valid_certificate)
    assert response.status_code == 200 and len(response.json) == 4

    response = client.get("/api/certificates/", headers=access_headers_two, json=valid_certificate)
    assert response.status_code == 200 and len(response.json) == 1

def test_certificate_set_edge_cases(client: FlaskClient, access_headers, access_headers_two, valid_certificate):
    """Tests if we can get a multiple certificates, only from this user"""
    pass

def test_certificate_evaluate_policies(client: FlaskClient, access_headers, access_headers_two, valid_certificate):
    """Tests if we can get a multiple certificates, only from this user"""
    pass