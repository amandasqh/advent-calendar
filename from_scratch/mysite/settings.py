import os
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# No-op in production: `.env` is gitignored and never deployed to Render.
load_dotenv(BASE_DIR / ".env")

# ---------------------------------------------------------------------------
# Security-sensitive settings -- all read from environment variables in
# production. Locally, if you don't set these, safe dev defaults kick in.
#
# On Render, set these under your Web Service's "Environment" tab:
#   SECRET_KEY   -- generate one, e.g.: python -c "import secrets; print(secrets.token_urlsafe(50))"
#   DEBUG        -- leave unset (or "False") in production
#   RESET_TOKEN  -- any long random string; lets you reset game state via a URL (see views.py)
# ---------------------------------------------------------------------------
SECRET_KEY = os.environ.get(
    "SECRET_KEY",
    "django-insecure-dev-only-change-me",  # only ever used for local `runserver`
)
DEBUG = os.environ.get("DEBUG", "False") == "True"

# Render sets RENDER_EXTERNAL_HOSTNAME automatically for every web service.
RENDER_EXTERNAL_HOSTNAME = os.environ.get("RENDER_EXTERNAL_HOSTNAME")

ALLOWED_HOSTS = []
CSRF_TRUSTED_ORIGINS = []
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)
    CSRF_TRUSTED_ORIGINS.append(f"https://{RENDER_EXTERNAL_HOSTNAME}")
else:
    # Not running on Render -> this is local development (runserver).
    # Allowing localhost here regardless of DEBUG means `runserver` just
    # works out of the box, without needing to remember to export DEBUG=True
    # every time. This is still safe in production: RENDER_EXTERNAL_HOSTNAME
    # is always set on an actual Render deploy, so this branch never runs there.
    ALLOWED_HOSTS += ["localhost", "127.0.0.1"]

INSTALLED_APPS = [
    "django.contrib.staticfiles",
    "django.contrib.sessions",
    "django.contrib.contenttypes",
    "birthday_calendar",  # <-- rename to match your actual app label if different
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # must come right after SecurityMiddleware
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",  # required -- the API endpoints are CSRF-protected
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "mysite.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
            ],
        },
    },
]

WSGI_APPLICATION = "mysite.wsgi.application"

# ---------------------------------------------------------------------------
# Database
#
# Render's free web services have NO persistent disk -- a local SQLite file
# will not reliably survive deploys or restarts. If you set a DATABASE_URL
# environment variable (Render fills this in automatically when you attach
# a Render Postgres instance), that's used instead. Without one, this falls
# back to local SQLite for `runserver` on your own machine.
# ---------------------------------------------------------------------------
DATABASES = {
    "default": dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600,
    )
}

STATIC_URL = "/static/"
STATICFILES_DIRS = [BASE_DIR]
STATIC_ROOT = BASE_DIR / "staticfiles"  # collectstatic writes here; whitenoise serves from here

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

if RENDER_EXTERNAL_HOSTNAME:
    # Only force HTTPS/secure cookies on an actual Render deploy. Gating
    # this on DEBUG instead would break local `runserver` (plain HTTP) any
    # time DEBUG happens to be False, e.g. if you forget to set it locally.
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
