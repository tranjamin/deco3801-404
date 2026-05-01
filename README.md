# DECO3801 Team 404

## Contributing

`main` cannot be committed to directly. Instead, create a new branch and submit a pull request into `main`. Each pull request must fulfill certain requirements, such as getting approval from another person and passing deployment checks. Merge with squash commits if you are merging in a single feature and don't need commit-level granularity; for merging multiple features (e.g. from a `dev` branch), rebase.

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

The backend files should all be in `/backend`, because it is this and only this folder which acts as the root workspace for the deployment server. 

### Development

A new endpoint can be created with adding a new route by decorating a function with `@app.route("/endpoint/path")`. The decorated function will be called whenever the endpoint is queried. Do not change the naming of `app` or `run.py`, or otherwise the backend will also need to be modified.

### Run the server locally

```sh
cd backend
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
