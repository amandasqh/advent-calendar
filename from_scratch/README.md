# Django conversion

This folder contains a minimal Django project that serves the existing `index.html` as a template and the static files from the project root.

Run locally:

```bash
cd /Users/amandasoh/Desktop/files/advent-calendar/from_scratch
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Open http://127.0.0.1:8000/

Notes:
- `index.html`, `styles.css`, `script.js`, and `assets/` are served as template + static files.
- If you want the static files to live under a `static/` subfolder, move them and update `STATICFILES_DIRS` in `mysite/settings.py`.
