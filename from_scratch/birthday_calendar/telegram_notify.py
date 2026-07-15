import os
import urllib.error
import urllib.parse
import urllib.request

# Shared by mysite/wsgi.py (boot notification) and views.py (the "write me a
# note" mailbox) -- both just want "send this text to my phone" without
# caring whether it's configured or whether the network call succeeds.


def send_telegram_message(text):
    """Best-effort: no-ops if unconfigured, swallows any failure. Returns
    whether it actually sent, so callers can decide what to tell the user."""
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        return False

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = urllib.parse.urlencode({"chat_id": chat_id, "text": text}).encode()
    try:
        urllib.request.urlopen(urllib.request.Request(url, data=payload), timeout=5)
        return True
    except (urllib.error.URLError, OSError):
        return False
