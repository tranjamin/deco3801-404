# DECO3801 Team 404

## Contributing

`main` cannot be committed to directly. Instead, create a new branch and submit a pull request into `main`. Each pull request must fulfill certain requirements, such as getting approval from another person and passing deployment checks. Merge with squash commits if you are merging in a single feature and don't need commit-level granularity; for merging multiple features (e.g. from a `dev` branch), rebase.

## Frontend

## Backend

The backend files should all be in `/backend`, because it is this and only this folder which acts as the root workspace for the deployment server. 

### Development

A new endpoint can be created with adding a new route by decorating a function with `@app.route("/endpoint/path")`. The decorated function will be called whenever the endpoint is queried. Do not change the naming of `app` or `run.py`, or otherwise the backend will also need to be modified.

### Run the server locally

```sh
cd backend
pip install -r requirements.txt
python -m flask --app run:app # to deploy with flask
python -m gunicorn --log-level debug run:app # to deploy with gunicorn (linux only)
```
