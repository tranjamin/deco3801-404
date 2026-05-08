from flask.testing import FlaskCliRunner, FlaskClient
import pytest
import random
from flask import Flask

from app import create_app

HTTP_METHODS = ["get", "post", "put", "delete"]

@pytest.fixture()
def app():
    app: Flask = create_app()
    app.config.update({"TESTING": True}) # type: ignore

    yield app

@pytest.fixture()
def client(app: Flask) -> FlaskClient:
    return app.test_client()

@pytest.fixture()
def runner(app: Flask) -> FlaskCliRunner:
    return app.test_cli_runner()

def test_invalid_methods_info(client: FlaskClient):  
    for method in HTTP_METHODS:
        if method in ["get"]:
            continue
        assert getattr(client, method)("/").status_code == 405

def test_invalid_methods_cert(client: FlaskClient):  
    for method in HTTP_METHODS:
        if method in ["get", "post"]:
            continue
        assert getattr(client, method)("/api/certificates/").status_code == 405

def test_invalid_methods_cert_batch(client: FlaskClient):  
    for method in HTTP_METHODS:
        if method in ["post"]:
            continue
        assert getattr(client, method)("/api/certificates/batch").status_code == 405

def test_invalid_methods_cert_expiring(client: FlaskClient):  
    for method in HTTP_METHODS:
        if method in ["get"]:
            continue
        assert getattr(client, method)("/api/certificates/expiring").status_code == 405

def test_invalid_methods_cert_expired(client: FlaskClient):  
    for method in HTTP_METHODS:
        if method in ["get"]:
            continue
        assert getattr(client, method)("/api/certificates/expired").status_code == 405

def test_invalid_methods_cert_search(client: FlaskClient):  
    for method in HTTP_METHODS:
        if method in ["get"]:
            continue
        assert getattr(client, method)("/api/certificates/search").status_code == 405

def test_invalid_methods_cert_create_dummy(client: FlaskClient):  
    for method in HTTP_METHODS:
        if method in ["get"]:
            continue
        assert getattr(client, method)("/api/certificates/create_dummy").status_code == 405

def test_invalid_methods_cert_id(client: FlaskClient):
    for method in HTTP_METHODS:
        if method in ["get", "delete"]:
            continue
        random.seed(42)
        for _ in range(10):
            assert getattr(client, method)(f"api/certificates/{random.randint(0, 10000)}").status_code == 405

def test_invalid_methods_policy(client: FlaskClient):  
    for method in HTTP_METHODS:
        if method in ["get", "post"]:
            continue
        assert getattr(client, method)("/api/policies/").status_code == 405

def test_invalid_methods_policy_batch(client: FlaskClient):  
    for method in HTTP_METHODS:
        if method in ["post"]:
            continue
        assert getattr(client, method)("/api/policies/batch").status_code == 405

def test_invalid_methods_policy_create_dummy(client: FlaskClient):  
    for method in HTTP_METHODS:
        if method in ["get"]:
            continue
        assert getattr(client, method)("/api/policies/create_dummy").status_code == 405

def test_invalid_methods_policy_id(client: FlaskClient):
    for method in HTTP_METHODS:
        if method in ["delete", "get"]:
            continue
        random.seed(42)
        for _ in range(10):
            assert getattr(client, method)(f"api/policies/{random.randint(0, 10000)}").status_code == 405

def test_invalid_methods_policy_id_active(client: FlaskClient):
    for method in HTTP_METHODS:
        if method in ["put"]:
            continue
        random.seed(42)
        for _ in range(10):
            assert getattr(client, method)(f"api/policies/{random.randint(0, 10000)}/active").status_code == 405

def test_invalid_methods_policy_id_update(client: FlaskClient):
    for method in HTTP_METHODS:
        if method in ["put"]:
            continue
        random.seed(42)
        for _ in range(10):
            assert getattr(client, method)(f"api/policies/{random.randint(0, 10000)}/update").status_code == 405

def test_invalid_methods_eval(client: FlaskClient):
    for method in HTTP_METHODS:
        if method in ["get"]:
            continue
        random.seed(42)
        for _ in range(10):
            assert getattr(client, method)(f"api/evaluate/").status_code == 405
