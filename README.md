
# FurArch — Spatial Design Studio

FurArch is a web-based interior design planning prototype built with Flask, SQLite, HTML, CSS, JavaScript and Three.js.

## Features

- Overview dashboard and saved project portfolio
- Create, edit and delete customer room projects
- Interactive 3D room visualization
- Orbit camera, zoom, wall colours and floor colours
- Add sample furniture to the 3D scene
- Room dimensions and furniture recommendations
- Project-stage progress tracking (4D-style workflow)
- Budget manager with illustrative furniture and interior estimates
- Optional AI design assistant using a server-side API key
- JSON API endpoints and persistent SQLite storage
- Responsive layout for desktop and mobile

## Requirements

- Python 3.10 or newer
- Internet access for the Three.js CDN and Google Fonts
- Optional AI provider API key for real AI responses

## Run locally

```bash
python -m venv .venv
```

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python app.py
```

Open http://127.0.0.1:5000/overview

## Pages

- `/overview` — dashboard
- `/studio` — create a design
- `/planner` — interactive 3D room planner
- `/budget` — budget estimates

## Optional AI setup

Create a `.env` file next to `app.py` and set `OPENAI_API_KEY` to a valid API key. Keep `.env` private and never commit it to GitHub. Without a key, the assistant uses a basic local fallback.

## Estimation note

Budget figures are illustrative planning estimates, not quotations or professional construction advice. Validate measurements, material choices and costs with qualified professionals.

## Limitations

The 3D scene is a lightweight prototype with sample geometry, not a full CAD tool. The 4D-style timeline tracks project stages and progress; it does not simulate time-dependent construction physics.
