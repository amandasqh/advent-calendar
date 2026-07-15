import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
application = get_wsgi_application()


# ---------------------------------------------------------------------------
# Telegram boot notification -- optional. Set TELEGRAM_BOT_TOKEN and
# TELEGRAM_CHAT_ID (see README) to get pinged whenever a real server process
# boots this WSGI app. On Render's free tier that's a handy proxy for "the
# site just got a visit" -- free web services spin down after 15 minutes
# idle, so a cold start (and therefore a notification) fires roughly once
# per visit after a quiet spell, not on every single page load.
#
# This only runs when something imports this module as a WSGI entrypoint
# (gunicorn locally or on Render) -- `manage.py runserver`, `migrate`,
# and `collectstatic` never touch wsgi.py, so local dev and the Render
# build step both stay silent.
# ---------------------------------------------------------------------------
from birthday_calendar.telegram_notify import send_telegram_message  # noqa: E402

hostname = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
where = f"https://{hostname}" if hostname else "local server"
send_telegram_message(f"🎁 Your birthday calendar just started up ({where})")
