from flask.testing import FlaskCliRunner, FlaskClient
import pytest
import random
from test_fixtures import *

HTTP_METHODS = ["get", "post", "put", "delete"]

def test_invalid_methods_info(client: FlaskClient, access_headers):
    for method in HTTP_METHODS:
        if method in ["get"]:
            continue
        assert getattr(client, method)("/", headers=access_headers).status_code == 405

def test_invalid_methods_cert(client: FlaskClient, access_headers):  
    for method in HTTP_METHODS:
        if method in ["get", "post"]:
            continue
        assert getattr(client, method)("/api/certificates/", headers=access_headers).status_code == 405

def test_invalid_methods_cert_id(client: FlaskClient, access_headers):
    for method in HTTP_METHODS:
        if method in ["get", "delete"]:
            continue
        random.seed(42)
        for _ in range(10):
            assert getattr(client, method)(f"api/certificates/{random.randint(0, 10000)}", headers=access_headers).status_code == 405

def test_invalid_methods_policy(client: FlaskClient, access_headers):  
    for method in HTTP_METHODS:
        if method in ["get", "post"]:
            continue
        assert getattr(client, method)("/api/policies/", headers=access_headers).status_code == 405

def test_invalid_methods_policy_id(client: FlaskClient, access_headers):
    for method in HTTP_METHODS:
        if method in ["delete", "get"]:
            continue
        random.seed(42)
        for _ in range(10):
            assert getattr(client, method)(f"api/policies/{random.randint(0, 10000)}", headers=access_headers).status_code == 405

def test_invalid_methods_policy_id_active(client: FlaskClient, access_headers):
    for method in HTTP_METHODS:
        if method in ["put"]:
            continue
        random.seed(42)
        for _ in range(10):
            assert getattr(client, method)(f"api/policies/{random.randint(0, 10000)}/active", headers=access_headers).status_code == 405

def test_invalid_methods_policy_id_update(client: FlaskClient, access_headers):
    for method in HTTP_METHODS:
        if method in ["put"]:
            continue
        random.seed(42)
        for _ in range(10):
            assert getattr(client, method)(f"api/policies/{random.randint(0, 10000)}/update", headers=access_headers).status_code == 405

def test_invalid_methods_eval(client: FlaskClient, access_headers):
    for method in HTTP_METHODS:
        if method in ["get"]:
            continue
        random.seed(42)
        for _ in range(10):
            assert getattr(client, method)(f"api/evaluate/", headers=access_headers).status_code == 405
