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
    # create database
    postgres = PostgresContainer("postgres:16-alpine")
    print("Starting testing database...")
    postgres.start()
    print("Started testing database.")
    os.environ["DB_URL"] = postgres.get_connection_url()
    os.environ["DB_HOSTNAME"] = postgres.get_container_host_ip()
    os.environ["DB_PORT"] = str(postgres.get_exposed_port(5432))
    os.environ["DB_USERNAME"] = postgres.username
    os.environ["DB_PASSWORD"] = postgres.password
    os.environ["DB_DATABASE"] = postgres.dbname

    yield postgres
    postgres.stop()

@pytest.fixture()
def app(database):
    app: Flask = create_app(test=True)
    app.config.update({"TESTING": True}) # type: ignore

    with app.app_context():
        db.create_all()

    yield app

    with app.app_context():
        db.drop_all()
        # db.session.execute(sqlalchemy.text(f"DROP TABLE tls_certificates CASCADE;"))
        # db.session.execute(sqlalchemy.text("DROP TABLE certificate_policies CASCADE;"))
        # db.session.execute(sqlalchemy.text("DROP TABLE users CASCADE;"))
        db.session.commit()
        db.session.remove()

@pytest.fixture()
def client(app: Flask) -> FlaskClient:
    return app.test_client()

@pytest.fixture()
def access_headers(client):
    register_request = {"username": "test_username", "password": "test_password"}
    login_response = client.post("/api/auth/register", json=register_request)
    return {"Authorization": f"Bearer {login_response.get_json()["accessToken"]}"}

@pytest.fixture()
def access_headers_two(client):
    register_request = {"username": "test_username_two", "password": "test_password_two"}
    login_response = client.post("/api/auth/register", json=register_request)
    return {"Authorization": f"Bearer {login_response.get_json()["accessToken"]}"}


@pytest.fixture()
def valid_certificate():
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
def runner(app: Flask) -> FlaskCliRunner:
    return app.test_cli_runner()