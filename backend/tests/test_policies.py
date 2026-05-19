# type: ignore
from re import L

from flask.testing import FlaskCliRunner, FlaskClient
import pytest
import warnings

from app import create_app
from app.models.policy import (
    POLICY_CIPH_MAXLEN, POLICY_DESC_MAXLEN, POLICY_DOMA_MAXLEN, POLICY_ISSU_MAXLEN, 
    POLICY_MAX_ARRAY_SIZE, POLICY_NAME_MAXLEN, POLICY_SUBJ_MAXLEN
)
from test_fixtures import *

def test_policy_routes_no_jwt(client: FlaskClient):
    """All routes should return 401 if there is no authorization header"""
    assert client.get("/api/policies/").status_code == 401
    assert client.post("/api/policies/").status_code == 401
    assert client.get("/api/policies/0").status_code == 401
    assert client.put("/api/policies/0/update").status_code == 401
    assert client.put("/api/policies/0/active").status_code == 401
    assert client.delete("/api/policies/0").status_code == 401

def test_policy_routes_with_jwt(client: FlaskClient, access_headers: dict):
    """If the authorization header has been provided, should not return 401"""
    assert client.get("/api/policies/", headers=access_headers).status_code != 401
    assert client.post("/api/policies/", headers=access_headers).status_code != 401
    assert client.get("/api/policies/0", headers=access_headers).status_code != 401
    assert client.put("/api/policies/0/update", headers=access_headers).status_code != 401
    assert client.put("/api/policies/0/active", headers=access_headers).status_code != 401
    assert client.delete("/api/policies/0", headers=access_headers).status_code != 401

def test_api_policies_get__empty(client: FlaskClient, access_headers: dict):
    """
    /api/policies/ (GET)
    should return an empty JSON list if no policies have been added
    """
    response = client.get("/api/policies/", headers=access_headers)
    assert isinstance(response.json, list)
    assert len(response.json) == 0

def test_api_policies_post__set(client: FlaskClient, access_headers: dict, valid_policy: dict):
    """
    /api/policies (POST)
    should allow us to add a policy and return the stored policy, which should be identical
    """
    # send policy
    response = client.post("/api/policies/", headers=access_headers, json=valid_policy)
    
    # check response status
    assert response.status_code == 201 and response.json is not None
    
    # check that response fields are the same
    assert response.json['name'] == valid_policy['name']
    assert response.json['description'] == valid_policy['description']
    assert response.json['domains'] == valid_policy['domains']
    assert response.json['validCiphers'] == valid_policy['validCiphers']
    assert response.json['validSubjects'] == valid_policy['validSubjects']
    assert response.json['validProtocols'] == valid_policy['validProtocols']
    assert response.json['validIssuers'] == valid_policy['validIssuers']
    assert response.json['minCertificateLifespan'] == valid_policy['minCertificateLifespan']
    assert response.json['minCertificateDaysLeft'] == valid_policy['minCertificateDaysLeft']

    # check data types of the response fields
    try:
        assert isinstance(response.json['name'], str)
        assert isinstance(response.json['description'], str)
        assert isinstance(response.json['validCiphers'], list)
        assert isinstance(response.json['validSubjects'], list)
        assert isinstance(response.json['validProtocols'], list)
        assert isinstance(response.json['domains'], list)
        assert isinstance(response.json['validIssuers'], list)
        assert isinstance(response.json['minCertificateLifespan'], int)
        assert isinstance(response.json['minCertificateDaysLeft'], int)
        assert isinstance(response.json['id'], int)
        assert isinstance(response.json['active'], bool)
    except AssertionError as e:
        warnings.warn(f"Warning: unexpected data type in policy response. Error is {e}")

def test_api_policies_id_get(client: FlaskClient, access_headers: dict, valid_policy: dict):
    """
    /api/policies/<id> (GET)
    should allow us to get a policy by its id
    """
    
    # create policy
    response_set = client.post("/api/policies/", headers=access_headers, json=valid_policy)
    assert response_set.status_code == 201

    # get the policy by its id
    response_get = client.get(f"/api/policies/{response_set.json['id']}", headers=access_headers)
    assert response_get.status_code == 200
    
    # policies should be identical
    assert response_get.json == response_set.json

def test_api_policies_id_get__unauthorised_or_invalid(client: FlaskClient, access_headers: dict, access_headers_two: dict, valid_policy: dict):
    """
    /api/policies/<id> (GET)
    should return the same error code if the policy id doesn't exist or belongs to another user
    """
    # create a policy
    response_set = client.post("/api/policies/", headers=access_headers, json=valid_policy)
    assert response_set.status_code == 201

    # get a policy from a different user
    response_one = client.get(f"/api/policies/{int(response_set.json['id'])}", headers=access_headers_two)  
    
    # get a policy from an nonexistant id
    response_two = client.get(f"/api/policies/{int(response_set.json['id'] + 1)}", headers=access_headers)
    
    # check that responses are the same
    assert response_one.status_code == 404 and response_two.status_code == 404
    assert response_one.data == response_two.data

def test_api_policies_delete(client: FlaskClient, access_headers: dict, valid_policy: dict):
    """
    /api/policies/ (DELETE)
    should be able to delete a policy
    """
    # create policy
    response_set = client.post("/api/policies/", headers=access_headers, json=valid_policy)
    assert response_set.status_code == 201

    # delete policy
    response_get = client.delete(f"/api/policies/{response_set.json['id']}", headers=access_headers)
    assert response_get.status_code == 200

def test_api_policies_delete__unauthorised_or_invalid(client: FlaskClient, access_headers: dict, access_headers_two: dict, valid_policy: dict):
    """
    /api/policies/ (DELETE)
    should not be able to delete a policy belonging to a different user or that does not exist
    these two cases should return the same response
    """
    # create policy
    response_set = client.post("/api/policies/", headers=access_headers, json=valid_policy)
    assert response_set.status_code == 201

    # try to delete from a different user
    response_one = client.delete(f"/api/policies/{int(response_set.json['id'])}", headers=access_headers_two)  
    
    # try to delete a nonexistant policy
    response_two = client.delete(f"/api/policies/{int(response_set.json['id'] + 1)}", headers=access_headers)
    
    # responses should be identical
    assert response_one.status_code == 404 and response_two.status_code == 404
    assert response_one.data == response_two.data

def test_api_policies_id_active(client: FlaskClient, access_headers: dict, valid_policy: dict):
    """
    /api/policies/<id>/active (PUT)
    should be able to activate/deactivate a policy
    """
    # create policy
    response_set = client.post("/api/policies/", headers=access_headers, json=valid_policy)
    assert response_set.status_code == 201

    # activate
    assert client.put(f"/api/policies/{response_set.json['id']}/active", headers=access_headers, json={"active": True}).status_code == 200
    
    # check active
    response_get = client.get("/api/policies/", headers=access_headers)
    assert response_get.json[0]["active"] == True
    
    # deactivate
    assert client.put(f"/api/policies/{response_set.json['id']}/active", headers=access_headers, json={"active": False}).status_code == 200
    
    # check active
    response_get = client.get("/api/policies/", headers=access_headers)
    assert response_get.json[0]["active"] == False

def test_api_policies_id_active__unauthorised_or_invalid(client: FlaskClient, access_headers: dict, access_headers_two: dict, valid_policy: dict):
    """
    /api/policies/<id>/active (PUT)
    should not be able to activate a policy belonging to a different user or that does not exist
    these two cases should return the same response
    """
    # create policy
    response_set = client.post("/api/policies/", headers=access_headers, json=valid_policy)
    assert response_set.status_code == 201

    # try to activate from a different user
    response_one = client.put(f"/api/policies/{int(response_set.json['id'])}/active", headers=access_headers_two, json={"active": True})  
    
    # try to activate a nonexistant policy
    response_two = client.put(f"/api/policies/{int(response_set.json['id'] + 1)}/active", headers=access_headers, json={"active": True})
    
    # responses should be identical
    assert response_one.status_code == 404 and response_two.status_code == 404
    assert response_one.data == response_two.data

def test_api_policies_get__one(client: FlaskClient, access_headers: dict, valid_policy: dict):
    """
    /api/policies/ (GET)
    should be able to retrieve all user's policies, if only a single has been added
    """
    # create policy
    response_set = client.post("/api/policies/", headers=access_headers, json=valid_policy)
    assert response_set.status_code == 201

    response = client.get("/api/policies/", headers=access_headers, json=valid_policy)
    assert response.status_code == 200
    assert response.json == [response_set.json]

def test_api_policies_get__multiple(client: FlaskClient, access_headers: dict, access_headers_two: dict, valid_policy: dict, valid_policy_two: dict):
    """
    /api/policies/ (GET)
    should we able to get multiple policies from a user, if set
    should not be able to get policies belonging to other users
    """

    # adds two policies to user 1 and one to user 2
    response_set = client.post("/api/policies/", headers=access_headers, json=valid_policy)
    response_set2 = client.post("/api/policies/", headers=access_headers, json=valid_policy_two)
    response_set3 = client.post("/api/policies/", headers=access_headers_two, json=valid_policy)

    # tries to get both policies from user 1
    response_get = client.get("/api/policies/", headers=access_headers, json=valid_policy)
    assert response_get.status_code == 200
    assert len(response_get.json) == 2 and response_set.json in response_get.json and response_set2.json in response_get.json

    # tries to get 1 policy from user 2
    response_get2 = client.get("/api/policies/", headers=access_headers_two, json=valid_policy)
    assert response_get2.status_code == 200
    assert len(response_get2.json) == 1 and response_set3.json in response_get2.json

def test_api_policies_put__update(client: FlaskClient, access_headers: dict, access_headers_two: dict, valid_policy: dict):
    """
    /api/policies/<id>/update (PUT)
    should be able to update a policy with new data, except for the active flag
    """
    
    # add a policy to two users
    policy1 = client.post("/api/policies/", headers=access_headers, json=valid_policy).json
    policy2 = client.post("/api/policies/", headers=access_headers_two, json=valid_policy).json

    # create an altered policy
    updated_policy = valid_policy
    updated_policy["minCertificateLifespan"] += 1
    updated_policy["minCertificateDaysLeft"] += 1
    updated_policy["name"] = "updated-name"
    updated_policy["description"] = "updated-description"
    updated_policy["domains"] = ["updated-domains"]
    updated_policy["validCiphers"] = ["updated-validCiphers"]
    updated_policy["validSubjects"] = ["updated-subjects"]
    updated_policy["validProtocols"] = ["TLS 1.3"]
    updated_policy["validIssuers"] = ["updated-issuers"]
    updated_policy["active"] = False

    # add the altered policy
    assert client.put(f"/api/policies/{policy1["id"]}/update", headers=access_headers, json=updated_policy).status_code == 200
    
    # check that the first policy was updated and no new policy was added
    response = client.get("/api/policies/", headers=access_headers, json=valid_policy)
    assert response.status_code == 200 and len(response.json) == 1
    assert response.json[0]['id'] == policy1['id']
    assert response.json[0]['minCertificateLifespan'] == updated_policy['minCertificateLifespan']
    assert response.json[0]['minCertificateDaysLeft'] == updated_policy['minCertificateDaysLeft']
    assert response.json[0]['validIssuers'] == updated_policy['validIssuers']
    assert response.json[0]['description'] == updated_policy['description']
    assert response.json[0]['validCiphers'] == updated_policy['validCiphers']
    assert response.json[0]['validSubjects'] == updated_policy['validSubjects']
    assert response.json[0]['validProtocols'] == updated_policy['validProtocols']
    assert response.json[0]['domains'] == updated_policy['domains']
    assert response.json[0]['name'] == updated_policy['name']
    assert response.json[0]['active'] == True
    
    # ensure the other user was not affected
    response = client.get("/api/policies/", headers=access_headers_two, json=valid_policy)
    assert response.status_code == 200 and response.json[0] == policy2

def test_api_policies_post__edge_cases(client: FlaskClient, access_headers: dict, valid_policy: dict):
    """
    /api/policies/ (POST)
    Tests various edge cases with the policy formatting 
    """
    # strings should be parsable as lists
    edge_cases_cert = valid_policy.copy()
    edge_cases_cert["validProtocols"] = "singleton-protocol"
    edge_cases_cert["validCiphers"] = "singleton-cipher"
    edge_cases_cert["validSubjects"] = "singleton-subject"
    edge_cases_cert["validIssuers"] = "singleton-issuer"
    edge_cases_cert["domains"] = "singleton-domain"
    
    # check it was successful and strings were parsed
    response = client.post("/api/policies/", headers=access_headers, json=edge_cases_cert)
    assert response.status_code == 201 and response.json is not None
    assert response.json["validProtocols"] == []
    assert response.json["validCiphers"] == ["singleton-cipher"]
    assert response.json["validSubjects"] == ["singleton-subject"]
    assert response.json["validIssuers"] == ["singleton-issuer"]
    assert response.json["domains"] == ["singleton-domain"]
    
    # all fields are optional
    edge_cases_cert = {}

    # check it was successful and optional arguments was filled with defaults
    response = client.post("/api/policies/", headers=access_headers, json=edge_cases_cert)
    assert response.status_code == 201 and response.json is not None
    assert response.json["validCiphers"] == []
    assert response.json["validProtocols"] == []
    assert response.json["validSubjects"] == []
    assert response.json["validIssuers"] == []
    assert response.json["domains"] == []
    assert response.json["name"] == "Unnamed Policy"
    assert response.json["description"] == "No description provided"
    assert response.json["minCertificateLifespan"] == 0
    assert response.json["minCertificateDaysLeft"] == 0

    # check timeframes cannot be negative
    edge_cases_cert = valid_policy.copy()
    edge_cases_cert["minCertificateLifespan"] = -1
    assert client.post("/api/policies/", headers=access_headers, json=edge_cases_cert).status_code == 400

    edge_cases_cert = valid_policy.copy()
    edge_cases_cert["minCertificateDaysLeft"] = -1
    assert client.post("/api/policies/", headers=access_headers, json=edge_cases_cert).status_code == 400

    # all data should be suitably truncated to prevent exploitation
    long_string = "abcdefg" * 100
    edge_cases_cert = valid_policy.copy()
    edge_cases_cert["name"] = long_string
    edge_cases_cert["description"] = long_string
    edge_cases_cert["validIssuers"] = [long_string] * 100
    edge_cases_cert["validCiphers"] = [long_string] * 100
    edge_cases_cert["validSubjects"] = [long_string] * 100
    edge_cases_cert["domains"] = [long_string] * 100
    
    # ensure data has been truncated
    response = client.post("/api/policies/", headers=access_headers, json=edge_cases_cert)
    assert response.status_code == 201
    assert response.json["name"] == long_string[:POLICY_NAME_MAXLEN]
    assert response.json["description"] == long_string[:POLICY_DESC_MAXLEN]
    assert len(response.json["validCiphers"]) == POLICY_MAX_ARRAY_SIZE
    for cipher in response.json["validCiphers"]:
        assert cipher == long_string[:POLICY_CIPH_MAXLEN]
    assert len(response.json["validSubjects"]) == POLICY_MAX_ARRAY_SIZE
    for subject in response.json["validSubjects"]:
        assert subject == long_string[:POLICY_SUBJ_MAXLEN]
    assert len(response.json["validIssuers"]) == POLICY_MAX_ARRAY_SIZE
    for issuer in response.json["validIssuers"]:
        assert issuer == long_string[:POLICY_ISSU_MAXLEN]
    assert len(response.json["domains"]) == POLICY_MAX_ARRAY_SIZE
    for domain in response.json["domains"]:
        assert domain == long_string[:POLICY_DOMA_MAXLEN]
        
    # input data should require the right data type
    edge_cases_cert = valid_policy.copy(); edge_cases_cert["name"] = 5;
    assert client.post("/api/policies/", headers=access_headers, json=edge_cases_cert).status_code == 400
    
    edge_cases_cert = valid_policy.copy(); edge_cases_cert["validIssuers"] = ["text", False];
    assert client.post("/api/policies/", headers=access_headers, json=edge_cases_cert).status_code == 400
    
    edge_cases_cert = valid_policy.copy(); edge_cases_cert["validCiphers"] = ["text", False];
    assert client.post("/api/policies/", headers=access_headers, json=edge_cases_cert).status_code == 400
    
    edge_cases_cert = valid_policy.copy(); edge_cases_cert["description"] = 5;
    assert client.post("/api/policies/", headers=access_headers, json=edge_cases_cert).status_code == 400
    
    edge_cases_cert = valid_policy.copy(); edge_cases_cert["validSubjects"] = ["text", False];
    assert client.post("/api/policies/", headers=access_headers, json=edge_cases_cert).status_code == 400
    
    edge_cases_cert = valid_policy.copy(); edge_cases_cert["domains"] = ["text", False];
    assert client.post("/api/policies/", headers=access_headers, json=edge_cases_cert).status_code == 400
    
    edge_cases_cert = valid_policy.copy(); edge_cases_cert["validProtocols"] = ["text", False];
    assert client.post("/api/policies/", headers=access_headers, json=edge_cases_cert).status_code == 400
    
    edge_cases_cert = valid_policy.copy(); edge_cases_cert["minCertificateLifespan"] = "text";
    assert client.post("/api/policies/", headers=access_headers, json=edge_cases_cert).status_code == 400
    
    edge_cases_cert = valid_policy.copy(); edge_cases_cert["minCertificateDaysLeft"] = "text";
    assert client.post("/api/policies/", headers=access_headers, json=edge_cases_cert).status_code == 400
    
    edge_cases_cert = valid_policy.copy(); edge_cases_cert["minCertificateLifespan"] = 5.0;
    assert client.post("/api/policies/", headers=access_headers, json=edge_cases_cert).status_code == 400
    
    edge_cases_cert = valid_policy.copy(); edge_cases_cert["minCertificateDaysLeft"] = 5.0;
    assert client.post("/api/policies/", headers=access_headers, json=edge_cases_cert).status_code == 400