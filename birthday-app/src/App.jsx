/**
 * BirthdayApp.jsx
 * Birthday advent calendar webapp for July 2026
 *
 * Drop into a Vite + React project as src/App.jsx
 * All images referenced as /images/day-XX.jpg — place in public/images/
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ─── PALETTE ──────────────────────────────────────────────────────────────────
const P = {
  bg: "#18140F",
  paper: "#F5EFE0",
  cream: "#EDE4CE",
  dark: "#0D0B08",
  brown: "#3D2B1F",
  brownMid: "#6B4A35",
  brownLight: "#A07858",
  olive: "#3A4A2C",
  navy: "#1A2B3C",
  blush: "#C4A882",
  gold: "#D4953A",
  goldLight: "#E8C070",
  muted: "#8A7A68",
  white: "#FDFAF5",
  ink: "#131009",
};

// ─── CONFIG ───────────────────────────────────────────────────────────────────
// Set DEV_MODE = false before going live — it unlocks all days for preview
const DEV_MODE = true;
const BIRTHDAY = new Date("2026-07-28T00:00:00");

// Grid: 4 columns, each cell 88×88px with 6px gap
const CELL = 88;
const GAP  = 6;
const COLS = 4;

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const SK = "bday_v6";
const loadState  = () => { try { return JSON.parse(localStorage.getItem(SK)) || {}; } catch { return {}; } };
const saveState  = (s) => { try { localStorage.setItem(SK, JSON.stringify(s)); } catch {} };

// ─── TIME HELPERS ─────────────────────────────────────────────────────────────
const isUnlocked = (n) => {
  if (DEV_MODE) return true;
  if (n === 27) return new Date("2026-07-27T00:00:00") <= new Date();
  return new Date(`2026-07-${String(n).padStart(2, "0")}T08:00:00`) <= new Date();
};

// ─── GRID HELPERS ─────────────────────────────────────────────────────────────
// Each day: [colSpan, rowSpan]
const DAY_SIZES = {
  1:[1,1], 2:[2,1], 3:[1,1], 4:[1,2], 5:[1,1], 6:[2,1], 7:[1,1],
  8:[1,1], 9:[2,2], 10:[1,1], 11:[1,1], 12:[1,2], 13:[1,1], 14:[2,1],
  15:[1,1], 16:[1,1], 17:[1,1], 18:[2,1], 19:[1,1], 20:[1,1], 21:[1,2],
  22:[1,1], 23:[1,1], 24:[2,1], 25:[1,1], 26:[1,1], 27:[2,2],
};

function packGrid(overrides = {}) {
  const grid = {};
  const positions = {};
  const mark = (col, row, cs, rs, day) => {
    for (let c = col; c < col + cs; c++)
      for (let r = row; r < row + rs; r++)
        grid[`${c},${r}`] = day;
  };
  const fits = (col, row, cs, rs) => {
    if (col + cs > COLS) return false;
    for (let c = col; c < col + cs; c++)
      for (let r = row; r < row + rs; r++)
        if (grid[`${c},${r}`]) return false;
    return true;
  };

  // Place overridden tile first
  for (const [dayStr, pos] of Object.entries(overrides)) {
    const { col, row, cs, rs } = pos;
    if (fits(col, row, cs, rs)) {
      mark(col, row, cs, rs, parseInt(dayStr));
      positions[dayStr] = pos;
    }
  }

  // Pack the rest
  for (let d = 1; d <= 27; d++) {
    if (positions[d]) continue;
    const [cs, rs] = DAY_SIZES[d];
    let placed = false;
    outer: for (let r = 0; r < 99; r++) {
      for (let c = 0; c <= COLS - cs; c++) {
        if (fits(c, r, cs, rs)) {
          mark(c, r, cs, rs, d);
          positions[d] = { col: c, row: r, cs, rs };
          placed = true;
          break outer;
        }
      }
    }
    if (!placed) {
      positions[d] = { col: 0, row: 99, cs, rs };
    }
  }
  return positions;
}

const toPx = (pos) => ({
  x: pos.col * (CELL + GAP),
  y: pos.row * (CELL + GAP),
  w: pos.cs * (CELL + GAP) - GAP,
  h: pos.rs * (CELL + GAP) - GAP,
});

// ─── DAYS DATA ────────────────────────────────────────────────────────────────
const DAYS = [
  { day: 1,  type: "photo",      title: "Fav photo of you",          note: "This one lives rent-free in my head.",                          color: "#5C3D2A" },
  { day: 2,  type: "photo",      title: "Fav photo of us",           note: "Proof that we are, objectively, the cutest.",                   color: "#2A4A3A" },
  { day: 3,  type: "giftcard",   title: "Gift card — just for you",  amount: "SGD 50", forWhat: "Whatever your heart wants. No guilt.",     color: "#1A3050" },
  { day: 4,  type: "coupon",     title: "Triple coupon bundle",
    coupons: [
      { id: "4a", title: "Free Massage",    desc: "Duration: as long as you want",             expiry: "Never" },
      { id: "4b", title: "1,000,000 Kisses",desc: "Redeemable any time, any place",            expiry: "Lifetime" },
      { id: "4c", title: "Bonus Points ×10",desc: "Apply to any single request",               expiry: "No limit" },
    ],
    note: "Terms: none. Valid forever.", color: "#3A2A4A" },
  { day: 5,  type: "coupon",     title: "Two important coupons",
    coupons: [
      { id: "5a", title: "No-Argument Day", desc: "I will agree. (Mostly.) Full 24hr peace.",  expiry: "One day" },
      { id: "5b", title: "One Free Wish",   desc: "Anything. Seriously. No questions asked.",  expiry: "Whenever" },
    ],
    note: "Use wisely. I'll still say yes.", color: "#2A3A2A" },
  { day: 6,  type: "physical",   title: "Couple pyjamas",            hint: "Check the wardrobe. Top shelf.",                               color: "#4A2A3A" },
  { day: 7,  type: "physical",   title: "Haribo + snack haul",       hint: "Kitchen counter — or I'll hand them to you.",                  color: "#4A3020" },
  { day: 8,  type: "physical",   title: "Voice recorder + necklace", hint: "Will be with you before this day.",                           color: "#1A3A3A" },
  { day: 9,  type: "playlist",   title: "Songs that remind me of you",note: "Every one of these played in my head while I thought of you.",color: "#2A1A4A" },
  { day: 10, type: "physical",   title: "Printed tee",               hint: "Handed to you personally. Look forward to it.",               color: "#3A1A1A" },
  { day: 11, type: "physical",   title: "Handmade card + prints",    hint: "In an envelope. You'll recognise it.",                        color: "#1A3A1A" },
  { day: 12, type: "physical",   title: "Homemade bakes",            hint: "Fresh batch. I'll let you know when ready.",                   color: "#4A3A1A" },
  { day: 13, type: "coupon",     title: "Restaurant date",
    coupons: [
      { id: "13a", title: "Dinner Date",    desc: "Your choice of restaurant. My treat.",      expiry: "Any date" },
    ],
    note: "Fancy or casual. Just us.", color: "#3A1A3A" },
  { day: 14, type: "photo",      title: "Your fav country + us",     note: "This place means something to both of us now.",               color: "#1A3A4A" },
  { day: 15, type: "physical",   title: "AirPod + earphone cases",   hint: "Wrapped and ready. With you soon.",                           color: "#2A4A1A" },
  { day: 16, type: "physical",   title: "Boots shoes",               hint: "Stored safely. Yours when we meet.",                          color: "#2A2A4A" },
  { day: 17, type: "talent",     title: "Your American Idol talent",
    content: "American Idol would not know what hit them. You fill a room — not with noise, but with something warmer. I see it every time.",
    note: "Don't argue with me on this one.", color: "#4A2A1A" },
  { day: 18, type: "movie",      title: "Shaolin Soccer",            movie: "Shaolin Soccer",
    note: "I now associate this movie entirely with you. It's ruined me (in a good way).", color: "#1A2A3A" },
  { day: 19, type: "reflection", title: "Biggest changes I've seen",
    content: "In you: quieter in the best way. More sure of yourself. You laugh easier now.\n\nIn me: more patient. More present. More aware of what actually matters.",
    note: "Thank you for growing alongside me.", color: "#2A4A2A" },
  { day: 20, type: "coupon",     title: "Date of your choice",
    coupons: [
      { id: "20a", title: "Date of Your Choice", desc: "You plan it. I show up. No complaints, no suggestions.", expiry: "Any day" },
    ],
    note: "Your call. Your day.", color: "#4A1A2A" },
  { day: 21, type: "minigame",   title: "Breathing game",            note: "For when the world feels too loud. Made just for you.",       color: "#1A4A2A" },
  { day: 22, type: "ai",         title: "Our future kids",           note: "Totally unscientific. Probably accurate. Definitely adorable.",color: "#3A2A4A" },
  { day: 23, type: "ai",         title: "Growing old together",      note: "Can't wait to be old and annoying with you.",                 color: "#4A3A2A" },
  { day: 24, type: "map",        title: "Our world map",             note: "Every place we've been. Every place we're going.",            color: "#1A3A3A" },
  { day: 25, type: "bucketlist", title: "Things we'll do together",
    items: ["Watch the northern lights","Road trip with no plan","Learn one fancy dish together","Stay in a mountain cabin","Matching somethings (TBD)","Slow morning in a new city","Write letters to our future selves"],
    note: "Not a promise. A direction.", color: "#3A4A2A" },
  { day: 26, type: "story",      title: "A story I never tire of",   note: "This one is just for you. Read it slowly.",                   color: "#4A2A3A" },
  { day: 27, type: "finale",     title: "Everything, all at once",   note: "Happy birthday. I love you more than I know how to say.",     color: "#5C3D10" },
];

const STAMP_NOTES = [
  "the face that started everything",
  "us, just us",
  "treat yourself, no conditions",
  "unlimited, no expiry",
  "peace & one wish",
  "matching cosy forever",
  "snacks for the soul",
  "to record & to hold",
  "a playlist secretly about you",
  "wear it with pride",
  "made by hand, meant for you",
  "baked with love",
  "dinner, wherever you want",
  "the place that's now ours",
  "to protect what you love",
  "for walking everywhere with me",
  "unmatched talent, documented",
  "our movie, forever",
  "growth looks good on both of us",
  "your rules, your day",
  "breathe in, hold, breathe out",
  "the ones we'll love most",
  "still us, just older",
  "the world, plotted in love",
  "a direction, not a deadline",
  "told a hundred times, never tired",
  "happy birthday. I love you. ♡",
];

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500&family=Caveat:wght@500;700&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #18140F; -webkit-tap-highlight-color: transparent; overscroll-behavior: none; }
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-thumb { background: #6B4A3544; border-radius: 4px; }

@keyframes fadeUp     { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
@keyframes popIn      { from { opacity:0; transform:scale(.62); } to { opacity:1; transform:scale(1); } }
@keyframes popInUp    { from { opacity:0; transform:scale(.85) translateY(14px); } to { opacity:1; transform:scale(1) translateY(0); } }
@keyframes slideDown  { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:none; } }
@keyframes pulse      { 0%,100% { transform:scale(1); } 50% { transform:scale(1.06); } }
@keyframes breatheAnim{ 0%,100% { transform:scale(1) rotate(var(--r,0deg)); } 50% { transform:scale(1.035) rotate(calc(var(--r,0deg) + 1deg)); } }
@keyframes spinSlow   { from { transform:rotate(0); } to { transform:rotate(360deg); } }
@keyframes shimmer    { 0%,100% { opacity:.45; } 50% { opacity:1; } }
@keyframes glowAnim   { 0%,100% { filter:drop-shadow(0 0 0px #D4953A00); } 50% { filter:drop-shadow(0 0 12px #D4953A88); } }
@keyframes floatAnim  { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
@keyframes bounce2    { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-5px); } }
@keyframes inkReveal  { from { clip-path:inset(0 100% 0 0); } to { clip-path:inset(0 0 0 0); } }
@keyframes envShake   { 0%,100% { transform:rotate(0) scale(1); } 25% { transform:rotate(-6deg) scale(1.06); } 75% { transform:rotate(5deg) scale(1.08); } }
@keyframes stampFall  { 0% { opacity:1; transform:translate(-50%,-50%) scale(1.4) rotate(-6deg); } 55% { opacity:1; transform:translate(-50%,-50%) scale(1) rotate(2deg); } 80% { opacity:.5; transform:translate(calc(-50vw + 38px),calc(40vh)) scale(.3) rotate(-10deg); } 100% { opacity:0; transform:translate(calc(-50vw + 38px),calc(48vh)) scale(.1); } }
@keyframes confettiFall { 0% { transform:translateY(0) rotate(0); opacity:1; } 100% { transform:translateY(108vh) translateX(var(--dx)) rotate(var(--dr)); opacity:0; } }
@keyframes particleFade { 0% { opacity:.85; transform:scale(1); } 100% { opacity:0; transform:scale(0) translateY(-18px); } }
@keyframes vineGrow { from { width:0; } to { width:var(--pct); } }

.tile-lift { transition: transform .18s, filter .18s; }
.tile-lift:hover { transform: scale(1.04) rotate(.5deg) !important; filter: brightness(1.1); }
`;

// ─── SVG ILLUSTRATIONS ────────────────────────────────────────────────────────
function Illus({ day, w, h, lit }) {
  const c  = lit ? day.color : "#3A2E24";
  const op = lit ? 1 : 0.48;
  const D  = day.day;
  const animStyle = lit
    ? { animation: `breatheAnim ${3 + (D % 5) * 0.4}s ${(D % 7) * 0.15}s infinite ease-in-out`, "--r": `${(D % 7 - 3) * 1.5}deg` }
    : {};

  return (
    <svg
      width={w} height={h} viewBox="0 0 100 100" fill="none"
      style={{ display: "block", ...animStyle }}
    >
      {/* Subtle background tint */}
      <rect width="100" height="100" fill={c} fillOpacity={op * 0.16} rx="12" />

      {/* ── CAMERA days 1, 2, 14 ── */}
      {(D === 1 || D === 2 || D === 14) && <>
        <rect x="8"  y="22" width="84" height="58" rx="8"  fill={c} fillOpacity={op * .85} />
        <rect x="8"  y="34" width="84" height="8"  fill="rgba(0,0,0,.12)" />
        <circle cx="50" cy="54" r="18" fill="none" stroke={P.white} strokeWidth="2"   strokeOpacity={op * .7} />
        <circle cx="50" cy="54" r="10" fill={c}    fillOpacity={op * .5}  stroke={P.white} strokeWidth="1.5" strokeOpacity={op * .4} />
        <circle cx="50" cy="54" r="4"  fill={P.white} fillOpacity={op * .3} />
        <rect x="66" y="22" width="16" height="10" rx="3" fill={P.goldLight} fillOpacity={op * .7} />
        <circle cx="20" cy="29" r="5" fill={P.white} fillOpacity={op * .5} />
        {D === 2  && <rect x="12" y="14" width="55" height="42" rx="4" fill={c} fillOpacity={op * .22} transform="rotate(-5 40 35)" />}
        {D === 14 && <>
          <path d="M20,68 Q35,62 50,68 Q65,74 80,68" stroke={P.white} strokeWidth="1.5" fill="none" strokeOpacity={op * .4} />
          <circle cx="20" cy="65" r="3" fill={P.goldLight} fillOpacity={op * .7} />
          <circle cx="50" cy="72" r="3" fill={P.goldLight} fillOpacity={op * .7} />
          <circle cx="80" cy="65" r="3" fill={P.goldLight} fillOpacity={op * .7} />
        </>}
        <text x="50" y="94" textAnchor="middle" fontSize="11" fill={P.white} fillOpacity={op * .6} fontFamily="'DM Mono',monospace">{String(D).padStart(2, "0")}</text>
      </>}

      {/* ── GIFT BOX physical days 6,7,8,10,11,12,15,16 ── */}
      {[6, 7, 8, 10, 11, 12, 15, 16].includes(D) && <>
        <rect x="16" y="42" width="68" height="48" rx="5" fill={c} fillOpacity={op * .9} />
        <rect x="16" y="28" width="68" height="18" rx="5" fill={c} fillOpacity={op * .75} />
        <line x1="50" y1="28" x2="50" y2="90"   stroke={P.white} strokeWidth="3"   strokeOpacity={op * .35} />
        <line x1="16" y1="47" x2="84" y2="47"   stroke={P.white} strokeWidth="2"   strokeOpacity={op * .22} />
        {/* Bow */}
        <path d={`M50,28 Q${36+(D%5)*2},${13+(D%4)*2} ${28+(D%4)*3},${19+(D%3)} Q40,23 50,28`} fill={P.goldLight} fillOpacity={op * .65} />
        <path d={`M50,28 Q${64-(D%5)*2},${13+(D%4)*2} ${72-(D%4)*3},${19+(D%3)} Q60,23 50,28`} fill={P.goldLight} fillOpacity={op * .65} />
        <circle cx="50" cy="28" r="5" fill={P.goldLight} fillOpacity={op * .85} />
        <rect x="16" y="28" width="12" height="62" rx="3" fill="rgba(255,255,255,.05)" />
        <text x="50" y="97" textAnchor="middle" fontSize="11" fill={P.white} fillOpacity={op * .55} fontFamily="'DM Mono',monospace">{String(D).padStart(2, "0")}</text>
      </>}

      {/* ── TICKET coupon days 4,5,13,20 ── */}
      {[4, 5, 13, 20].includes(D) && <>
        <path d="M8,26 H92 Q95,26 95,30 V40 Q87,40 87,50 Q87,60 95,60 V72 Q95,76 92,76 H8 Q5,76 5,72 V60 Q13,60 13,50 Q13,40 5,40 V30 Q5,26 8,26Z" fill={c} fillOpacity={op * .85} />
        <line x1="24" y1="26" x2="24" y2="76" stroke={P.white} strokeWidth="1" strokeOpacity={op * .3} strokeDasharray="3,3" />
        <rect x="32" y="37" width="44" height="4" rx="2"   fill={P.white} fillOpacity={op * .55} />
        <rect x="32" y="47" width="32" height="3" rx="1.5" fill={P.white} fillOpacity={op * .38} />
        <rect x="32" y="56" width="38" height="3" rx="1.5" fill={P.white} fillOpacity={op * .28} />
        <text x="15" y="54" textAnchor="middle" fontSize="10" fill={P.white} fillOpacity={op * .5}>✂</text>
        <text x="50" y="92" textAnchor="middle" fontSize="11" fill={P.white} fillOpacity={op * .55} fontFamily="'DM Mono',monospace">{String(D).padStart(2, "0")}</text>
      </>}

      {/* ── GIFT CARD day 3 ── */}
      {D === 3 && <>
        <rect x="8" y="26" width="84" height="52" rx="8" fill={c} fillOpacity={op * .9} />
        <rect x="8" y="36" width="84" height="8"  fill="rgba(255,255,255,.07)" />
        <rect x="14" y="50" width="34" height="5" rx="2.5" fill={P.white} fillOpacity={op * .5} />
        <rect x="14" y="60" width="22" height="4" rx="2"   fill={P.white} fillOpacity={op * .32} />
        <circle cx="72" cy="55" r="12" fill={P.goldLight} fillOpacity={op * .6} />
        <text x="72" y="59" textAnchor="middle" fontSize="10" fill={c} fillOpacity={op * .95} fontFamily="'DM Mono',monospace">$</text>
        <text x="50" y="93" textAnchor="middle" fontSize="11" fill={P.white} fillOpacity={op * .55} fontFamily="'DM Mono',monospace">03</text>
      </>}

      {/* ── VINYL day 9 ── */}
      {D === 9 && <>
        <circle cx="50" cy="50" r="42" fill={c} fillOpacity={op * .9} />
        <circle cx="50" cy="50" r="30" fill={P.ink} fillOpacity={op * .72} />
        <circle cx="50" cy="50" r="18" fill={c}    fillOpacity={op * .55} />
        {[12, 16, 20, 24, 28, 32].map(r => (
          <circle key={r} cx="50" cy="50" r={r} fill="none" stroke={P.white} strokeWidth=".6" strokeOpacity={op * .1} />
        ))}
        <circle cx="50" cy="50" r="10" fill={P.white} fillOpacity={op * .85} />
        <circle cx="50" cy="50" r="3.5" fill={c} fillOpacity={op} />
        <text x="50" y="96" textAnchor="middle" fontSize="11" fill={P.white} fillOpacity={op * .55} fontFamily="'DM Mono',monospace">09</text>
      </>}

      {/* ── FILM STRIP day 18 ── */}
      {D === 18 && <>
        <rect x="4" y="20" width="92" height="60" rx="6" fill={c} fillOpacity={op * .85} />
        {[10, 22, 34, 46, 58, 70, 82].map(x => (
          <g key={x}>
            <rect x={x} y="22" width="8" height="8" rx="1.5" fill={P.white} fillOpacity={op * .4} />
            <rect x={x} y="70" width="8" height="8" rx="1.5" fill={P.white} fillOpacity={op * .4} />
          </g>
        ))}
        <rect x="18" y="35" width="64" height="28" rx="3" fill={P.white} fillOpacity={op * .12} stroke={P.white} strokeWidth=".8" strokeOpacity={op * .3} />
        <polygon points="42,40 42,58 64,49" fill={P.goldLight} fillOpacity={op * .7} />
        <text x="50" y="96" textAnchor="middle" fontSize="11" fill={P.white} fillOpacity={op * .55} fontFamily="'DM Mono',monospace">18</text>
      </>}

      {/* ── MICROPHONE day 17 ── */}
      {D === 17 && <>
        <rect x="35" y="8" width="30" height="46" rx="15" fill={c} fillOpacity={op * .9} />
        {[18, 26, 34, 42].map(y => (
          <line key={y} x1="37" y1={y} x2="63" y2={y} stroke={P.white} strokeWidth="1" strokeOpacity={op * .28} />
        ))}
        <path d="M22,54 Q22,74 50,74 Q78,74 78,54" stroke={c} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeOpacity={op * .85} />
        <line x1="50" y1="74" x2="50" y2="86" stroke={c} strokeWidth="3.5" strokeLinecap="round" strokeOpacity={op * .85} />
        <line x1="34" y1="86" x2="66" y2="86" stroke={c} strokeWidth="3.5" strokeLinecap="round" strokeOpacity={op * .85} />
        <text x="50" y="98" textAnchor="middle" fontSize="11" fill={P.white} fillOpacity={op * .55} fontFamily="'DM Mono',monospace">17</text>
      </>}

      {/* ── FROG day 21 ── */}
      {D === 21 && <>
        <ellipse cx="50" cy="62" rx="28" ry="22" fill={c} fillOpacity={op * .9} />
        <ellipse cx="50" cy="44" rx="24" ry="20" fill={c} fillOpacity={op * .9} />
        <circle cx="34" cy="30" r="10"  fill={c}    fillOpacity={op} />
        <circle cx="66" cy="30" r="10"  fill={c}    fillOpacity={op} />
        <circle cx="34" cy="30" r="6.5" fill={P.white} fillOpacity={op * .9} />
        <circle cx="66" cy="30" r="6.5" fill={P.white} fillOpacity={op * .9} />
        <circle cx="35" cy="29" r="3"   fill={P.ink}   fillOpacity={op} />
        <circle cx="67" cy="29" r="3"   fill={P.ink}   fillOpacity={op} />
        <circle cx="36" cy="28" r="1.2" fill={P.white} fillOpacity={op * .7} />
        <circle cx="68" cy="28" r="1.2" fill={P.white} fillOpacity={op * .7} />
        <path d="M38,52 Q50,62 62,52" stroke={P.white} strokeWidth="2" fill="none" strokeLinecap="round" strokeOpacity={op * .75} />
        <ellipse cx="36" cy="56" rx="5" ry="3" fill={P.blush} fillOpacity={op * .3} />
        <ellipse cx="64" cy="56" rx="5" ry="3" fill={P.blush} fillOpacity={op * .3} />
      </>}

      {/* ── COMPASS day 24 ── */}
      {D === 24 && <>
        <circle cx="50" cy="50" r="40" fill={c} fillOpacity={op * .7} stroke={c} strokeWidth="2.5" />
        <circle cx="50" cy="50" r="28" fill="none" stroke={P.white} strokeWidth=".8" strokeOpacity={op * .22} />
        {[["N",50,18],["S",50,86],["E",84,53],["W",16,53]].map(([l,x,y]) => (
          <text key={l} x={x} y={y} textAnchor="middle" fontSize="10" fill={P.white} fillOpacity={op * .6} fontFamily="'DM Mono',monospace">{l}</text>
        ))}
        <polygon points="50,26 45,50 50,56 55,50" fill={c}           fillOpacity={op * .95} stroke={P.white} strokeWidth=".8" strokeOpacity={op * .35} />
        <polygon points="50,74 45,50 50,56 55,50" fill={P.goldLight} fillOpacity={op * .75} />
        <circle cx="50" cy="50" r="4.5" fill={P.white} fillOpacity={op * .85} />
      </>}

      {/* ── CAKE day 27 ── */}
      {D === 27 && <>
        <ellipse cx="50" cy="82" rx="36" ry="7" fill={c} fillOpacity={op * .35} />
        <rect x="14" y="60" width="72" height="22" rx="6" fill={c} fillOpacity={op * .9} />
        <rect x="22" y="42" width="56" height="20" rx="5" fill={c} fillOpacity={op * .82} />
        <rect x="30" y="28" width="40" height="16" rx="4" fill={c} fillOpacity={op * .72} />
        <path d="M14,60 Q22,54 30,60 Q38,54 46,60 Q54,54 62,60 Q70,54 78,60 Q84,54 86,60" stroke={P.white} strokeWidth="3"   fill="none" strokeOpacity={op * .65} />
        <path d="M22,42 Q30,36 38,42 Q46,36 54,42 Q62,36 70,42 Q76,36 78,42"               stroke={P.white} strokeWidth="2.5" fill="none" strokeOpacity={op * .55} />
        {[36, 50, 64].map(x => (
          <g key={x}>
            <rect   x={x-2} y={15} width="4" height="13" fill={P.goldLight} fillOpacity={op * .9} />
            <ellipse cx={x}  cy={15} rx="3"  ry="5"       fill={P.goldLight} fillOpacity={op * .65} />
          </g>
        ))}
        <text x="50" y="98" textAnchor="middle" fontSize="11" fill={P.white} fillOpacity={op * .6} fontFamily="'DM Mono',monospace">27</text>
      </>}

      {/* ── LEAF day 19 ── */}
      {D === 19 && <>
        <path d="M50,90 Q50,66 50,50" stroke={c} strokeWidth="3" strokeLinecap="round" strokeOpacity={op * .9} />
        <path d="M50,50 Q20,32 24,8 Q50,22 62,42 Q74,60 50,50Z" fill={c} fillOpacity={op * .88} />
        <path d="M50,50 Q36,30 28,12" stroke={P.white} strokeWidth="1.5" strokeOpacity={op * .4} />
        <path d="M44,42 Q34,36 28,26" stroke={P.white} strokeWidth="1"   strokeOpacity={op * .3} />
        <path d="M56,38 Q62,32 64,22" stroke={P.white} strokeWidth="1"   strokeOpacity={op * .3} />
        <path d="M50,68 Q62,56 72,60 Q66,74 50,68Z" fill={c} fillOpacity={op * .65} />
        <text x="50" y="97" textAnchor="middle" fontSize="11" fill={P.white} fillOpacity={op * .55} fontFamily="'DM Mono',monospace">19</text>
      </>}

      {/* ── BOOK day 26 ── */}
      {D === 26 && <>
        <path d="M14,14 Q50,8 86,14 L86,82 Q50,88 14,82Z" fill={c} fillOpacity={op * .85} />
        <path d="M14,14 L14,82" stroke={P.white} strokeWidth="5" strokeOpacity={op * .55} />
        {[28, 38, 48, 58, 68].map(y => (
          <line key={y} x1="22" y1={y} x2="82" y2={y - 1.5} stroke={P.white} strokeWidth="1.2" strokeOpacity={op * .28} />
        ))}
        <path d="M70,14 L70,36 L64,30 L58,36 L58,14Z" fill={P.goldLight} fillOpacity={op * .72} />
        <text x="50" y="97" textAnchor="middle" fontSize="11" fill={P.white} fillOpacity={op * .55} fontFamily="'DM Mono',monospace">26</text>
      </>}

      {/* ── HOURGLASS day 23 ── */}
      {D === 23 && <>
        <rect x="26" y="10" width="48" height="8" rx="4" fill={c} fillOpacity={op * .82} />
        <rect x="26" y="82" width="48" height="8" rx="4" fill={c} fillOpacity={op * .82} />
        <path d="M28,18 L50,50 L72,18Z"  fill={c}           fillOpacity={op * .52} stroke={c} strokeWidth="1.5" />
        <path d="M28,82 L50,50 L72,82Z"  fill={c}           fillOpacity={op * .82} />
        <path d="M34,76 L50,50 L66,76Z"  fill={P.goldLight} fillOpacity={op * .52} />
        <line x1="28" y1="18" x2="28" y2="82" stroke={c} strokeWidth="3" strokeOpacity={op * .72} />
        <line x1="72" y1="18" x2="72" y2="82" stroke={c} strokeWidth="3" strokeOpacity={op * .72} />
        <text x="50" y="98" textAnchor="middle" fontSize="11" fill={P.white} fillOpacity={op * .55} fontFamily="'DM Mono',monospace">23</text>
      </>}

      {/* ── ONESIE day 22 ── */}
      {D === 22 && <>
        <path d="M32,38 L20,32 L22,50 L22,80 H78 L78,50 L80,32 L68,38 Q62,26 50,26 Q38,26 32,38Z" fill={c} fillOpacity={op * .85} />
        <path d="M36,38 Q50,46 64,38 Q58,28 50,28 Q42,28 36,38Z" fill={P.white} fillOpacity={op * .22} />
        {[40, 50, 60].map(x => <circle key={x} cx={x} cy="78" r="3" fill={P.white} fillOpacity={op * .45} />)}
        <text x="50" y="54" textAnchor="middle" fontSize="16" fill={P.white} fillOpacity={op * .35}>✦</text>
        <text x="50" y="96" textAnchor="middle" fontSize="11" fill={P.white} fillOpacity={op * .55} fontFamily="'DM Mono',monospace">22</text>
      </>}

      {/* ── BUCKET LIST / MAP day 25 ── */}
      {D === 25 && <>
        <circle cx="50" cy="50" r="40" fill={c} fillOpacity={op * .7} stroke={c} strokeWidth="2" />
        {[["N",50,18],["S",50,84],["E",83,53],["W",17,53]].map(([l,x,y]) => (
          <text key={l} x={x} y={y} textAnchor="middle" fontSize="9" fill={P.white} fillOpacity={op * .55} fontFamily="'DM Mono',monospace">{l}</text>
        ))}
        <line x1="50" y1="50" x2="62" y2="28" stroke={P.goldLight} strokeWidth="3"   strokeLinecap="round" strokeOpacity={op * .8} />
        <line x1="50" y1="50" x2="72" y2="54" stroke={P.white}     strokeWidth="2"   strokeLinecap="round" strokeOpacity={op * .5} />
        <circle cx="50" cy="50" r="4" fill={P.white} fillOpacity={op * .85} />
        <text x="50" y="97" textAnchor="middle" fontSize="11" fill={P.white} fillOpacity={op * .55} fontFamily="'DM Mono',monospace">25</text>
      </>}

      {/* ── Fallback for talent/reflection/story/ai/map/playlist/minigame/finale if not matched above ── */}
      {![1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27].includes(D) && (
        <text x="50" y="55" textAnchor="middle" fontSize="22" fill={P.white} fillOpacity={op * .7} fontFamily="'DM Mono',monospace">{String(D).padStart(2, "0")}</text>
      )}
    </svg>
  );
}

// ─── COUNTDOWN COMPONENT ──────────────────────────────────────────────────────
function Countdown() {
  const [t, setT] = useState({});
  useEffect(() => {
    const tick = () => {
      const ms = BIRTHDAY - new Date();
      if (ms <= 0) { setT({ done: true }); return; }
      setT({ d: Math.floor(ms / 86400000), h: Math.floor((ms % 86400000) / 3600000), m: Math.floor((ms % 3600000) / 60000), s: Math.floor((ms % 60000) / 1000) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (t.done) return <p style={{ fontFamily: "'Caveat',cursive", fontSize: 24, color: P.gold, textAlign: "center" }}>🎂 It's your birthday!!</p>;
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
      {[["d", t.d, "DAYS"], ["h", t.h, "HRS"], ["m", t.m, "MIN"], ["s", t.s, "SEC"]].map(([k, v, l]) => (
        <div key={k} style={{ textAlign: "center", background: `${P.brown}CC`, borderRadius: 9, padding: "7px 11px", minWidth: 50, backdropFilter: "blur(8px)", border: `1px solid ${P.blush}33` }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: P.white, fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>{String(v ?? "--").padStart(2, "0")}</div>
          <div style={{ fontSize: 8, color: P.blush, fontFamily: "'DM Mono',monospace", letterSpacing: 1.5, marginTop: 2 }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

// ─── VINE PROGRESS BAR ────────────────────────────────────────────────────────
function VineProgress({ count, total }) {
  const pct = count / total;
  return (
    <div style={{ maxWidth: 380, margin: "10px auto 0", padding: "0 16px", position: "relative", zIndex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14 }}>🌿</span>
        <div style={{ flex: 1, height: 6, background: `${P.brownMid}33`, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 3, background: `linear-gradient(90deg,${P.olive},${P.gold})`, width: `${pct * 100}%`, transition: "width .9s cubic-bezier(.4,0,.2,1)" }} />
        </div>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: P.muted }}>{count}/{total}</span>
      </div>
    </div>
  );
}

// ─── PARTICLE TRAIL ───────────────────────────────────────────────────────────
function ParticleTrail({ active, clientX, clientY }) {
  const [particles, setParticles] = useState([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!active) { setParticles([]); return; }
    intervalRef.current = setInterval(() => {
      setParticles(prev => [
        ...prev.slice(-14),
        {
          id: Date.now() + Math.random(),
          x: clientX + (Math.random() - 0.5) * 18,
          y: clientY + (Math.random() - 0.5) * 18,
          color: [P.gold, P.blush, P.brownLight, P.goldLight][Math.floor(Math.random() * 4)],
        },
      ]);
    }, 32);
    return () => clearInterval(intervalRef.current);
  }, [active, clientX, clientY]);

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9000 }}>
      {particles.map(p => (
        <div key={p.id} style={{ position: "absolute", left: p.x, top: p.y, width: 5, height: 5, borderRadius: "50%", background: p.color, animation: "particleFade .6s forwards" }} />
      ))}
    </div>
  );
}

// ─── CONFETTI ─────────────────────────────────────────────────────────────────
function Confetti({ active }) {
  const pieces = useMemo(() => Array.from({ length: 65 }, (_, i) => ({
    x: 12 + Math.random() * 76,
    color: [P.gold, P.brownLight, P.olive, P.blush, P.goldLight, "#7AA85A"][i % 6],
    sz: 5 + Math.random() * 8,
    del: Math.random() * .85,
    dur: 1.4 + Math.random() * 1.3,
    dx: (Math.random() - .5) * 110,
    dr: Math.random() * 650 - 325,
    round: i % 3 === 0,
  })), []);
  if (!active) return null;
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999, overflow: "hidden" }}>
      {pieces.map((p, i) => (
        <div key={i} style={{ position: "absolute", top: -12, left: `${p.x}%`, width: p.sz, height: p.round ? p.sz : p.sz * .5, background: p.color, borderRadius: p.round ? "50%" : "2px", animation: `confettiFall ${p.dur}s ${p.del}s ease-in both`, "--dx": `${p.dx}px`, "--dr": `${p.dr}deg` }} />
      ))}
    </div>
  );
}

// ─── INK BACKGROUND ───────────────────────────────────────────────────────────
function InkBg() {
  const items = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    x: Math.random() * 94, y: Math.random() * 94,
    s: .35 + Math.random() * .6,
    rot: Math.random() * 360,
    dur: 12 + Math.random() * 8,
    del: Math.random() * 7,
    op: .018 + Math.random() * .022,
    d: ["M10,20Q30,5 50,20Q70,35 90,20", "M5,15L45,15L40,5L10,5Z", "M20,5Q40,5 40,20Q40,35 20,35Q0,35 0,20Q0,5 20,5"][i % 3],
  })), []);
  const flies = useMemo(() => Array.from({ length: 9 }, () => ({ x: Math.random() * 100, y: Math.random() * 100, s: 1.4 + Math.random() * 2.2, dur: 3 + Math.random() * 4, del: Math.random() * 6 })), []);
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      {items.map((it, i) => (
        <svg key={i} viewBox="0 0 90 40" style={{ position: "absolute", left: `${it.x}%`, top: `${it.y}%`, width: 90 * it.s, height: 40 * it.s, opacity: it.op, transform: `rotate(${it.rot}deg)`, animation: `floatAnim ${it.dur}s ${it.del}s infinite ease-in-out` }}>
          <path d={it.d} stroke={P.blush} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      ))}
      {flies.map((ff, i) => (
        <div key={i} style={{ position: "absolute", left: `${ff.x}%`, top: `${ff.y}%`, width: ff.s, height: ff.s, borderRadius: "50%", background: P.goldLight, animation: `shimmer ${ff.dur}s ${ff.del}s infinite`, opacity: .25 }} />
      ))}
    </div>
  );
}

// ─── STAMP POPUP ──────────────────────────────────────────────────────────────
function StampPopup({ day, onClose }) {
  const note = STAMP_NOTES[day.day - 1];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6,4,2,.88)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(14px)" }} onClick={onClose}>
      <div style={{ animation: "popIn .42s cubic-bezier(.34,1.56,.64,1)" }} onClick={e => e.stopPropagation()}>
        {/* Perforated stamp border */}
        <div style={{
          background: P.paper, maxWidth: 290, width: "88vw",
          boxShadow: "0 24px 80px rgba(0,0,0,.75)",
          backgroundImage: `radial-gradient(circle at 0 50%,#18140F 7px,transparent 7px),radial-gradient(circle at 100% 50%,#18140F 7px,transparent 7px),radial-gradient(circle at 50% 0,#18140F 7px,transparent 7px),radial-gradient(circle at 50% 100%,#18140F 7px,transparent 7px)`,
          backgroundSize: "14px 14px",
          backgroundRepeat: "repeat-y,repeat-y,repeat-x,repeat-x",
          backgroundPosition: "0 50%,100% 50%,50% 0,50% 100%",
          padding: "26px 22px 20px", position: "relative",
        }}>
          {/* Postmark */}
          <div style={{ position: "absolute", top: 8, right: 10, opacity: .15 }}>
            <svg width="44" height="44" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="18" fill="none" stroke={P.brown} strokeWidth="1.5" />
              <line x1="6" y1="22" x2="38" y2="22" stroke={P.brown} strokeWidth="1.2" />
              <line x1="6" y1="18" x2="38" y2="18" stroke={P.brown} strokeWidth=".8" />
              <line x1="6" y1="26" x2="38" y2="26" stroke={P.brown} strokeWidth=".8" />
              <text x="22" y="37" textAnchor="middle" fontSize="5" fill={P.brown} fontFamily="'DM Mono',monospace">JULY 2026</text>
            </svg>
          </div>
          {/* Photo area */}
          <div style={{ width: "100%", aspectRatio: "3/2", background: `linear-gradient(135deg,${day.color}44,${day.color}22)`, borderRadius: 4, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", border: `1px solid ${P.blush}33`, position: "relative", overflow: "hidden" }}>
            <Illus day={day} w={72} h={72} lit={true} />
            <span style={{ position: "absolute", bottom: 4, fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: `${P.brownMid}55` }}>/images/stamp-{String(day.day).padStart(2, "0")}.jpg</span>
          </div>
          {/* Header row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div style={{ flex: 1, paddingRight: 10 }}>
              <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: P.muted, letterSpacing: 1.8, marginBottom: 3 }}>JULY {String(day.day).padStart(2, "0")} · 2026</p>
              <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: 14, color: P.brown, lineHeight: 1.3 }}>{day.title}</p>
            </div>
            <div style={{ background: day.color, borderRadius: 4, padding: "5px 8px", textAlign: "center", minWidth: 44 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: P.white }}>✦</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: `${P.white}77`, letterSpacing: .8, marginTop: 1 }}>STAMP</div>
            </div>
          </div>
          <p style={{ fontFamily: "'Caveat',cursive", fontSize: 14, color: P.brownMid, lineHeight: 1.8, borderTop: `1px dashed ${P.blush}55`, paddingTop: 10, marginBottom: 14 }}>{note}</p>
          <button style={{ width: "100%", background: P.brown, color: P.white, border: "none", borderRadius: 7, padding: "9px 0", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }} onClick={onClose}>
            collect stamp →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── STAMP FALL ANIMATION ─────────────────────────────────────────────────────
function StampFall({ day, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2200); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9990 }}>
      <div style={{ position: "absolute", left: "50%", top: "40%", animation: "stampFall 2.2s ease-in forwards" }}>
        <Illus day={day} w={58} h={58} lit={true} />
      </div>
    </div>
  );
}

// ─── COUPON CARD ──────────────────────────────────────────────────────────────
function CouponCard({ coupon, color }) {
  const bars = useMemo(() => Array.from({ length: 36 }, () => ({ w: 1 + Math.random() * 2, gap: 1 + Math.random() * 1.5 })), []);
  return (
    <div style={{ background: `linear-gradient(105deg,${P.white} 60%,${P.cream})`, borderRadius: 10, overflow: "hidden", border: `1px solid ${P.blush}66`, boxShadow: "0 2px 12px rgba(0,0,0,.18)" }}>
      {/* Top band */}
      <div style={{ background: `linear-gradient(90deg,${color},${color}CC)`, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: "rgba(255,255,255,.6)", letterSpacing: 2, marginBottom: 2 }}>COUPON</p>
          <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: 15, color: P.white, lineHeight: 1.2 }}>{coupon.title}</p>
        </div>
        <div style={{ background: "rgba(255,255,255,.15)", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎟️</div>
      </div>
      {/* Body */}
      <div style={{ padding: "10px 14px 6px" }}>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: P.brown, lineHeight: 1.6, marginBottom: 8 }}>{coupon.desc}</p>
        <div style={{ display: "flex", gap: 12, marginBottom: 6 }}>
          <div style={{ flex: 1, borderTop: `1px dashed ${P.blush}88`, paddingTop: 6 }}>
            <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: P.muted, letterSpacing: 1.5, marginBottom: 2 }}>VALID FOR</p>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: P.brown }}>Bearer only ♡</p>
          </div>
          <div style={{ flex: 1, borderTop: `1px dashed ${P.blush}88`, paddingTop: 6 }}>
            <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: P.muted, letterSpacing: 1.5, marginBottom: 2 }}>EXPIRES</p>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: P.brown }}>{coupon.expiry}</p>
          </div>
        </div>
      </div>
      {/* Tear line + barcode */}
      <div style={{ borderTop: `1px dashed ${P.blush}66`, padding: "6px 14px 8px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", height: 26, overflow: "hidden" }}>
          {bars.map((b, i) => (
            <div key={i} style={{ width: b.w, marginRight: b.gap, height: `${40 + Math.sin(i) * 60}%`, background: P.brown, opacity: .65, flexShrink: 0 }} />
          ))}
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: P.muted, letterSpacing: .5, marginBottom: 1 }}>{coupon.id}-2026-LOVE</p>
          <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: `${P.muted}88` }}>NON-TRANSFERABLE</p>
        </div>
      </div>
    </div>
  );
}

// ─── SCRATCH REVEAL WRAPPER ───────────────────────────────────────────────────
function ScratchReveal({ children, index, onReveal }) {
  const cvRef = useRef(null);
  const drawing = useRef(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const c = cvRef.current;
    if (!c || done) return;
    const ctx = c.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, c.width, c.height);
    g.addColorStop(0, "#7B5A3A"); g.addColorStop(1, "#5A3A20");
    ctx.fillStyle = g; ctx.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < 1000; i++) { ctx.fillStyle = `rgba(0,0,0,${Math.random() * .1})`; ctx.fillRect(Math.random() * c.width, Math.random() * c.height, Math.random() * 3, 1); }
    ctx.fillStyle = "rgba(255,230,160,.72)"; ctx.font = "bold 11px 'DM Mono',monospace"; ctx.textAlign = "center";
    ctx.fillText("✦  SCRATCH TO REVEAL  ✦", c.width / 2, c.height / 2 - 5);
    ctx.font = "9px 'DM Mono',monospace"; ctx.fillStyle = "rgba(255,210,120,.5)";
    ctx.fillText(`COUPON ${index + 1} — rub to open`, c.width / 2, c.height / 2 + 14);
  }, [done, index]);

  const scratch = (cx, cy) => {
    const c = cvRef.current;
    if (!c || done) return;
    const r = c.getBoundingClientRect();
    const sx = (cx - r.left) * (c.width / r.width);
    const sy = (cy - r.top)  * (c.height / r.height);
    const ctx = c.getContext("2d");
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath(); ctx.arc(sx, sy, 28, 0, Math.PI * 2); ctx.fill();
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    const pct = Array.from({ length: d.length / 4 }, (_, i) => d[i * 4 + 3] === 0).filter(Boolean).length / (d.length / 4);
    if (pct > .52) { setDone(true); onReveal?.(); }
  };

  const getPos = (e, isTouch) => isTouch ? [e.touches[0].clientX, e.touches[0].clientY] : [e.clientX, e.clientY];

  return (
    <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", marginBottom: 12 }}>
      {children}
      {!done && (
        <canvas ref={cvRef} width={316} height={130}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", borderRadius: 10, cursor: "crosshair", touchAction: "none" }}
          onMouseDown={() => drawing.current = true}
          onMouseUp={() => drawing.current = false}
          onMouseMove={e => { if (drawing.current) { const [x, y] = getPos(e, false); scratch(x, y); } }}
          onTouchStart={e => { drawing.current = true; const [x, y] = getPos(e, true); scratch(x, y); }}
          onTouchEnd={() => drawing.current = false}
          onTouchMove={e => { e.preventDefault(); const [x, y] = getPos(e, true); scratch(x, y); }}
        />
      )}
    </div>
  );
}

// ─── COUPON SET ───────────────────────────────────────────────────────────────
function CouponSet({ coupons, color }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {coupons.map((c, i) => (
        <ScratchReveal key={c.id} index={i}>
          <CouponCard coupon={c} color={color} />
        </ScratchReveal>
      ))}
    </div>
  );
}

// ─── BREATHING GAME ───────────────────────────────────────────────────────────
function BreathingGame() {
  const [ph, setPh]   = useState("idle");
  const [ct, setCt]   = useState(0);
  const [rn, setRn]   = useState(0);
  const tmr = useRef(null);

  useEffect(() => {
    if (ph === "idle" || ph === "done") return;
    if (ct > 0) { tmr.current = setTimeout(() => setCt(c => c - 1), 1000); return; }
    if (ph === "in")   { setPh("hold"); setCt(7); }
    else if (ph === "hold") { setPh("out");  setCt(8); }
    else { const r = rn + 1; setRn(r); if (r >= 3) setPh("done"); else { setPh("in"); setCt(4); } }
    return () => clearTimeout(tmr.current);
  }, [ph, ct, rn]);

  const sc = (ph === "in" || ph === "hold") ? 1.65 : 1;
  const msgs = { idle: "tap froggy to begin", in: "breathe in…", hold: "hold…", out: "breathe out…", done: "well done 🤍" };
  return (
    <div style={{ textAlign: "center", padding: "6px 0" }}>
      <div onClick={() => { if (ph === "idle") { setPh("in"); setCt(4); } }}
        style={{ width: 110, height: 110, borderRadius: "50%", margin: "0 auto 14px", background: P.olive, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52, cursor: ph === "idle" ? "pointer" : "default", transition: "transform 1.3s cubic-bezier(.4,0,.2,1), box-shadow 1.3s", transform: `scale(${sc})`, boxShadow: `0 0 ${sc * 26}px ${sc * 7}px rgba(58,74,44,.4)` }}>🐸</div>
      <p style={{ fontFamily: "'Caveat',cursive", fontSize: 21, color: P.white, marginBottom: 3 }}>{msgs[ph]}</p>
      {ph !== "idle" && ph !== "done" && <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 32, color: P.goldLight, animation: "shimmer 1s infinite" }}>{ct}</p>}
      {ph === "done" && <>
        <p style={{ fontFamily: "'Caveat',cursive", fontSize: 14, color: P.blush, lineHeight: 1.9, marginTop: 7 }}>You are safe. You are loved. Things are okay. 🌿</p>
        <button style={{ ...BTN, marginTop: 12 }} onClick={() => { setPh("idle"); setRn(0); }}>go again</button>
      </>}
    </div>
  );
}

// ─── WORLD MAP ────────────────────────────────────────────────────────────────
function WorldMapView() {
  const places = [
    { n: "Singapore", x: 71.5, y: 62, s: "been" }, { n: "Japan",    x: 78,   y: 40, s: "been" },
    { n: "UK",        x: 44,   y: 27, s: "been" }, { n: "Thailand", x: 69,   y: 54, s: "been" },
    { n: "Bali",      x: 72,   y: 67, s: "soon" }, { n: "NZ",       x: 83,   y: 79, s: "dream" },
    { n: "Iceland",   x: 38,   y: 18, s: "dream" }, { n: "Italy",   x: 50,   y: 33, s: "soon" },
    { n: "Canada",    x: 21,   y: 24, s: "dream" }, { n: "Morocco", x: 45,   y: 44, s: "soon" },
  ];
  const [hv, setHv] = useState(null);
  const col = { been: P.gold, soon: P.olive, dream: P.blush };
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ position: "relative", background: `${P.navy}CC`, borderRadius: 12, height: 178, border: `1px solid ${P.blush}18`, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: .06, background: `repeating-linear-gradient(0deg,transparent,transparent 18px,${P.blush} 18px,${P.blush} 19px),repeating-linear-gradient(90deg,transparent,transparent 18px,${P.blush} 18px,${P.blush} 19px)` }} />
        {places.map((p, i) => (
          <div key={i} onMouseEnter={() => setHv(p.n)} onMouseLeave={() => setHv(null)} title={p.n}
            style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, width: p.s === "been" ? 12 : 8, height: p.s === "been" ? 12 : 8, borderRadius: "50%", background: col[p.s], transform: "translate(-50%,-50%)", border: `2px solid ${P.paper}`, animation: `pulse ${1.5 + i * .1}s infinite`, cursor: "pointer", boxShadow: hv === p.n ? `0 0 10px 4px ${col[p.s]}88` : "none", transition: "box-shadow .2s" }} />
        ))}
        {hv && <div style={{ position: "absolute", top: 7, left: 7, background: `${P.dark}CC`, borderRadius: 5, padding: "2px 7px", fontFamily: "'DM Mono',monospace", fontSize: 9, color: P.white }}>{hv}</div>}
        <div style={{ position: "absolute", bottom: 7, right: 7, display: "flex", gap: 7 }}>
          {[["been", "been"], ["soon", "soon"], ["dream", "dream"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: col[k] }} />
              <span style={{ fontSize: 8, color: P.blush, fontFamily: "'DM Mono',monospace" }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SCRAPBOOK FINALE ─────────────────────────────────────────────────────────
const SCRAPBOOK_DATA = [
  { layout: "single-l", date: "March 2024",     title: "The beginning",                   note: "I didn't know then. But I think I did.",                         rot: -2.5 },
  { layout: "trio",     dates: ["April 2024", "May 2024", "June 2024"],                    titles: ["First laugh", "First awkward silence", "First sunrise"],      notes: ["I kept replaying it for days.", "We filled it anyway.", "We stayed up. No regrets."], rots: [-2, 1.5, -1.2] },
  { layout: "note-r",   date: "August 2024",    title: "That ordinary Tuesday",            note: "Nothing happened. Everything was good.",                         rot: 2.2, longNote: "There's a specific afternoon light. You were just there, doing nothing important. I kept thinking: this is exactly where I want to be." },
  { layout: "single-r", date: "September 2024", title: "Autumn walks",                    note: "Too much coffee. The right amount of us.",                       rot: -1.8 },
  { layout: "trio",     dates: ["October 2024", "November 2024", "December 2024"],         titles: ["Movie night", "The argument", "First Christmas"],             notes: ["Shaolin Soccer, obviously.", "We got through it.", "You pretended not to be excited."], rots: [1.5, -2.2, 1.8] },
  { layout: "note-l",   date: "February 2025",  title: "Valentine's",                     note: "You said it didn't matter. It did.",                             rot: -2,   longNote: "You are very bad at pretending you don't care. I find it the most endearing thing about you." },
  { layout: "pair",     dates: ["May 2025", "July 2025"],                                  titles: ["That trip", "Coming home"],                                  notes: ["Somewhere new. Still felt like home.", "The best part was still you."], rots: [-1.5, 2.5] },
  { layout: "single-l", date: "September 2025", title: "When you didn't know I was looking", note: "That's my favourite version of you.",                          rot: 1.8 },
  { layout: "note-r",   date: "December 2025",  title: "New Year's Eve",                  note: "I thought: I want more of this.",                                rot: -1.5, longNote: "I made a wish at midnight. It wasn't creative — I just wished for more of exactly this." },
  { layout: "single-r", date: "July 2026",      title: "Today. Happy birthday.",          note: "Every day I'm grateful it's you. ♡",                            rot: 2,    isFinal: true },
];

function PhotoCard({ date, title, note, rot, w = "100%", placeholder = "memory", isFinal = false }) {
  return (
    <div style={{ transform: `rotate(${rot || 0}deg)`, position: "relative", width: w }}>
      {/* Tape */}
      <div style={{ position: "absolute", top: -9, left: "50%", transform: "translateX(-50%)", width: 38, height: 12, background: "rgba(220,200,155,.28)", borderRadius: 2, zIndex: 2 }} />
      {/* Photo */}
      <div style={{ background: isFinal ? `linear-gradient(135deg,${P.gold}44,${P.brownMid}33)` : `linear-gradient(135deg,${P.brownMid}28,${P.navy}38)`, aspectRatio: "4/3", width: "100%", border: `1px solid ${P.blush}18`, borderRadius: "2px 2px 0 0", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ textAlign: "center", padding: 8 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: `${P.blush}55`, letterSpacing: 1, marginBottom: 3 }}>PHOTO</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: `${P.blush}2A` }}>/images/{placeholder}.jpg</div>
        </div>
        {["tl", "tr", "bl", "br"].map(c => (
          <div key={c} style={{ position: "absolute", [c[0] === "t" ? "top" : "bottom"]: 4, [c[1] === "l" ? "left" : "right"]: 4, width: 7, height: 7, borderTop: c[0] === "t" ? `1px solid ${P.blush}44` : "none", borderBottom: c[0] === "b" ? `1px solid ${P.blush}44` : "none", borderLeft: c[1] === "l" ? `1px solid ${P.blush}44` : "none", borderRight: c[1] === "r" ? `1px solid ${P.blush}44` : "none" }} />
        ))}
      </div>
      {/* Caption */}
      <div style={{ background: P.paper, padding: "9px 11px", boxShadow: "0 5px 22px rgba(0,0,0,.4)", borderRadius: "0 0 2px 2px" }}>
        {date && <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: P.muted, letterSpacing: 1.5, marginBottom: 3 }}>{date.toUpperCase()}</p>}
        {title && <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: 12, color: P.brown, marginBottom: 4, lineHeight: 1.3 }}>{title}</p>}
        <p style={{ fontFamily: "'Caveat',cursive", fontSize: 12, color: P.brownMid, lineHeight: 1.7 }}>{note}</p>
        {isFinal && <p style={{ fontFamily: "'Caveat',cursive", fontSize: 16, color: P.gold, marginTop: 6, textAlign: "center" }}>with love, always ♡</p>}
      </div>
    </div>
  );
}

function NoteCard({ text, rot }) {
  return (
    <div style={{ transform: `rotate(${rot}deg)`, background: "#FEFCE8", padding: "14px 12px", boxShadow: "0 4px 16px rgba(0,0,0,.28)", borderRadius: 2, border: `1px solid ${P.blush}44`, position: "relative", minHeight: 120 }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 22, background: `${P.blush}18`, borderRadius: "2px 2px 0 0" }} />
      {[1, 2, 3, 4, 5].map(i => <div key={i} style={{ height: 1, background: `${P.blush}33`, marginBottom: 14, marginTop: i === 1 ? 16 : 0 }} />)}
      <p style={{ position: "absolute", top: 22, left: 10, right: 10, fontFamily: "'Caveat',cursive", fontSize: 12.5, color: P.brown, lineHeight: 1.85 }}>{text}</p>
    </div>
  );
}

function ScrapSection({ entry, idx, visible }) {
  const baseStyle = {
    marginBottom: 40,
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(32px)",
    transition: `opacity .65s ${idx * .07}s ease, transform .65s ${idx * .07}s ease`,
  };

  if (entry.layout === "single-l" || entry.layout === "single-r") {
    return (
      <div style={{ ...baseStyle, display: "flex", justifyContent: entry.layout === "single-l" ? "flex-start" : "flex-end", padding: "0 14px" }}>
        <PhotoCard {...entry} w="62%" placeholder={`memory-${idx + 1}`} />
      </div>
    );
  }
  if (entry.layout === "trio") {
    return (
      <div style={{ ...baseStyle, padding: "0 10px" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          {entry.dates.map((d, i) => (
            <PhotoCard key={i} date={d} title={entry.titles[i]} note={entry.notes[i]} rot={entry.rots[i]} w="33%" placeholder={`memory-${idx + 1}-${i + 1}`} />
          ))}
        </div>
      </div>
    );
  }
  if (entry.layout === "pair") {
    return (
      <div style={{ ...baseStyle, padding: "0 12px" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          {entry.dates.map((d, i) => (
            <PhotoCard key={i} date={d} title={entry.titles[i]} note={entry.notes[i]} rot={entry.rots[i]} w="50%" placeholder={`memory-${idx + 1}-${i + 1}`} />
          ))}
        </div>
      </div>
    );
  }
  if (entry.layout === "note-r") {
    return (
      <div style={{ ...baseStyle, padding: "0 12px" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <PhotoCard {...entry} w="55%" placeholder={`memory-${idx + 1}`} />
          <div style={{ flex: 1, paddingTop: 16 }}><NoteCard text={entry.longNote} rot={1.5} /></div>
        </div>
      </div>
    );
  }
  if (entry.layout === "note-l") {
    return (
      <div style={{ ...baseStyle, padding: "0 12px" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ flex: 1, paddingTop: 12 }}><NoteCard text={entry.longNote} rot={-1.5} /></div>
          <PhotoCard {...entry} w="55%" placeholder={`memory-${idx + 1}`} />
        </div>
      </div>
    );
  }
  return null;
}

function FinaleScrapbook({ stamps, onClose }) {
  const [visible, setVisible] = useState(new Set([0]));
  const itemRefs = useRef([]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setVisible(p => new Set([...p, parseInt(e.target.dataset.idx)])); }),
      { threshold: .1 }
    );
    itemRefs.current.forEach(el => { if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, background: P.bg, zIndex: 10000, overflowY: "auto", overflowX: "hidden" }}>
      <button onClick={onClose} style={{ position: "fixed", top: 13, right: 13, zIndex: 10001, background: `${P.brown}CC`, border: `1px solid ${P.blush}33`, color: P.white, borderRadius: "50%", width: 34, height: 34, cursor: "pointer", fontSize: 14, backdropFilter: "blur(8px)" }}>✕</button>

      {/* Hero */}
      <div style={{ height: "88vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", textAlign: "center", padding: 28 }}>
        <div style={{ fontSize: 66, animation: "pulse 2s infinite", marginBottom: 18 }}>🎂</div>
        <h1 style={{ fontFamily: "'DM Serif Display',serif", color: P.white, fontSize: 28, fontWeight: 400, marginBottom: 10, fontStyle: "italic" }}>A Scrapbook for You</h1>
        <p style={{ fontFamily: "'Caveat',cursive", color: P.blush, fontSize: 16, lineHeight: 1.7, maxWidth: 268 }}>Every memory I keep coming back to. All of them ours.</p>
        <div style={{ marginTop: 26, animation: "floatAnim 2s infinite", fontFamily: "'DM Mono',monospace", fontSize: 8, color: P.muted, letterSpacing: 2 }}>SCROLL TO REMEMBER ↓</div>
      </div>

      {/* Timeline rule */}
      <div style={{ textAlign: "center", margin: "0 0 32px", padding: "0 20px" }}>
        <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${P.blush}44,transparent)`, marginBottom: 12 }} />
        <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: P.muted, letterSpacing: 2.5 }}>MARCH 2024 → JULY 2026</p>
        <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${P.blush}44,transparent)`, marginTop: 12 }} />
      </div>

      {/* Entries */}
      <div style={{ maxWidth: 400, margin: "0 auto", padding: "0 4px" }}>
        {SCRAPBOOK_DATA.map((entry, i) => (
          <div key={i} data-idx={String(i)} ref={el => { itemRefs.current[i] = el; }}>
            <ScrapSection entry={entry} idx={i} visible={visible.has(i)} />
          </div>
        ))}
      </div>

      {/* Stamps strip */}
      {stamps.length > 0 && (
        <div style={{ textAlign: "center", padding: "32px 14px", borderTop: `1px solid ${P.blush}18`, margin: "16px 0" }}>
          <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: P.muted, letterSpacing: 2.5, marginBottom: 16 }}>YOUR STAMPS</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 340, margin: "0 auto" }}>
            {stamps.map((n, i) => {
              const d = DAYS[n - 1];
              return (
                <div key={i} style={{ background: P.paper, borderRadius: 3, padding: "6px", textAlign: "center", border: `1px solid ${P.blush}44`, animation: `popIn .36s ${i * .05}s both`, width: 52 }}>
                  <Illus day={d} w={32} h={32} lit={true} />
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6, color: P.muted, marginTop: 3 }}>JUL {String(n).padStart(2, "0")}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Final message */}
      <div style={{ textAlign: "center", padding: "46px 24px 80px", maxWidth: 320, margin: "0 auto" }}>
        <div style={{ width: 44, height: 1, background: `${P.gold}55`, margin: "0 auto 24px" }} />
        <p style={{ fontFamily: "'DM Serif Display',serif", color: P.white, fontSize: 20, fontWeight: 400, marginBottom: 12, fontStyle: "italic" }}>Happy birthday.</p>
        <p style={{ fontFamily: "'Caveat',cursive", color: P.blush, fontSize: 13.5, lineHeight: 2, marginBottom: 20 }}>Thank you for being you. For every ordinary day that felt extraordinary just because you were in it. For being someone I chose, and keep choosing.</p>
        <p style={{ fontFamily: "'Caveat',cursive", color: P.gold, fontSize: 20 }}>— with all my love ♡</p>
      </div>
    </div>
  );
}

// ─── DAY MODAL ────────────────────────────────────────────────────────────────
function DayModal({ day, onClose, onStampReady, hasStamp }) {
  const [confetti, setConfetti] = useState(false);
  const [finale,   setFinale]   = useState(false);
  const allStamps = useMemo(() => loadState().stamps || [], []);

  useEffect(() => {
    if (day.type === "physical") { setConfetti(true); setTimeout(() => setConfetti(false), 2800); }
  }, [day.type]);

  if (finale) return <FinaleScrapbook stamps={allStamps} onClose={() => setFinale(false)} />;

  return (
    <>
      <Confetti active={confetti} />
      <div style={{ position: "fixed", inset: 0, background: "rgba(6,4,2,.86)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)" }} onClick={onClose}>
        <div style={{ background: `${P.ink}F6`, borderRadius: 20, padding: "20px 17px", maxWidth: 352, width: "92%", maxHeight: "88vh", overflowY: "auto", position: "relative", animation: "popInUp .3s ease", boxShadow: `0 24px 70px rgba(0,0,0,.65), 0 0 0 1px ${P.blush}16`, border: `1px solid ${P.blush}16` }} onClick={e => e.stopPropagation()}>
          <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", fontSize: 16, cursor: "pointer", color: P.muted }}>✕</button>
          <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: P.muted, letterSpacing: 1.8, marginBottom: 4 }}>JULY {String(day.day).padStart(2, "0")} · 2026</p>
          <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 18, fontWeight: 400, color: P.white, marginBottom: 15, paddingRight: 20, animation: "inkReveal .55s ease" }}>{day.title}</h2>

          {day.type === "photo" && (
            <div style={{ background: `${P.brownMid}18`, borderRadius: 10, aspectRatio: "4/3", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 5, marginBottom: 12, border: `1px dashed ${P.blush}33` }}>
              <Illus day={day} w={64} h={64} lit={true} />
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: P.muted }}>/images/day-{String(day.day).padStart(2, "0")}.jpg</span>
            </div>
          )}
          {day.type === "giftcard" && (
            <div style={{ background: `linear-gradient(135deg,${P.brown},${P.navy})`, borderRadius: 12, padding: "18px 15px", marginBottom: 12, border: `1px solid ${P.blush}18`, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(45deg,transparent,transparent 8px,rgba(255,255,255,.01) 8px,rgba(255,255,255,.01) 9px)" }} />
              <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: `${P.blush}77`, letterSpacing: 2.5, marginBottom: 5 }}>GIFT CARD</p>
              <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: 32, color: P.goldLight, marginBottom: 4 }}>{day.amount}</p>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: `${P.white}BB`, lineHeight: 1.6 }}>{day.forWhat}</p>
            </div>
          )}
          {day.type === "coupon"     && <CouponSet coupons={day.coupons} color={day.color} />}
          {day.type === "physical"   && (
            <div style={{ background: `${P.brownMid}18`, borderRadius: 10, padding: 14, marginBottom: 12, textAlign: "center", border: `1px solid ${P.gold}18` }}>
              <div style={{ animation: "bounce2 2s infinite", display: "inline-block", marginBottom: 7 }}><Illus day={day} w={72} h={72} lit={true} /></div>
              <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: P.muted, letterSpacing: 1.8, marginBottom: 5 }}>WHERE TO FIND IT</p>
              <p style={{ fontFamily: "'Caveat',cursive", fontSize: 16, color: P.white, lineHeight: 1.7 }}>{day.hint}</p>
            </div>
          )}
          {day.type === "playlist" && (
            <div style={{ background: `${P.navy}CC`, borderRadius: 10, padding: 15, marginBottom: 12, textAlign: "center", border: `1px solid ${P.blush}18` }}>
              <div style={{ width: 68, height: 68, borderRadius: "50%", background: `conic-gradient(${P.brown},${P.navy},${P.olive},${P.brownLight},${P.brown})`, margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center", animation: "spinSlow 5s linear infinite" }}>
                <div style={{ width: 15, height: 15, borderRadius: "50%", background: P.white }} />
              </div>
              <p style={{ fontFamily: "'Caveat',cursive", fontSize: 15, color: P.white, marginBottom: 10 }}>songs that make me think of you</p>
              <a href="https://youtube.com/playlist?list=PLxxxxxx" target="_blank" rel="noreferrer" style={{ ...BTN, textDecoration: "none", display: "inline-block" }}>open playlist ↗</a>
            </div>
          )}
          {(day.type === "talent" || day.type === "story") && (
            <div style={{ background: `${P.brownMid}14`, borderRadius: 10, padding: 13, marginBottom: 12, border: `1px solid ${P.gold}18` }}>
              <p style={{ fontFamily: "'Caveat',cursive", fontSize: 14.5, lineHeight: 1.9, color: P.white }}>{day.content || "Your story goes here — the one you could tell a hundred times and never tire of…"}</p>
            </div>
          )}
          {day.type === "movie" && (
            <div style={{ background: `${P.dark}CC`, borderRadius: 10, padding: 14, marginBottom: 12, textAlign: "center", border: `1px solid ${P.blush}18` }}>
              <Illus day={day} w={58} h={58} lit={true} />
              <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: 20, color: P.white, marginTop: 7, fontStyle: "italic" }}>{day.movie}</p>
            </div>
          )}
          {day.type === "reflection" && (
            <div style={{ background: `${P.olive}16`, borderRadius: 10, padding: 13, marginBottom: 12, border: `1px solid ${P.olive}44` }}>
              {day.content.split("\n\n").map((p, i) => (
                <p key={i} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: P.white, lineHeight: 1.9, marginBottom: i === 0 ? 9 : 0, opacity: .88 }}>{p}</p>
              ))}
            </div>
          )}
          {day.type === "minigame"   && <div style={{ marginBottom: 12 }}><BreathingGame /></div>}
          {day.type === "ai"         && (
            <div style={{ background: `${P.brownMid}14`, borderRadius: 10, padding: 14, marginBottom: 12, textAlign: "center", border: `1px dashed ${P.blush}2A` }}>
              <Illus day={day} w={58} h={58} lit={true} />
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: P.muted, marginTop: 7 }}>AI image · /images/ai-{day.day}.jpg</p>
            </div>
          )}
          {day.type === "map"        && <WorldMapView />}
          {day.type === "bucketlist" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
              {day.items.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, background: `${P.brownMid}14`, borderRadius: 7, padding: "6px 9px", animation: `fadeUp .28s ${i * .05}s both` }}>
                  <span style={{ color: P.gold, fontSize: 11 }}>○</span>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: P.white, opacity: .88 }}>{item}</span>
                </div>
              ))}
            </div>
          )}
          {day.type === "finale" && (
            <div style={{ textAlign: "center", marginBottom: 12, padding: "4px 0" }}>
              <div style={{ animation: "pulse 1.5s infinite", display: "inline-block", marginBottom: 12 }}><Illus day={day} w={72} h={72} lit={true} /></div>
              <button style={{ ...BTN, width: "100%", animation: "glowAnim 2s infinite" }} onClick={() => setFinale(true)}>✨ open the final scrapbook</button>
            </div>
          )}

          <p style={{ fontFamily: "'Caveat',cursive", fontSize: 13, color: P.brownLight, lineHeight: 1.9, marginBottom: 13, borderTop: `1px solid ${P.blush}18`, paddingTop: 11 }}>{day.note}</p>
          {!hasStamp
            ? <button style={{ ...BTN, background: `${P.gold}EE`, borderColor: P.gold, color: P.dark, width: "100%", fontSize: 12 }} onClick={() => { onStampReady(day); onClose(); }}>collect today's stamp →</button>
            : <div style={{ textAlign: "center", fontFamily: "'DM Mono',monospace", fontSize: 9, color: P.muted, padding: "4px 0" }}>✓ stamp collected · day {day.day}</div>
          }
        </div>
      </div>
    </>
  );
}

// ─── LOCKED MODAL ─────────────────────────────────────────────────────────────
function LockedModal({ day, onClose }) {
  const u  = new Date(`2026-07-${String(day.day).padStart(2, "0")}T08:00:00`);
  const ms = u - new Date();
  const h  = Math.max(0, Math.floor(ms / 3600000));
  const m  = Math.max(0, Math.floor((ms % 3600000) / 60000));
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6,4,2,.86)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)" }} onClick={onClose}>
      <div style={{ background: `${P.ink}F6`, borderRadius: 17, padding: "24px 20px", maxWidth: 278, width: "85%", textAlign: "center", animation: "popIn .3s ease", border: `1px solid ${P.blush}18` }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 38, marginBottom: 11, animation: "floatAnim 3s infinite" }}>🔒</div>
        <p style={{ fontFamily: "'DM Serif Display',serif", fontSize: 16, color: P.white, marginBottom: 7 }}>Not yet, love.</p>
        <p style={{ fontFamily: "'Caveat',cursive", fontSize: 13.5, color: P.brownLight, lineHeight: 1.8, marginBottom: ms > 0 ? 5 : 16 }}>Opens July {day.day} at 8am.</p>
        {ms > 0 && <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, color: P.muted, marginBottom: 15 }}>{h}h {m}m to go</p>}
        <button style={BTN} onClick={onClose}>okay 🤍</button>
      </div>
    </div>
  );
}

// ─── STAMP BOOK MODAL ─────────────────────────────────────────────────────────
function StampBook({ stamps, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6,4,2,.86)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)" }} onClick={onClose}>
      <div style={{ background: `${P.ink}F6`, borderRadius: 19, padding: "20px 17px", maxWidth: 352, width: "92%", maxHeight: "80vh", overflowY: "auto", border: `1px solid ${P.blush}18` }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 16, fontWeight: 400, color: P.white }}>stamp collection</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", color: P.muted }}>✕</button>
        </div>
        {stamps.length === 0
          ? <p style={{ fontFamily: "'Caveat',cursive", fontSize: 15, color: P.muted, textAlign: "center", padding: "18px 0" }}>no stamps yet — open a day!</p>
          : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
              {stamps.map((n, i) => {
                const d = DAYS[n - 1];
                return (
                  <div key={i} style={{ background: `${P.brownMid}17`, borderRadius: 9, padding: "9px 7px", textAlign: "center", border: `1.5px solid ${P.gold}55`, animation: `popIn .32s ${i * .05}s both` }}>
                    <Illus day={d} w={36} h={36} lit={true} />
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: P.muted, marginTop: 3 }}>JULY {String(n).padStart(2, "0")}</div>
                    <div style={{ fontFamily: "'Caveat',cursive", fontSize: 9.5, color: P.brownLight, lineHeight: 1.3, marginTop: 1 }}>{d?.title || ""}</div>
                  </div>
                );
              })}
            </div>
          )
        }
      </div>
    </div>
  );
}

// ─── CD PLAYER ────────────────────────────────────────────────────────────────
function CDPlayer() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div onClick={() => setOpen(o => !o)} style={{ position: "fixed", bottom: 22, right: 16, zIndex: 500, cursor: "pointer", userSelect: "none" }}>
        <div style={{ width: 46, height: 46, borderRadius: "50%", background: `conic-gradient(${P.brown} 0deg,${P.navy} 120deg,${P.olive} 240deg,${P.brownLight} 300deg,${P.brown} 360deg)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 2px 12px rgba(0,0,0,.4), 0 0 0 2px ${P.blush}33`, border: `1.5px solid ${P.blush}44`, animation: open ? "spinSlow 4s linear infinite" : "none" }}>
          <div style={{ width: 11, height: 11, borderRadius: "50%", background: P.white }} />
        </div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, textAlign: "center", marginTop: 3, color: P.muted, letterSpacing: 1 }}>music</div>
      </div>
      {open && (
        <div style={{ position: "fixed", bottom: 82, right: 11, zIndex: 600, background: `${P.ink}F4`, borderRadius: 14, padding: 13, width: 236, boxShadow: `0 8px 30px rgba(0,0,0,.55)`, border: `1px solid ${P.blush}18`, animation: "slideDown .24s ease", backdropFilter: "blur(10px)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
            <span style={{ fontFamily: "'Caveat',cursive", fontSize: 15, color: P.white }}>🎵 our playlist</span>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", fontSize: 13, cursor: "pointer", color: P.muted }}>✕</button>
          </div>
          {/* Replace PLxxxxxx with your actual YouTube playlist ID */}
          <iframe src="https://www.youtube.com/embed/videoseries?list=PLxxxxxx&controls=1" width="100%" height="108" style={{ borderRadius: 8, border: "none" }} allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope" allowFullScreen title="Our playlist" />
          <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: P.muted, marginTop: 7, textAlign: "center" }}>replace PLxxxxxx with your playlist ID</p>
        </div>
      )}
    </>
  );
}

// ─── DRAGGABLE GRID TILE ──────────────────────────────────────────────────────
function DayTile({ day, px, unlocked, opened, stamped, onOpen, onMoveEnd }) {
  const ref        = useRef(null);
  const isDragging = useRef(false);
  const hasMoved   = useRef(false);
  const offset     = useRef({ x: 0, y: 0 });
  const holdTimer  = useRef(null);
  const startXY    = useRef({ x: 0, y: 0 });
  const clientRef  = useRef({ x: 0, y: 0 });

  const [held,   setHeld]   = useState(false);
  const [dragXY, setDragXY] = useState(null);

  const startDrag = useCallback((cx, cy) => {
    if (!unlocked) return;
    startXY.current = { x: cx, y: cy };
    hasMoved.current = false;
    holdTimer.current = setTimeout(() => {
      isDragging.current = true;
      setHeld(true);
      const r = ref.current?.getBoundingClientRect();
      if (r) offset.current = { x: cx - r.left, y: cy - r.top };
    }, 320);
  }, [unlocked]);

  const stopDrag = useCallback(() => {
    clearTimeout(holdTimer.current);
    if (isDragging.current) {
      isDragging.current = false;
      setHeld(false);
      if (dragXY) onMoveEnd(day.day, dragXY.x, dragXY.y);
      setDragXY(null);
    }
  }, [day.day, dragXY, onMoveEnd]);

  const moveDrag = useCallback((cx, cy) => {
    clientRef.current = { x: cx, y: cy };
    const dx = Math.abs(cx - startXY.current.x);
    const dy = Math.abs(cy - startXY.current.y);
    if (dx > 4 || dy > 4) hasMoved.current = true;
    if (!isDragging.current) return;
    const canvas = ref.current?.closest(".grid-canvas")?.getBoundingClientRect();
    if (canvas) setDragXY({ x: cx - canvas.left - offset.current.x, y: cy - canvas.top - offset.current.y });
  }, []);

  useEffect(() => {
    const mm = e => moveDrag(e.clientX, e.clientY);
    const tm = e => { if (e.touches[0]) moveDrag(e.touches[0].clientX, e.touches[0].clientY); };
    const up = () => stopDrag();
    window.addEventListener("mousemove", mm);
    window.addEventListener("touchmove", tm, { passive: true });
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("touchmove", tm);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchend", up);
    };
  }, [moveDrag, stopDrag]);

  const handleClick = () => { if (!isDragging.current && !hasMoved.current) onOpen(day); };

  const x = dragXY ? dragXY.x : px.x;
  const y = dragXY ? dragXY.y : px.y;

  return (
    <>
      {held && <ParticleTrail active={held} clientX={clientRef.current.x} clientY={clientRef.current.y} />}
      <div ref={ref}
        onMouseDown={e => { e.preventDefault(); startDrag(e.clientX, e.clientY); }}
        onTouchStart={e => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
        onClick={handleClick}
        className={held ? "" : "tile-lift"}
        style={{
          position: "absolute", left: x, top: y, width: px.w, height: px.h,
          cursor: unlocked ? (held ? "grabbing" : "pointer") : "not-allowed",
          userSelect: "none", touchAction: "none",
          zIndex: held ? 200 : unlocked ? 3 : 1,
          transform: held ? "scale(1.08) rotate(-2deg)" : "scale(1)",
          transition: held ? "none" : "left .38s cubic-bezier(.4,0,.2,1), top .38s cubic-bezier(.4,0,.2,1), transform .18s",
          opacity: unlocked ? 1 : .32,
          filter: unlocked ? `drop-shadow(0 3px 10px ${day.color}44)` : "grayscale(80%)",
        }}
      >
        {/* Raw illustration — no box wrapper */}
        <Illus day={day} w={px.w} h={px.h} lit={unlocked} />

        {/* Glow ring on unlocked-but-not-opened */}
        {unlocked && !opened && (
          <div style={{ position: "absolute", inset: -2, borderRadius: 14, border: `1.5px solid ${day.color}66`, pointerEvents: "none", animation: "shimmer 3s infinite" }} />
        )}
        {/* Stamp badge */}
        {stamped && (
          <div style={{ position: "absolute", top: -5, right: -5, background: P.gold, borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, boxShadow: "0 1px 4px rgba(0,0,0,.5)" }}>✦</div>
        )}
        {/* Lock badge */}
        {!unlocked && (
          <div style={{ position: "absolute", top: -4, right: -4, background: `${P.dark}CC`, borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>🔒</div>
        )}
      </div>
    </>
  );
}

// ─── INTRO FLOW ───────────────────────────────────────────────────────────────
const JOKES = [
  "Why did the birthday cake go to therapy?\nToo many layers.\n(Like you — I love all of them.)",
  "What do you call someone who is always right?\nYou. Apparently.\nYou'd agree.",
  "Why don't scientists trust atoms?\nThey make up everything.\nUnlike me — you're genuinely this great.",
  "Knock knock.\nWho's there?\nSomeone who loves you embarrassingly much. 🎂",
];

function IntroFlow({ onDone }) {
  const [step, setStep] = useState(0);
  const [joke, setJoke] = useState(0);
  return (
    <div style={{ position: "fixed", inset: 0, background: `${P.bg}F5`, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      {step === 0 && (
        <div style={{ ...CARD, textAlign: "center", animation: "fadeUp .55s ease" }}>
          <div style={{ fontSize: 54, marginBottom: 13, animation: "bounce2 2s infinite" }}>🎂</div>
          <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 25, fontWeight: 400, color: P.white, marginBottom: 9 }}>Happy Birthday</h1>
          <p style={{ fontFamily: "'Caveat',cursive", fontSize: 16, color: P.brownLight, lineHeight: 1.8, marginBottom: 24 }}>A little something I made,<br />just for you. Take your time. ♡</p>
          <button style={BTN} onClick={() => setStep(1)}>open your letter →</button>
        </div>
      )}
      {step === 1 && (
        <div style={{ ...CARD, animation: "popInUp .5s ease" }}>
          <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: P.muted, letterSpacing: 2.5, marginBottom: 13 }}>A LETTER FOR YOU ✦</p>
          <p style={{ fontFamily: "'Caveat',cursive", fontSize: 19, color: P.white, marginBottom: 13, lineHeight: 1.5 }}>To the person who somehow became my favourite thing —</p>
          {[
            "I made this because words on a card felt too small. You deserve something that takes a little time to unwrap — just like getting to know you did.",
            "Every day this month has something in it. Some days are silly. Some are real. All of it is true.",
            "Happy birthday. Thank you for being here.",
          ].map((p, i) => (
            <p key={i} style={{ fontFamily: "'Caveat',cursive", fontSize: 13.5, color: P.brownLight, lineHeight: 1.9, marginBottom: 9, animation: `fadeUp .45s ${.08 + i * .1}s both` }}>{p}</p>
          ))}
          <p style={{ fontFamily: "'Caveat',cursive", fontSize: 17, textAlign: "right", color: P.white, marginBottom: 18 }}>— with love 🤎</p>
          <div style={{ background: `${P.brownMid}18`, borderRadius: 8, padding: "8px 11px", marginBottom: 14, display: "flex", gap: 7, alignItems: "center", border: `1px solid ${P.blush}18` }}>
            <span style={{ fontSize: 12 }}>🎙️</span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, color: P.muted, flex: 1 }}>voice note — tap play</span>
            <button style={{ ...BTN, padding: "3px 8px", fontSize: 9.5 }}>▶</button>
          </div>
          <button style={BTN} onClick={() => setStep(2)}>continue →</button>
        </div>
      )}
      {step === 2 && (
        <div style={{ ...CARD, textAlign: "center", animation: "popIn .38s ease" }}>
          <div style={{ fontSize: 28, marginBottom: 9 }}>😄</div>
          <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: P.muted, letterSpacing: 1.5, marginBottom: 13 }}>{joke + 1} OF {JOKES.length}</p>
          <p style={{ fontFamily: "'Caveat',cursive", fontSize: 15, color: P.white, lineHeight: 1.9, marginBottom: 22, minHeight: 88, whiteSpace: "pre-line" }}>{JOKES[joke]}</p>
          {joke < JOKES.length - 1
            ? <button style={BTN} onClick={() => setJoke(j => j + 1)}>next →</button>
            : <button style={{ ...BTN, animation: "glowAnim 2s infinite" }} onClick={onDone}>show me everything 🎁</button>
          }
        </div>
      )}
    </div>
  );
}

// ─── SHARED STYLE OBJECTS ─────────────────────────────────────────────────────
const BTN = {
  background: `${P.brownMid}CC`, color: P.white,
  border: `1px solid ${P.blush}44`, borderRadius: 8,
  padding: "8px 16px", fontSize: 12, cursor: "pointer",
  fontFamily: "'DM Sans',sans-serif", backdropFilter: "blur(4px)",
};
const CARD = {
  background: `${P.ink}F4`, borderRadius: 21,
  padding: "24px 20px",
  boxShadow: `0 14px 52px rgba(0,0,0,.58)`,
  maxWidth: 330, width: "90%",
  border: `1px solid ${P.blush}18`,
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const saved = useMemo(() => loadState(), []);

  const [showIntro,    setShowIntro]    = useState(!saved.seen);
  const [opened,       setOpened]       = useState(saved.opened || []);
  const [stamps,       setStamps]       = useState(saved.stamps || []);
  const [gridOverride, setGridOverride] = useState(saved.grid   || {});
  const [modal,        setModal]        = useState(null);
  const [locked,       setLocked]       = useState(null);
  const [stampPopup,   setStampPopup]   = useState(null);
  const [stampFall,    setStampFall]    = useState(null);
  const [stampBook,    setStampBook]    = useState(false);
  const [envPop,       setEnvPop]       = useState(false);
  const prevStampLen = useRef(stamps.length);

  // Persist on every relevant state change
  useEffect(() => { saveState({ seen: true, opened, stamps, grid: gridOverride }); }, [opened, stamps, gridOverride]);

  // Shake the envelope when a new stamp is added
  useEffect(() => {
    if (stamps.length > prevStampLen.current) { setEnvPop(true); setTimeout(() => setEnvPop(false), 700); }
    prevStampLen.current = stamps.length;
  }, [stamps.length]);

  // Compute pixel positions for every tile
  const gridPositions = useMemo(() => packGrid(gridOverride), [gridOverride]);
  const canvasH = useMemo(() => (
    Math.max(...Object.values(gridPositions).map(p => p.row + p.rs)) * (CELL + GAP) + 24
  ), [gridPositions]);
  const canvasW = COLS * (CELL + GAP) - GAP;

  const openDay = (d) => {
    if (!isUnlocked(d.day)) { setLocked(d); return; }
    setOpened(p => p.includes(d.day) ? p : [...p, d.day]);
    setModal(d);
  };

  // After DayModal closes, show stamp popup (first visit only)
  const handleStampReady = (d) => {
    if (!stamps.includes(d.day)) setStampPopup(d);
  };

  // After stamp popup closes, add stamp to collection and trigger fall animation
  const handleStampClose = () => {
    const d = stampPopup;
    setStampPopup(null);
    setStamps(p => p.includes(d.day) ? p : [...p, d.day]);
    setStampFall(d);
  };

  // Snap dragged tile back to grid, push others out of the way
  const handleMoveEnd = useCallback((dayNum, rawX, rawY) => {
    const [cs, rs] = DAY_SIZES[dayNum];
    const col = Math.max(0, Math.min(COLS - cs, Math.round(rawX / (CELL + GAP))));
    const row = Math.max(0, Math.round(rawY / (CELL + GAP)));
    setGridOverride(prev => ({ ...prev, [dayNum]: { col, row, cs, rs } }));
  }, []);

  return (
    <div style={{ background: P.bg, minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", overflowX: "hidden", position: "relative" }}>
      <style>{GLOBAL_CSS}</style>
      <InkBg />

      {/* ── Header ── */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "34px 20px 0" }}>
        <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 8.5, color: P.muted, letterSpacing: 3.5, marginBottom: 6 }}>JULY 2026</p>
        <h1 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 27, fontWeight: 400, color: P.white, marginBottom: 4, lineHeight: 1.2, fontStyle: "italic" }}>for you, my love 🤎</h1>
        <p style={{ fontFamily: "'Caveat',cursive", fontSize: 15, color: P.brownLight, marginBottom: 20, lineHeight: 1.6 }}>27 days of little things, leading up to you.</p>
        <Countdown />
        <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 8.5, color: P.muted, marginTop: 6, letterSpacing: 1 }}>until 28 july · your birthday ♡</p>
      </div>

      {/* ── Note banner ── */}
      <div style={{ maxWidth: 380, margin: "14px auto 0", padding: "0 15px", position: "relative", zIndex: 1 }}>
        <div style={{ background: `${P.brownMid}17`, borderRadius: 10, padding: "9px 12px", borderLeft: `3px solid ${P.blush}77` }}>
          <p style={{ fontFamily: "'Caveat',cursive", fontSize: 12.5, color: P.brownLight, lineHeight: 1.9 }}>
            Open one each morning at 8am ☀️  Hold &amp; drag any opened tile to rearrange. Last one unlocks midnight on the 27th. ♡
          </p>
        </div>
      </div>

      {/* ── Vine progress ── */}
      <VineProgress count={opened.length} total={27} />

      {/* ── Grid canvas ── */}
      <div style={{ display: "flex", justifyContent: "center", position: "relative", zIndex: 1, margin: "16px 0 130px", padding: "0 12px" }}>
        <div className="grid-canvas" style={{ position: "relative", width: canvasW, height: canvasH }}>
          {DAYS.map(d => {
            const gp = gridPositions[d.day] || { col: 0, row: d.day - 1, cs: 1, rs: 1 };
            const px = toPx(gp);
            return (
              <DayTile key={d.day} day={d} px={px}
                unlocked={isUnlocked(d.day)}
                opened={opened.includes(d.day)}
                stamped={stamps.includes(d.day)}
                onOpen={openDay}
                onMoveEnd={handleMoveEnd}
              />
            );
          })}
        </div>
      </div>

      {/* ── Stamp envelope (bottom-left) ── */}
      <div onClick={() => setStampBook(true)} style={{ position: "fixed", bottom: 22, left: 15, zIndex: 500, cursor: "pointer", animation: envPop ? "envShake .7s ease" : "none" }}>
        <div style={{ background: `${P.brown}CC`, borderRadius: 11, padding: "7px 9px", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, border: `1px solid ${P.blush}33`, backdropFilter: "blur(8px)", boxShadow: "0 2px 11px rgba(0,0,0,.3)", position: "relative" }}>
          <span style={{ fontSize: 24 }}>📬</span>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: P.white, letterSpacing: 1 }}>STAMPS</span>
          {stamps.length > 0 && (
            <div style={{ position: "absolute", top: -6, right: -6, background: P.gold, borderRadius: "50%", width: 17, height: 17, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono',monospace", fontSize: 8.5, color: P.dark, fontWeight: 700 }}>{stamps.length}</div>
          )}
        </div>
      </div>

      {/* ── CD / music player (bottom-right) ── */}
      <CDPlayer />

      {/* ── Modals ── */}
      {modal      && <DayModal    day={modal}    onClose={() => setModal(null)}    onStampReady={handleStampReady} hasStamp={stamps.includes(modal.day)} />}
      {locked     && <LockedModal day={locked}   onClose={() => setLocked(null)} />}
      {stampPopup && <StampPopup  day={stampPopup} onClose={handleStampClose} />}
      {stampFall  && <StampFall   day={stampFall}  onDone={() => setStampFall(null)} />}
      {stampBook  && <StampBook   stamps={stamps}  onClose={() => setStampBook(false)} />}
      {showIntro  && <IntroFlow   onDone={() => setShowIntro(false)} />}
    </div>
  );
}
