from flask.testing import FlaskCliRunner, FlaskClient
import pytest
import random
from flask import Flask

from app import create_app

HTTP_METHODS = ["get", "post", "put", "patch", "delete", "head", "options"]

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

def test_invalid_methods_batch(client: FlaskClient):  
    for method in HTTP_METHODS:
        if method in ["post"]:
            continue
        assert getattr(client, method)("/batch").status_code == 404

def test_invalid_methods_root(client: FlaskClient):
    for method in HTTP_METHODS:
        if method in ["post", "get"]:
            continue
        assert getattr(client, method)("/").status_code == 404

def test_invalid_methods_search(client: FlaskClient):    
    for method in HTTP_METHODS:
        if method in ["get"]:
            continue
        assert getattr(client, method)("/search").status_code == 404

def test_invalid_methods_expired(client: FlaskClient):
    for method in HTTP_METHODS:
        if method in ["get"]:
            continue
        assert getattr(client, method)("/expired").status_code == 404

def test_invalid_methods_expiring(client: FlaskClient):
    for method in HTTP_METHODS:
        if method in ["get"]:
            continue
        assert getattr(client, method)("/expiring").status_code == 404

def test_invalid_methods_cert_id(client: FlaskClient):
    for method in HTTP_METHODS:
        if method in ["post", "delete"]:
            continue
        random.seed(42)
        for _ in range(10):
            assert getattr(client, method)(f"/{random.randint(-10000, 10000)}").status_code == 404

def test_invalid_methods_cert_id_evaluate(client: FlaskClient):    
    for method in HTTP_METHODS:
        if method in ["get"]:
            continue
        random.seed(42)
        for _ in range(10):
            assert getattr(client, method)(f"/{random.randint(-10000, 10000)}/evaluate").status_code == 404