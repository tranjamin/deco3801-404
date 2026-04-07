# API

## Cloud Development

1. Push repository to GitHub.
2. Go to `https://dashboard.render.com/`.
3. Go to `Blueprints`.
4. Click `New Blueprints Instance`.
5. Connect your repository.

## Local Development

### Prerequisites

- Install [Python](https://www.python.org/)

### Create Virtual Environment

```bash
python -m venv venv # windows
python3 -m venv venv # mac and linux
```

### Activate Virtual Environment
```bash
venv\Scripts\activate # windows (cmd.exe)
venv\Scripts\Activate.ps1 # windows (powershell)
source venv/bin/activate # mac and linux
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Run
```bash
python -m flask --app app run # windows
python3 -m flask --app app run # mac and linux
```

### Deactivate Virtual Environment
```bash
deactivate
```