import pytest
from flask import Flask
from flask.testing import FlaskCliRunner, FlaskClient
import pytest
from flask import Flask
from testcontainers.postgres import PostgresContainer
import os
from app import create_app, db
import sqlalchemy
import time

@pytest.fixture(scope="module")
def database():
    """Creates a new database for each module"""

    # create postgres container
    postgres = PostgresContainer("postgres:16-alpine")
    postgres.start()

    # set environment variables
    os.environ["DB_URL"] = postgres.get_connection_url()
    os.environ["DB_HOSTNAME"] = postgres.get_container_host_ip()
    os.environ["DB_PORT"] = str(postgres.get_exposed_port(5432))
    os.environ["DB_USERNAME"] = postgres.username
    os.environ["DB_PASSWORD"] = postgres.password
    os.environ["DB_DATABASE"] = postgres.dbname

    yield postgres

    # stop postgres container
    postgres.stop()

@pytest.fixture()
def app(database):
    """Creates a new app and a fresh database. Destroys the database on yield."""

    # create a new app
    app: Flask = create_app(test=True)
    app.config.update({"TESTING": True})

    # create database tables
    with app.app_context():
        db.create_all()

    yield app

    # destroy database tables
    with app.app_context():
        db.drop_all()
        db.session.commit()
        db.session.remove()

@pytest.fixture()
def client(app: Flask) -> FlaskClient:
    """Creates a flask client for testing"""
    return app.test_client()

@pytest.fixture()
def access_headers(client) -> dict:
    """Returns an access header for a dummy user"""
    register_request = {"username": "test_username", "password": "test_password"}
    login_response = client.post("/api/auth/register", json=register_request)
    return {"Authorization": f"Bearer {login_response.get_json()["access_token"]}"}

@pytest.fixture()
def access_headers_two(client):
    """Returns an access header for a second dummy user, distinct from the first"""
    register_request = {"username": "test_username_two", "password": "test_password_two"}
    login_response = client.post("/api/auth/register", json=register_request)
    return {"Authorization": f"Bearer {login_response.get_json()["access_token"]}"}


@pytest.fixture()
def valid_certificate():
    """Returns a valid certificate"""
    return {
        "url": "test-url.test-domain.com",
        "protocol": "tls 1.0",
        "cipher": "this-is-a-cipher",
        "subjectName": "test-subject-name",
        "sanList": ["test-san-1", "test-san-2"],
        "issuer": "test-issuer",
        "validFrom": int(time.time() - 86400),
        "validTo": int(time.time() + 86400),
        "certificateTransparencyCompliance": "compliant"
    }

@pytest.fixture()
def valid_certificate_two():
    """Returns a second valid certificate, distinct from the first"""
    return {
        "url": "test-url-2.test-domain-2.com",
        "protocol": "tls 1.0",
        "cipher": "this-is-a-cipher-2",
        "subjectName": "test-subject-name-2",
        "sanList": ["test-san-1", "test-san-2"],
        "issuer": "test-issuer-2",
        "validFrom": int(time.time() - 86400),
        "validTo": int(time.time() + 86400),
        "certificateTransparencyCompliance": "compliant"
    }

    
@pytest.fixture()
def valid_policy():
    """Returns a valid policy"""
    return {
        "name": "this-is-a-policy-name",
        "description": "this-is-a-policy-description",
        "validProtocols": ["TLS 1.0"],
        "validSubjects": ["test-subject-name"],
        "validIssuers": ["test-issuer"],
        "validCiphers": ["this-is-a-cipher"],
        "domains": ["*.test-domain.com"],
        "minCertificateLifespan": 40,
        "minCertificateDaysLeft": 15,
    }
    
@pytest.fixture()
def valid_policy_two():
    """Returns a second valid policy, distinct from the first"""
    return {
        "name": "this-is-a-policy-name-2",
        "description": "this-is-a-policy-description-2",
        "validProtocols": ["quic"],
        "validSubjects": ["test-subject-name-2"],
        "validIssuers": ["test-issuer-2"],
        "validCiphers": ["this-is-a-cipher-2"],
        "domains": ["*.test-domain-2.com"],
        "minCertificateLifespan": 30,
        "minCertificateDaysLeft": 10,
    }

@pytest.fixture()
def runner(app: Flask) -> FlaskCliRunner:
    """Creates a flask runner for testing"""
    return app.test_cli_runner()