# Mossy's Birthday Calendar 🎂

A 24-day, advent-calendar-style birthday countdown built with Django +
vanilla HTML/CSS/JS + GSAP. No React, no build step — everything ships as
plain static files Django serves directly.

Countdown target: **July 24, 2026**. Calendar opens 24 days before that
(`START_DATE` in `views.py`), one box unlocking per day.

---

## 1. One-time setup

```bash
pip install -r requirements.txt
```

Your `settings.py` needs these (some may already be there):

```python
INSTALLED_APPS = [
    "django.contrib.staticfiles",
    "django.contrib.sessions",      # not required for game state (see below)
    "django.contrib.contenttypes",  # required by SiteState's migrations
    "birthday_calendar",            # or whatever you've named this app
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",   # required -- the API endpoints are CSRF-protected
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}
```

Then, every time `models.py` changes (including this first time):

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

Visit `http://127.0.0.1:8000/`.

### Local environment variables

`settings.py` loads a `.env` file at the project root (via `python-dotenv`)
before reading any environment variables, so you don't have to `export`
things by hand for local testing:

```bash
cp .env.example .env   # then edit values as needed -- .env is gitignored
```

By default `.env.example` only turns on `DEBUG=True`; `SECRET_KEY` and
`DATABASE_URL` are left commented out so you get the dev-only fallback
key and local sqlite (`db.sqlite3`) automatically. This file is never
used on Render -- it's gitignored, so it never ships, and Render's real
environment variables (set under the Web Service's "Environment" tab)
take over instead. See section 10 below for the production values.

---

## 2. Previewing before the real date

At the top of `views.py`:

```python
START_DATE = date(2026, 7, 1)   # box 1 unlocks on this date, box 2 the day after, etc.
DEBUG_MODE = True                # <-- set False before sending the link to anyone!
```

`DEBUG_MODE = True` unlocks **every** box regardless of the real date, so
you can click through all 24 surprises (and the finale) while building.
Flip it back to `False` for the real thing.

---

## 3. Where everything lives

This project intentionally keeps templates and static files close to the
project root rather than nested inside the app (check your `TEMPLATES` /
`STATICFILES_DIRS` settings to confirm the exact roots you're using).

```
views.py                    -- all box content, unlock logic, API endpoints
models.py                   -- SiteState (the one shared cross-device state row)
urls.py

templates/
  base.html                  -- shared <head>/<script> tags (GSAP, canvas-confetti, Bootstrap)
  home.html / home.js        -- the "click to open" landing page
  letter.html / letter.js    -- the scroll-driven opening letter
  main_screen.html / .js     -- the calendar board itself (the big one)
  finale.html / finale.js    -- day-24 scrapbook/parallax finale page
  components/music_player.html -- the embedded music player (its own <iframe>, own <style>)

static/
  css/  (styles.css = global theme + cursors, main_screen.css, letter.css, finale.css)
  js/   (matches the templates above)
  img/  -- see the asset checklist below
```

### Why the music player is "special"

`components/music_player.html` renders inside an `<iframe>`. Iframes are
separate documents — **they cannot see the parent page's CSS at all** —
so its custom cursor rules, fonts, etc. are duplicated inside its own
`<style>` block rather than shared from `styles.css`. If you ever add a
cursor rule to the main site and wonder why it doesn't show up inside the
player, this is why.

The iframe also talks to the parent page via `postMessage` (see
`main_screen.js`'s `message` listener) to report its own size and which
pixels are actually visible player content, so the surrounding page stays
clickable even though the iframe element itself is bigger than the pill.

---

## 4. Editing the daily content

Everything for all 24 days lives in `BOX_CONTENT` in `views.py`, in order.
Each entry needs a `type`, which decides which modal/mini-game opens it:

| type         | What it does                                                              |
|--------------|----------------------------------------------------------------------------|
| `photo`      | Shows a little photo grid                                                 |
| `coupon`     | Scratch-to-reveal canvas over one or more coupon images                   |
| `gift`       | Shake-to-reveal mini-game (mouse-hold or phone shake), title/desc hidden until revealed |
| `letter`     | A letter-styled modal (reuses the opening-letter aesthetic)               |
| `bucketlist` | An interactive, tap-to-check bucket list (day 10)                         |
| `map`        | The jsVectorMap world map (day 18) — edit `MAP_MARKERS` in `main_screen.js` |
| `breathing`  | The breathing exercise + affirmations (day 23)                            |
| `finale`     | The gift-box reveal that leads to `/finale/` (day 24)                     |
| `others`     | Generic fallback, same modal as `photo`                                   |

Stamps (the little collectible mailbox stickers) are controlled separately
by `STAMP_DATES` and `STAMPS` — a stamp is awarded on top of whatever the
box's normal reveal is, on the listed days.

---

## 5. Cross-device shared state

There's no login system, so progress isn't tied to "your browser." Instead,
`models.py` defines a single `SiteState` row (always `pk=1`) holding:

```python
{
  "opened": [1, 2, 3, ...],                 # which box numbers have been opened
  "positions": {"1": {"x":.., "y":..}, ...}, # where each box was dragged to
  "bucket_checked": [0, 3, 5, ...],          # bucket-list item indices
}
```

Opening a box on a phone shows up immediately if you refresh on a laptop —
there's no per-visitor split. That's a deliberate simplification since this
is a gift for one person, not a multi-tenant app. If you ever want to reset
everything, the simplest way is:

```bash
python manage.py shell -c "from birthday_calendar.models import SiteState; SiteState.objects.all().delete()"
```

---

## 6. Cursors

Three cursor states, defined once globally in `styles.css` and then
**duplicated** inside `main_screen.css` (for the draggable boxes, which
need `!important` to beat Bootstrap's own button reset) and inside
`components/music_player.html` (which can't see any of the site's CSS at
all, being an iframe):

- Normal: `img/cursor_sm.png`
- Hover/click on links, buttons, `.btn`: `img/cursor_paw.png`
- Grab/drag (calendar boxes, gift box, map, slider): `img/cursor_paw.png`

If a cursor doesn't seem to change on hover, check: (a) is it actually a
`<button>`/`<a>`, or a plain `<div>` that needs its own rule, and (b) is it
inside the music player iframe, which needs the rule written twice.

---

## 7. Confetti

Four intentionally different bursts (`canvas-confetti`, loaded in
`base.html`), all in `main_screen.js` unless noted:

- **Coupon** reveal — `fireCouponConfetti()` — the "classic" rain-down burst
- **Gift** reveal (after shaking) — `fireGiftConfetti()` — wider, punchier, gift-box-shaped pieces from lower on screen
- **Stamp** collected — `fireStampConfetti()` — small stars + a heart shape, low gravity
- **Finale** candle blown out — `finale.js` — a school-pride side-cannon burst followed by fireworks
- **Breathing** session — a continuous, gentle leaf-shaped "snow" drift while it's running

---

## 8. Assets

All real assets are in place under `static/img/`:

```
static/img/
  logo.png, box.png, cursor_sm.png, cursor_paw.png, final.png, music.png
  items/item 1.png ... item 24.png          (the 24 box faces)
  stickers/sticker 1.png ... sticker 15.png (stamp collectibles)
  coupons/coupon_*.png                      (per coupon-day box)
  photos/fav_photo*.jpeg                    (photo-type boxes)
  photos/finale/polaroid_1.jpeg ... polaroid_21.jpeg (finale polaroids + loop reel)
```

The site still falls back gracefully if any `<img>` fails to load (an
`onerror` handler swaps in an emoji placeholder), which matters most for
the finale page since it's the one place a missing photo would otherwise
show a broken-image icon mid-scrapbook.

`static/img/gifts/` is intentionally empty — individual gift entries in
`views.py` deliberately don't reference a real photo of the actual gift
(see the shake-to-reveal mechanic).

---

## 9. Known simplifications / things to know

- The world map (day 18) is a fixed, curated set of pins (visited / an
  upcoming trip / bucket list) — not something the viewer can edit by
  clicking. Edit `MAP_MARKERS` in `main_screen.js` to change it.
- Shared state (section 5) means anyone with the link affects everyone's
  view. Fine for a two-person gift; worth knowing if the link ever spreads.
- The music player is third-party and quite large (~1600 lines) — its
  internals aren't documented here beyond the cursor/sizing notes above.
- The `<iframe>` for the music player is now always rendered (even before
  day 6), just invisible/non-interactive via a CSS class, so opening the
  box that unlocks it can reveal it live without a page refresh. That
  means it's quietly loading in the background from day 1 — negligible
  for a personal-gift-sized audience, but worth knowing.

---

## 10. Deploying to Render (free tier)

### One-time setup on Render

1. **Push this project to a GitHub repo** (Render deploys from Git).
2. **Create a Postgres database first** (Render dashboard → New → Postgres,
   choose the **Free** instance type). Copy its "Internal Database URL."
   - ⚠️ Free Render Postgres databases **expire 30 days after creation**.
     Given the calendar only runs ~24 days (July 1–24), this lines up
     nicely — just create the database close to July 1, not months early.
   - Free web services have **no persistent disk**, so a local SQLite file
     is not reliable there (it can disappear on redeploy/restart). Postgres
     is the one that actually survives.
3. **Create a Web Service** (New → Web Service), connect your repo, choose
   the **Free** instance type, and set:
   - **Build Command**: `./build.sh`
     (runs `pip install`, `collectstatic`, and `migrate` — see the file)
   - **Start Command**: `gunicorn mysite.wsgi:application`
   - **Health Check Path**: `/healthz/`
     (a tiny dependency-free endpoint — safer than pointing this at `/`,
     which depends on templates/DB rendering correctly)
4. Under the service's **Environment** tab, add:
   | Key | Value |
   |---|---|
   | `SECRET_KEY` | generate one: `python -c "import secrets; print(secrets.token_urlsafe(50))"` — paste the output, or use Render's "Generate" button if offered |
   | `DEBUG` | leave unset (defaults to `False`) |
   | `DATABASE_URL` | paste the Postgres "Internal Database URL" from step 2 |
   | `RESET_TOKEN` | any long random string, e.g.: `python -c "import secrets; print(secrets.token_urlsafe(32))"` — optional; only gates `/api/reset/` (see "Testing & resetting" below) |
   | `TELEGRAM_BOT_TOKEN` | optional — see "Boot notification" below |
   | `TELEGRAM_CHAT_ID` | optional — see "Boot notification" below |

   `RENDER_EXTERNAL_HOSTNAME` is set automatically by Render — you don't add it yourself; `settings.py` reads it to build `ALLOWED_HOSTS`/`CSRF_TRUSTED_ORIGINS`.

5. Click **Create Web Service**. First deploy takes a few minutes.

### Boot notification (optional)

Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` and `mysite/wsgi.py` will
ping that chat with a message every time a real server process boots. This
only fires for an actual WSGI boot (gunicorn locally or on Render) — never
during `manage.py runserver`, `migrate`, or `collectstatic`, so local dev
and the Render build step both stay silent. On the free tier, a cold start
happens after 15 minutes idle, so in practice this lands roughly once per
visit after a quiet spell rather than on every page load — a cheap way to
know when someone's opened the site.

To get the two values:
1. Message [@BotFather](https://t.me/BotFather) on Telegram, send `/newbot`,
   follow the prompts — it replies with your `TELEGRAM_BOT_TOKEN`.
2. Message your new bot anything (bots can't message you first), then visit
   `https://api.telegram.org/bot<TOKEN>/getUpdates` in a browser — your
   `TELEGRAM_CHAT_ID` is the `"id"` under `"chat"` in the JSON response.

Leave both unset to disable this entirely (it's a no-op without them).

### Testing after it's live

- Visit `https://<your-app>.onrender.com/main/`. Turn `DEBUG_MODE = True`
  in `views.py` (and redeploy) if you want to click through every day
  regardless of the real date.
- **Cold starts**: free web services spin down after 15 minutes idle; the
  next visit takes 30–60 seconds to wake back up. Normal, not a bug.

### Resetting state after a test run

Free-tier Render web services don't include shell/SSH access (that needs a
paid instance type), so there's no `manage.py shell` to reach for. Instead,
visit:

```
https://<your-app>.onrender.com/api/reset/?token=<your RESET_TOKEN value>
```

This deletes the one shared `SiteState` row (opened boxes, drag positions,
bucket-list ticks) so the next visitor starts fresh. Do this once right
before sending the real link, after you're done testing.

### Handling the SECRET_KEY

- Never commit a real one to Git. `settings.py` falls back to an obviously-
  fake dev value if `SECRET_KEY` isn't set, purely so `runserver` works
  locally without any setup.
- On Render, set it as an environment variable (step 4 above) — Render
  encrypts environment variables at rest and they're not visible in logs.
- If you ever suspect it's leaked, just generate a new one and update the
  environment variable — everyone's session cookie/CSRF token just gets
  invalidated, nothing else breaks.

### What NOT to commit / hardcode

- `SECRET_KEY`, `RESET_TOKEN` — environment variables only. Put real values
  in a local `.env` (gitignored, never committed) or Render's Environment
  tab -- see `.env.example` for the local-dev template.
- `db.sqlite3` — it's your entire local game state (opened boxes, drag
  positions); on Render you're using Postgres via `DATABASE_URL` instead.
- `__pycache__/`, `*.pyc`, `staticfiles/`, `.venv/`, `.DS_Store` — all
  build artifacts / local cruft, not source.
- Nothing else in this project is currently sensitive (no API keys, no
  third-party service credentials).

**Gotcha:** `.gitignore` only stops *new* matching files from being
tracked -- it does nothing for files already committed before the rule
existed. If `git status` keeps showing one of the above as "modified"
even though it's gitignored, untrack it once with:
```bash
git rm --cached <path>
```
(This only removes it from git's index -- the file stays on disk.)

