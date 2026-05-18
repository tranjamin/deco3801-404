# type: ignore
from re import L

from flask.testing import FlaskCliRunner, FlaskClient
import pytest
import warnings

from app import create_app
from test_fixtures import *

def test_certificate_routes_no_jwt(client: FlaskClient):
    """All routes should return 401 if there is no authorization header"""
    assert client.get("/api/evaluate/").status_code == 401

def test_certificate_routes_with_jwt(client: FlaskClient, access_headers: dict):
    """If the authorization header has been provided, should not return 401"""
    assert client.get("/api/evaluate/", headers=access_headers).status_code != 401

def evaluation_