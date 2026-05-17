# 🎂 Birthday App — Setup Guide

## Files
- `BirthdayApp.jsx` — main React frontend (deploy to Cloudflare Pages)
- `worker.js` — Cloudflare Worker (state sync + Telegram bot)
- `wrangler.toml` — Worker config

---

## 1. Frontend (Cloudflare Pages)

```bash
# Create a Vite + React project
npm create vite@latest birthday-app -- --template react
cd birthday-app

# Install deps
npm install

# Copy BirthdayApp.jsx into src/App.jsx (replace contents)

# Add Google Fonts to index.html <head>:
# <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500&family=Caveat:wght@500;700&display=swap" rel="stylesheet">

# Build
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy dist --project-name birthday-app
```

---

## 2. Backend Worker (state + Telegram)

```bash
# Install wrangler globally if needed
npm install -g wrangler
wrangler login

# Create KV namespace
wrangler kv:namespace create BDAY_KV
# Copy the ID it prints into wrangler.toml

# Set Telegram secrets
wrangler secret put TELEGRAM_BOT_TOKEN
# paste your bot token (from @BotFather on Telegram)

wrangler secret put TELEGRAM_CHAT_ID
# paste your Telegram chat/user ID (get from @userinfobot)

# Deploy worker
wrangler deploy
```

After deploying the worker, update your `BirthdayApp.jsx`:
Find `const WORKER_URL = ""` (add this near the top) and set it to your worker URL,
e.g. `"https://birthday-app.YOUR-NAME.workers.dev"`.

Then add this hook inside App() to sync state to the worker:
```js
useEffect(() => {
  const state = { openedDays, stamps };
  fetch(`${WORKER_URL}/state`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  });
}, [openedDays, stamps]);
```

---

## 3. Telegram bot setup (quick)

1. Message **@BotFather** on Telegram → `/newbot` → follow prompts → copy token
2. Message **@userinfobot** → copy your chat ID
3. Run the `wrangler secret put` commands above

You'll receive a Telegram message every time he opens a day or collects a stamp. 🎉

---

## 4. Customise before sending

### Things to fill in:
- [ ] Replace all `📸` photo placeholders with real images (base64 or hosted URLs)
- [ ] Replace YouTube playlist URL: search `PLxxxxxx` in the code
- [ ] Day 26: add your story text
- [ ] Days with `hint`: update the hiding spots for physical gifts
- [ ] Voice note: record a .mp3, host it, add `<audio>` in the letter step
- [ ] AI days (22, 23): generate images with any AI tool, add as `<img>` tags
- [ ] Set `DEV_MODE = false` before going live (so days lock properly by date)

### Setting the unlock dates:
The app unlocks each day on `July [day] 2026 at 8:00am`.
Day 27 unlocks at `July 27 2026 at midnight`.
Controlled by `isUnlocked()` function — change `UNLOCK_HOUR` if you want a different time.

---

## 5. Custom domain (optional)

In Cloudflare Pages dashboard → your project → Custom domains → add your domain.
Free with any Cloudflare account.

---

Good luck!! 🤎
