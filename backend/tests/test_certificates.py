from flask.testing import FlaskCliRunner, FlaskClient
import pytest
import random
from flask import Flask

from app import create_app

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

def test_certificate_get(client: FlaskClient):  
    response = client.get("/api/certificates/")
    assert response.status_code == 200
