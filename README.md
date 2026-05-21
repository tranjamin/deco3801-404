# DECO3801 Team 404

This is a prototype of the TLS Certificate Checker, a full-stack extension-based application which passively monitors TLS certificates as users browse the web.

## Frontend

### Requirements

`Node.js` should be installed in order to build the extension. There is a full guide to installing `Node.js` [here](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).

### Building the Extension

1) Ensure Node.js is installed. This can be done by doing the following commands:
```sh
node -v
npm -v
```

2) Install npm modules in order to get the files required and then build the extension using React
```sh
cd frontend
npm install
npm run build
```

3) Install the extension on a Chromium-based browser. For Chrome the full guide is [here](https://support.google.com/chrome_webstore/answer/2664769?hl=en). Follow the `Manage your extensions` guide.
* Open `chrome://extensions/` on your browser
* Enable `Developer mode` if it is not enabled already
* Click `Load unpacked` and navigate to the `dist` folder within the `frontend`
* The extension should then be installed.


## Backend

### Requirements for Local Development

To run the backend locally, do the following:

1. Install `Python >3.10` in your environment (`Python 3.12` recommended)
2. Install dependencies

```sh
cd backend
python3 -m pip install -r requirements.txt
```

3. Copy you database and security credentials into `backend/.env`

```sh
DB_USERNAME=<your-username>
DB_PASSWORD=<your-password>
DB_HOSTNAME=<your-hostname>
DB_DATABASE=<your-database>
DB_PORT=<your-port>
JWT_SECRET_KEY=<your-secret-key>
JWT_REFRESH_TOKEN_EXPIRES=<your-secret-refresh-key>
```

### Local Deployment

Run the backend using `Flask`

```sh
cd backend
python3 run.py
```

### Server Deployment

For production-ready deployment, use `gunicorn` on your server (linux only)

```sh
cd backend
gunicorn run:app
```

### Local Testing

1. Ensure that `docker` is running on your system.
2. Run test suite:

```sh
cd backend
python3 -m pytest .
```

## API Documentation

### API Endpoints:
- /api/certificates/ : top-level route for retrieving certificates
    - [GET] / : retrieves all certificates. returns a list of certificate JSONs
    - [GET] /&lt;id&gt; : retrieves a certificate by ID. returns a certificate JSON
    - [POST] / : stores a certificate. requires a certificate JSON and returns the stored certificate's JSON
    - [DELETE] /&lt;id&gt; : deletes a certificate by ID. returns {"message": &lt;message&gt;}
    -
- /api/policies/ : top-level route for retrieving policies
    - [GET] / : retrieves all policies. returns a list of policy JSONs
    - [GET] /&lt;id&gt; : retrieves a policy by ID. returns a policy JSON
    - [POST] / : stores a policy. requires a policy JSON and returns the stored policy's JSON
    - [DELETE] /&lt;id&gt; : deletes a policy by ID. returns {"message": &lt;message&gt;}
    - [PUT] /&lt;id&gt;/active : sets if a policy is active or not. requires a {"active": &lt;true/false&gt;} and returns {"message": &lt;message&gt;}
    - [PUT] /&lt;id&gt;/update : updates a policy with new details. requires a policy JSON and returns {"message": <message>}
- /api/evaluate/ : top-level route for evaluating certificates against policies
    - [GET] / : evaluates a policy. requires a {"certificate_id": &ltcertificate_id&gt, "policy_id": &ltpolicy_id&gt} and returns an Evaluation Result
- /api/auth/ : top-level route for authenticating users
    - [POST] /register : registers a new user. requires a "username" and "password" field and on success returns an "access_token", "refresh_token" and "user" id.
    - [POST] /login : logs in a user. requires a "username" and "password" field and on success returns an "access_token", "refresh_token" and "user" id.
    - [POST] /refresh : refreshes the tokens of a user. on success, returns an "access_token"
    - [GET] /check : checks if a user is authenticated. returns a boolean.
    - [POST] /change_password : changes a user's password. requires a "password" and "new_password" field
    - [POST] /change_username : changes a user's username. requires a "current_password" and "new_username" field
- /api/reports/ : top-level route for reporting certificate data
    - [GET] /visits : gets a log of certificates visited.
    - [GET] /visits/&lt;id&gt; : gets the certificate visit of a given id.
    - [GET] /domains/stats : gets the statistics about a domain visited. 

### Required Data Formats:
- Certificate JSON:
    - "id": integer - only in response, ignored in request
    - "protocol": choice of either "tls 1.0", "tls 1.1", "tls 1.2", "tls 1.3", "quic"
    - "cipher": string (max 50)
    - "subjectName": string (max 50)
    - "sanList": list of strings (max 50)
    - "issuer": string (max 50)
    - "validFrom": float
    - "validTo": float
    - "url": string (max 255)
    - "issues": list of strings

- Policy JSON:
    - "id": integer - only in response, ignored in request
    - "active": boolean - only in response, ignored in request
    - "description": string (max 255)
    - "name": string (max 50)
    - "domains": list of strings (max 50)
    - "validProtocols": list of the following options: "tls 1.0", "tls 1.1", "tls 1.2", "tls 1.3"
    - "validSubjects": list of string(max 50)
    - "validIssuers": list of string(max 50)
    - "validSans": list of string(max 50)
    - "validCiphers": list of string(max 50)
    - "minCertificateLifespan": int (in days)
    - "minCertificateDaysLeft": int

- Evaluation JSON:
    -  "isExpired": bool, True if certificate has expired
    -  "daysUntilExpiry": int (in days)
    -  "issues": list of issues flagged, in the format specified by `class:Flags`
    -  "pass": bool, True if all checks passed
"""

## Policy Import/Export Format:
```sh
{
    "description": "My Example Policy",
    "protocols": ["TLS 1.2", "QUIC"],
    "subjects": ["UQ", "The University of Queensland", "Blackboard"],
    "issuers": ["Amazon RSA 2048 M04", "Let's Encrypt", "DigiCert"],
    "issuedAfter": 50,
    "validFor": 10,
    "transparencyCompliance": True,
}
```

## Credit

* Icons were obtained from https://www.svgrepo.com
