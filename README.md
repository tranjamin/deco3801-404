# DECO3801 Team 404

## Contributing

`main` cannot be committed to directly. Instead, create a new branch and submit a pull request into `main`. Each pull request must fulfill certain requirements, such as getting approval from another person and passing deployment checks. Merge with squash commits if you are merging in a single feature and don't need commit-level granularity; for merging multiple features (e.g. from a `dev` branch), rebase.

## Frontend

## Backend

The backend files should all be in `/backend`, because it is this and only this folder which acts as the root workspace for the deployment server. 

### Local Testing

```sh
cd backend
# first, copy an .env file with either local or deployed database secrets to backend/.env
pip install -r requirements.txt
python -m flask --app backend run # to deploy with flask
python -m gunicorn backend:app # to deploy with gunicorn (linux only)
```



Policy Import/Export Format;
{
    "description": "My Example Policy",
    "protocols": ["TLS 1.2", "QUIC"],
    "subjects": ["UQ", "The University of Queensland", "Blackboard"],
    "SANs": ["https://portal.my.uq.edu.au/#/dashboard", "https://my.uq.edu.au/#/dashboard", "1.2.3.4"],
    "issuers": ["Amazon RSA 2048 M04", "Let's Encrypt", "DigiCert"],
    "issuedAfter": 50,
    "validFor": 10,
    "hasSCT": True,
    "transparencyCompliance": True,
}
