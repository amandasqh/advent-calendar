import { useState, useEffect, useRef, useCallback } from "react";

const PALETTE = {
  bg: "#F5F0E8",
  bgDark: "#1C1A16",
  cream: "#EDE8DC",
  dark: "#2A2520",
  brown: "#4A3728",
  brownMid: "#6B4F3A",
  olive: "#3D4A2E",
  navy: "#1E2D3D",
  blush: "#C8A882",
  accent: "#8B6B4A",
  text: "#2A2520",
  textMuted: "#7A6A5A",
  white: "#FAF8F4",
  stamp: "#D4A853",
};

const DAYS_DATA = [
  { day: 1, type: "photo", title: "My favourite photo of you", emoji: "📸", note: "This one lives rent-free in my head. I keep coming back to it when I miss you.", unlocked: false },
  { day: 2, type: "photo", title: "My favourite photo of us", emoji: "🫶", note: "Proof that we are, objectively, the cutest.", unlocked: false },
  { day: 3, type: "giftcard", title: "Gift card — just for you", emoji: "🎁", amount: "SGD 50", forWhat: "Your favourite store / whatever your heart wants", note: "No guilt spending this. That's an order.", unlocked: false },
  { day: 4, type: "coupon", title: "Triple coupon bundle", emoji: "🎟️", coupons: ["Free massage (duration: as long as you want)", "1,000,000 free kisses (redeemable anytime)", "Bonus points coupon — 10x multiplier on any request"], note: "Terms & conditions: none. Valid forever. Cannot expire.", unlocked: false },
  { day: 5, type: "coupon", title: "Two very important coupons", emoji: "☮️", coupons: ["No-argument day — I will not argue. I will be pleasant. I will agree (mostly).", "One free wish — anything. Seriously. Anything."], note: "Use wisely. Or don't. I'll probably still say yes.", unlocked: false },
  { day: 6, type: "physical", title: "Couple pyjamas 🛌", emoji: "🧸", hint: "Check the wardrobe. Top shelf. Don't look until tonight.", note: "So we can be disgustingly cute at home and nowhere else.", unlocked: false },
  { day: 7, type: "physical", title: "Haribo + snack haul 🍬", emoji: "🍬", hint: "Kitchen counter. Or maybe I'll just hand them to you. Surprise.", note: "For movie nights, sad days, and every day in between.", unlocked: false },
  { day: 8, type: "physical", title: "Voice recorder + ring holder necklace", emoji: "💍", hint: "TBC — will be with you before this day.", note: "To remember things. To hold things. Both matter.", unlocked: false },
  { day: 9, type: "playlist", title: "Songs that remind me of you", emoji: "🎵", playlistUrl: "https://youtube.com/playlist?list=PLxxxxxx", note: "Every single one of these played in my head while I thought about you.", unlocked: false },
  { day: 10, type: "physical", title: "Printed tee — custom made", emoji: "👕", hint: "Will be handed to you personally. Look forward to it.", note: "Wear it. Or sleep in it. Either is valid.", unlocked: false },
  { day: 11, type: "physical", title: "Handmade card + printed photos", emoji: "💌", hint: "It's in an envelope. You'll recognise it when you see it.", note: "I made this with my hands. And a lot of tape.", unlocked: false },
  { day: 12, type: "physical", title: "Homemade bakes 🥐", emoji: "🧁", hint: "Fresh batch coming. I'll let you know when they're ready.", note: "Made with love and a questionable amount of butter.", unlocked: false },
  { day: 13, type: "coupon", title: "Restaurant date coupon", emoji: "🍽️", coupons: ["One dinner date at a restaurant of your choice — my treat, your vibe."], note: "Fancy or casual. Long or short. Just us.", unlocked: false },
  { day: 14, type: "photo", title: "Your favourite country + our photo there", emoji: "🌍", note: "This place means something to both of us now.", unlocked: false },
  { day: 15, type: "physical", title: "AirPod case + wired earphone case (MUJI)", emoji: "🎧", hint: "Wrapped and ready. Will be with you soon.", note: "Keep your things safe. Like I try to keep you.", unlocked: false },
  { day: 16, type: "physical", title: "Boots shoes 👟", emoji: "👟", hint: "Stored safely. Yours when we meet.", note: "For walking everywhere together.", unlocked: false },
  { day: 17, type: "talent", title: "The talent I see in you", emoji: "⭐", talent: "Honestly? American Idol would not know what hit them. You have this way of filling a room — not with noise, but with something warmer. I see it every time.", note: "Don't argue with me on this one.", unlocked: false },
  { day: 18, type: "movie", title: "Your favourite movie 🎬", emoji: "🎬", movie: "Shaolin Soccer", note: "I now associate this movie entirely with you. It's ruined me (in a good way).", unlocked: false },
  { day: 19, type: "reflection", title: "The biggest changes I've seen", emoji: "🌱", content: "In you: You've grown quieter in the best way. More sure of yourself. You laugh easier now.\n\nIn me: I'm more patient. More present. More aware of what actually matters.", note: "Thank you for growing alongside me.", unlocked: false },
  { day: 20, type: "coupon", title: "Date of your choice", emoji: "🗓️", coupons: ["One full date — you plan it. I show up. No complaints, no suggestions, just yes."], note: "Your call. Your day. I'll just be grateful to be there.", unlocked: false },
  { day: 21, type: "minigame", title: "A little breathing game 🐸", emoji: "🐸", note: "For when the world feels too loud. I made this just for you.", unlocked: false },
  { day: 22, type: "ai", title: "Our future kids (AI imagined) 🍼", emoji: "🍼", note: "Totally unscientific. Probably accurate. Definitely adorable.", unlocked: false },
  { day: 23, type: "ai", title: "Growing old together 👴👵", emoji: "🤍", note: "Can't wait to be old and annoying with you.", unlocked: false },
  { day: 24, type: "map", title: "Our world map — past & future ✈️", emoji: "✈️", note: "Every place we've been. Every place we're going.", unlocked: false },
  { day: 25, type: "bucketlist", title: "Things we'll do together 🗺️", emoji: "🗺️", items: ["Watch the northern lights", "Road trip with no plan", "Learn to cook one fancy dish together", "Stay in a cabin in the mountains", "Get matching something (TBD)", "Slow morning in a city we've never been to", "Write letters to our future selves"], note: "Not a promise. A direction.", unlocked: false },
  { day: 26, type: "story", title: "A story I never get tired of", emoji: "📖", note: "This one is just for you. Read it slowly.", unlocked: false },
  { day: 27, type: "finale", title: "Everything, all at once 🎂", emoji: "🎂", note: "Happy birthday. I love you more than I know how to say.", unlocked: false },
];

const DRAGGABLES = [
  { id: "haribo", emoji: "🍬", label: "Haribo", x: 60, y: 20 },
  { id: "lotso", emoji: "🧸", label: "Lotso", x: 200, y: 40 },
  { id: "hojicha", emoji: "🍵", label: "Hojicha", x: 100, y: 120 },
  { id: "minion", emoji: "💛", label: "Minion", x: 250, y: 100 },
  { id: "croissant", emoji: "🥐", label: "Croissant", x: 50, y: 180 },
  { id: "chendol", emoji: "🍧", label: "Chendol", x: 220, y: 170 },
];

const FLOATING_SKETCHES = ["🍬", "🧸", "🍵", "🥐", "🍧", "✨", "🤎", "🌿"];

const STAMPS = [
  { id: 1, date: "2024.03.15", photo: "📸", note: "The day everything started making sense." },
  { id: 2, date: "2024.06.01", photo: "🌅", note: "That morning we stayed up until sunrise." },
  { id: 3, date: "2024.09.20", photo: "🍂", note: "Autumn walks and too much coffee." },
  { id: 4, date: "2024.12.25", photo: "❄️", note: "Our first Christmas." },
  { id: 5, date: "2025.02.14", photo: "🌹", note: "You pretended not to care. You cared." },
];

const JOKES = [
  "Why did the birthday cake go to therapy? It had too many layers. (Like you. Layers. I love all of them.)",
  "What do you call someone who is always right? You. Apparently. (You'd agree.)",
  "Why don't scientists trust atoms? Because they make up everything. Unlike me. I make up nothing. You're genuinely this great.",
  "One more: knock knock. Who's there? Someone who loves you embarrassingly much. Happy birthday. 🎂",
];

// ─── Floating background particles ───────────────────────────────────────────
function FloatingBg() {
  const items = useRef(
    Array.from({ length: 18 }, (_, i) => ({
      symbol: FLOATING_SKETCHES[i % FLOATING_SKETCHES.length],
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 12 + Math.random() * 14,
      dur: 8 + Math.random() * 10,
      delay: Math.random() * 6,
      drift: (Math.random() - 0.5) * 30,
    }))
  ).current;

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      {items.map((it, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${it.x}%`,
            top: `${it.y}%`,
            fontSize: it.size,
            opacity: 0.07,
            animation: `floatUp ${it.dur}s ${it.delay}s infinite ease-in-out`,
            userSelect: "none",
          }}
        >
          {it.symbol}
        </span>
      ))}
      <style>{`
        @keyframes floatUp {
          0%,100%{transform:translateY(0) translateX(0) rotate(0deg)}
          50%{transform:translateY(-30px) translateX(${Math.random() * 20 - 10}px) rotate(8deg)}
        }
        @keyframes fadeIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
        @keyframes popIn{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:scale(1)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:none}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes breatheIn{0%,100%{transform:scale(1)}50%{transform:scale(1.5)}}
        @keyframes shimmer{0%{opacity:.6}50%{opacity:1}100%{opacity:.6}}
      `}</style>
    </div>
  );
}

// ─── Welcome / Intro screen ───────────────────────────────────────────────────
function WelcomeScreen({ onDone }) {
  const [step, setStep] = useState(0); // 0=welcome, 1=letter, 2=jokes, 3=done
  const [jokeIdx, setJokeIdx] = useState(0);

  if (step === 0) {
    return (
      <div style={styles.overlay}>
        <div style={{ ...styles.card, maxWidth: 340, textAlign: "center", animation: "popIn .6s ease" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎂</div>
          <h1 style={{ ...styles.display, marginBottom: 8 }}>Happy Birthday</h1>
          <p style={{ ...styles.body, color: PALETTE.textMuted, marginBottom: 24 }}>
            A little something I made, just for you. Take your time. ♡
          </p>
          <button style={styles.btn} onClick={() => setStep(1)}>Open your letter →</button>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div style={styles.overlay}>
        <div style={{ ...styles.card, maxWidth: 360, animation: "slideUp .7s ease" }}>
          <p style={{ ...styles.mono, color: PALETTE.textMuted, fontSize: 11, marginBottom: 16 }}>A letter for you ✦</p>
          <p style={{ ...styles.handwriting, fontSize: 22, marginBottom: 20, lineHeight: 1.5 }}>
            To the person who somehow became my favourite thing —
          </p>
          <p style={{ ...styles.handwriting, fontSize: 16, lineHeight: 1.9, color: PALETTE.brownMid, marginBottom: 16 }}>
            I made this because words on a card felt too small. You deserve something that takes a little time to unwrap — just like getting to know you did.
          </p>
          <p style={{ ...styles.handwriting, fontSize: 16, lineHeight: 1.9, color: PALETTE.brownMid, marginBottom: 16 }}>
            Every day this month has something in it. Some days are silly. Some are real. All of it is true.
          </p>
          <p style={{ ...styles.handwriting, fontSize: 16, lineHeight: 1.9, color: PALETTE.brownMid, marginBottom: 24 }}>
            Happy birthday. Thank you for being here.
          </p>
          <p style={{ ...styles.handwriting, fontSize: 18, textAlign: "right", marginBottom: 24 }}>
            — with love 🤎
          </p>
          <div style={{ background: "#F0EBE0", borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: PALETTE.textMuted, display: "flex", gap: 8, alignItems: "center" }}>
            <span>🎙️</span>
            <span style={styles.mono}>Voice note available — tap play when you're ready</span>
            <button style={{ ...styles.btnSmall, marginLeft: "auto" }}>▶</button>
          </div>
          <button style={styles.btn} onClick={() => setStep(2)}>Continue →</button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div style={styles.overlay}>
        <div style={{ ...styles.card, maxWidth: 340, textAlign: "center", animation: "popIn .5s ease" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>😄</div>
          <p style={{ ...styles.mono, fontSize: 11, color: PALETTE.textMuted, marginBottom: 14 }}>
            {jokeIdx + 1} of {JOKES.length}
          </p>
          <p style={{ ...styles.body, lineHeight: 1.8, marginBottom: 24, minHeight: 80 }}>
            {JOKES[jokeIdx]}
          </p>
          {jokeIdx < JOKES.length - 1 ? (
            <button style={styles.btn} onClick={() => setJokeIdx(j => j + 1)}>Next joke →</button>
          ) : (
            <button style={styles.btn} onClick={() => { setStep(3); setTimeout(onDone, 300); }}>
              Show me the calendar 🎁
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// ─── Countdown ────────────────────────────────────────────────────────────────
function Countdown() {
  const [diff, setDiff] = useState({});
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const bday = new Date("2026-07-28T00:00:00");
      const ms = bday - now;
      if (ms <= 0) { setDiff({ done: true }); return; }
      setDiff({
        days: Math.floor(ms / 86400000),
        hours: Math.floor((ms % 86400000) / 3600000),
        mins: Math.floor((ms % 3600000) / 60000),
        secs: Math.floor((ms % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (diff.done) return <p style={{ ...styles.handwriting, fontSize: 22, textAlign: "center", color: PALETTE.accent }}>🎂 It's your birthday!!</p>;

  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
      {[["days", diff.days], ["hrs", diff.hours], ["min", diff.mins], ["sec", diff.secs]].map(([label, val]) => (
        <div key={label} style={{ textAlign: "center", background: PALETTE.brown, borderRadius: 10, padding: "8px 14px", minWidth: 52 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: PALETTE.cream, fontFamily: "'DM Mono', monospace" }}>{String(val ?? "--").padStart(2, "0")}</div>
          <div style={{ fontSize: 10, color: PALETTE.blush, fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>{label.toUpperCase()}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Stamp viewer ─────────────────────────────────────────────────────────────
function StampBook({ stamps, onClose }) {
  return (
    <div style={styles.overlayDark} onClick={onClose}>
      <div style={{ ...styles.card, maxWidth: 360, maxHeight: "80vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={styles.h2}>📬 Stamp Collection</h2>
          <button style={styles.close} onClick={onClose}>✕</button>
        </div>
        {stamps.length === 0 && <p style={{ ...styles.body, color: PALETTE.textMuted }}>No stamps yet — open days to collect them!</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {stamps.map(s => (
            <div key={s.id} style={{ display: "flex", gap: 12, background: PALETTE.cream, borderRadius: 10, padding: 12, border: `1.5px solid ${PALETTE.blush}` }}>
              <div style={{ fontSize: 36, flexShrink: 0, background: PALETTE.stamp, borderRadius: 8, width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.photo}</div>
              <div>
                <p style={{ ...styles.mono, fontSize: 10, color: PALETTE.textMuted, marginBottom: 4 }}>{s.date}</p>
                <p style={{ ...styles.handwriting, fontSize: 14, color: PALETTE.brown }}>{s.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Breathing mini-game ──────────────────────────────────────────────────────
function BreathingGame({ onClose }) {
  const [phase, setPhase] = useState("idle"); // idle, in, hold, out
  const [count, setCount] = useState(0);
  const [rounds, setRounds] = useState(0);
  const timerRef = useRef(null);

  const start = () => {
    setPhase("in"); setCount(4);
  };

  useEffect(() => {
    if (phase === "idle") return;
    if (count > 0) {
      timerRef.current = setTimeout(() => setCount(c => c - 1), 1000);
    } else {
      if (phase === "in") { setPhase("hold"); setCount(7); }
      else if (phase === "hold") { setPhase("out"); setCount(8); }
      else if (phase === "out") { const r = rounds + 1; setRounds(r); if (r >= 3) { setPhase("done"); } else { setPhase("in"); setCount(4); } }
    }
    return () => clearTimeout(timerRef.current);
  }, [phase, count]);

  const msgs = { idle: "tap to begin", in: "breathe in…", hold: "hold…", out: "breathe out…", done: "well done 🤍" };
  const scale = phase === "in" ? 1.5 : phase === "hold" ? 1.5 : 1;

  return (
    <div style={styles.overlayDark} onClick={onClose}>
      <div style={{ ...styles.card, maxWidth: 320, textAlign: "center" }} onClick={e => e.stopPropagation()}>
        <button style={{ ...styles.close, position: "absolute", top: 16, right: 16 }} onClick={onClose}>✕</button>
        <h2 style={{ ...styles.h2, marginBottom: 4 }}>🐸 Breathe with Froggy</h2>
        <p style={{ ...styles.body, color: PALETTE.textMuted, fontSize: 13, marginBottom: 24 }}>4-7-8 breathing · 3 rounds</p>
        <div
          onClick={phase === "idle" ? start : undefined}
          style={{
            width: 120, height: 120, borderRadius: "50%", margin: "0 auto 20px",
            background: PALETTE.olive, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 52, cursor: phase === "idle" ? "pointer" : "default",
            transition: "transform 1s ease",
            transform: `scale(${scale})`,
          }}
        >
          🐸
        </div>
        <p style={{ ...styles.handwriting, fontSize: 20, marginBottom: 8, color: PALETTE.brown }}>{msgs[phase]}</p>
        {phase !== "idle" && phase !== "done" && (
          <p style={{ ...styles.mono, fontSize: 28, color: PALETTE.accent }}>{count}</p>
        )}
        {phase === "done" && (
          <>
            <p style={{ ...styles.body, color: PALETTE.brownMid, marginTop: 12, marginBottom: 16 }}>
              You did great. Remember: you are safe, you are loved, and things are okay.
            </p>
            <button style={styles.btn} onClick={() => { setPhase("idle"); setRounds(0); setCount(0); }}>Go again</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── World map (animated SVG dots) ───────────────────────────────────────────
function WorldMap({ onClose }) {
  const visited = [
    { name: "Singapore", x: 72, y: 62, status: "been" },
    { name: "Japan", x: 78, y: 40, status: "been" },
    { name: "UK", x: 44, y: 28, status: "been" },
    { name: "Thailand", x: 70, y: 54, status: "been" },
    { name: "Bali", x: 72, y: 67, status: "soon" },
    { name: "New Zealand", x: 82, y: 80, status: "dream" },
    { name: "Iceland", x: 38, y: 18, status: "dream" },
    { name: "Italy", x: 50, y: 34, status: "soon" },
    { name: "Canada", x: 22, y: 25, status: "dream" },
    { name: "Morocco", x: 45, y: 44, status: "soon" },
  ];
  const colors = { been: "#8B6B4A", soon: "#3D4A2E", dream: "#C8A882" };

  return (
    <div style={styles.overlayDark} onClick={onClose}>
      <div style={{ ...styles.card, maxWidth: 370 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={styles.h2}>✈️ Our World</h2>
          <button style={styles.close} onClick={onClose}>✕</button>
        </div>
        <div style={{ position: "relative", background: "#2A2520", borderRadius: 12, overflow: "hidden", height: 200 }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.15, fontSize: 8, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace" }}>
            ·····MAP·PLACEHOLDER·····
          </div>
          {visited.map((p, i) => (
            <div
              key={i}
              title={p.name}
              style={{
                position: "absolute",
                left: `${p.x}%`, top: `${p.y}%`,
                width: p.status === "been" ? 10 : 8,
                height: p.status === "been" ? 10 : 8,
                borderRadius: "50%",
                background: colors[p.status],
                transform: "translate(-50%,-50%)",
                animation: p.status === "been" ? `pulse 2s ${i * 0.2}s infinite` : "shimmer 3s infinite",
                border: `1.5px solid ${PALETTE.cream}`,
                cursor: "pointer",
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
          {[["been", "Been together"], ["soon", "Planning soon"], ["dream", "One day ✨"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: colors[k] }} />
              <span style={{ fontSize: 11, color: PALETTE.textMuted, fontFamily: "'DM Mono', monospace" }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Day modal ────────────────────────────────────────────────────────────────
function DayModal({ day, onClose, onCollectStamp, collectedStamps }) {
  const [showBreathing, setShowBreathing] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const hasStamp = collectedStamps.includes(day.day);

  const renderContent = () => {
    switch (day.type) {
      case "photo":
        return (
          <div style={{ background: PALETTE.cream, borderRadius: 12, aspectRatio: "4/3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64, marginBottom: 16 }}>
            📸
            <span style={{ position: "absolute", fontSize: 11, ...styles.mono, color: PALETTE.textMuted, bottom: 8 }}>add your photo here</span>
          </div>
        );
      case "giftcard":
        return (
          <div style={{ background: `linear-gradient(135deg, ${PALETTE.brown}, ${PALETTE.navy})`, borderRadius: 16, padding: "24px 20px", marginBottom: 16, color: PALETTE.cream }}>
            <p style={{ ...styles.mono, fontSize: 10, opacity: 0.6, marginBottom: 8 }}>GIFT CARD</p>
            <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, marginBottom: 4 }}>{day.amount}</p>
            <p style={{ fontSize: 13, opacity: 0.8 }}>{day.forWhat}</p>
          </div>
        );
      case "coupon":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {day.coupons.map((c, i) => (
              <div key={i} style={{ background: PALETTE.cream, borderRadius: 10, padding: "10px 14px", borderLeft: `4px solid ${PALETTE.accent}`, fontSize: 13, color: PALETTE.brown }}>
                🎟️ {c}
              </div>
            ))}
          </div>
        );
      case "physical":
        return (
          <div style={{ background: PALETTE.cream, borderRadius: 12, padding: "16px", marginBottom: 16, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>{day.emoji}</div>
            <p style={{ ...styles.mono, fontSize: 11, color: PALETTE.textMuted, marginBottom: 6 }}>WHERE TO FIND IT</p>
            <p style={{ ...styles.body, color: PALETTE.brown }}>{day.hint}</p>
          </div>
        );
      case "playlist":
        return (
          <div style={{ background: PALETTE.dark, borderRadius: 12, padding: 16, marginBottom: 16, textAlign: "center" }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: PALETTE.brown, margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, animation: "spin 4s linear infinite" }}>💿</div>
            <p style={{ ...styles.handwriting, fontSize: 16, color: PALETTE.cream, marginBottom: 12 }}>Songs that make me think of you</p>
            <a href={day.playlistUrl} target="_blank" rel="noreferrer" style={{ ...styles.btn, textDecoration: "none", display: "inline-block" }}>Open playlist ↗</a>
          </div>
        );
      case "talent":
        return (
          <div style={{ background: PALETTE.cream, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <p style={{ ...styles.handwriting, fontSize: 16, lineHeight: 1.9, color: PALETTE.brown }}>{day.talent}</p>
          </div>
        );
      case "movie":
        return (
          <div style={{ background: PALETTE.dark, borderRadius: 12, padding: 16, marginBottom: 16, textAlign: "center" }}>
            <div style={{ fontSize: 52, marginBottom: 10 }}>🎬</div>
            <p style={{ ...styles.handwriting, fontSize: 22, color: PALETTE.cream }}>{day.movie}</p>
          </div>
        );
      case "reflection":
        return (
          <div style={{ background: PALETTE.cream, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            {day.content.split("\n\n").map((para, i) => (
              <p key={i} style={{ ...styles.body, color: PALETTE.brown, marginBottom: i === 0 ? 12 : 0 }}>{para}</p>
            ))}
          </div>
        );
      case "minigame":
        return (
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <button style={{ ...styles.btn, fontSize: 16 }} onClick={() => setShowBreathing(true)}>🐸 Start breathing exercise</button>
          </div>
        );
      case "ai":
        return (
          <div style={{ background: PALETTE.cream, borderRadius: 12, padding: 16, marginBottom: 16, textAlign: "center" }}>
            <div style={{ fontSize: 48 }}>{day.emoji}</div>
            <p style={{ ...styles.body, color: PALETTE.textMuted, fontSize: 13, marginTop: 8 }}>AI-generated image goes here ✨<br /><span style={{ fontSize: 11 }}>(upload your photo to generate)</span></p>
          </div>
        );
      case "map":
        return (
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <button style={styles.btn} onClick={() => setShowMap(true)}>✈️ Open our world map</button>
          </div>
        );
      case "bucketlist":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
            {day.items.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: PALETTE.cream, borderRadius: 8, padding: "8px 12px" }}>
                <span style={{ fontSize: 14, color: PALETTE.accent }}>○</span>
                <span style={{ ...styles.body, fontSize: 13, color: PALETTE.brown }}>{item}</span>
              </div>
            ))}
          </div>
        );
      case "story":
        return (
          <div style={{ background: PALETTE.cream, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <p style={{ ...styles.handwriting, fontSize: 16, lineHeight: 1.9, color: PALETTE.brown }}>
              Add your story here — the one you could tell a hundred times and never get tired of…
            </p>
          </div>
        );
      case "finale":
        return (
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 56, animation: "pulse 1.5s infinite" }}>🎂</div>
            <p style={{ ...styles.handwriting, fontSize: 20, color: PALETTE.brown, marginTop: 12 }}>
              Thank you for being you. Thank you for letting me celebrate you.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div style={styles.overlayDark} onClick={onClose}>
        <div style={{ ...styles.card, maxWidth: 360, maxHeight: "85vh", overflowY: "auto", position: "relative" }} onClick={e => e.stopPropagation()}>
          <button style={{ ...styles.close, position: "absolute", top: 16, right: 16 }} onClick={onClose}>✕</button>
          <p style={{ ...styles.mono, fontSize: 10, color: PALETTE.textMuted, marginBottom: 6 }}>
            DAY {String(day.day).padStart(2, "0")} · JULY 2026
          </p>
          <h2 style={{ ...styles.h2, marginBottom: 16, paddingRight: 24 }}>{day.title}</h2>
          {renderContent()}
          <p style={{ ...styles.handwriting, fontSize: 15, color: PALETTE.brownMid, lineHeight: 1.8, marginBottom: 20, borderTop: `1px solid ${PALETTE.blush}`, paddingTop: 14 }}>
            {day.note}
          </p>
          {!hasStamp ? (
            <button
              style={{ ...styles.btn, background: PALETTE.stamp, color: PALETTE.dark, borderColor: PALETTE.stamp, width: "100%" }}
              onClick={() => onCollectStamp(day.day)}
            >
              🪙 Collect stamp
            </button>
          ) : (
            <div style={{ textAlign: "center", padding: "8px 0", ...styles.mono, fontSize: 12, color: PALETTE.textMuted }}>
              ✓ Stamp collected ·{" "}
              {STAMPS.find(s => s.id === day.day)?.date ?? `2026.07.${String(day.day).padStart(2,"0")}`}
            </div>
          )}
        </div>
      </div>
      {showBreathing && <BreathingGame onClose={() => setShowBreathing(false)} />}
      {showMap && <WorldMap onClose={() => setShowMap(false)} />}
    </>
  );
}

// ─── Draggable item ───────────────────────────────────────────────────────────
function DraggableItem({ item, onMove }) {
  const ref = useRef(null);
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const holdTimer = useRef(null);
  const [locked, setLocked] = useState(true);

  const onStart = useCallback((clientX, clientY) => {
    holdTimer.current = setTimeout(() => {
      setLocked(false);
      dragging.current = true;
      const rect = ref.current.getBoundingClientRect();
      offset.current = { x: clientX - rect.left, y: clientY - rect.top };
    }, 500);
  }, []);

  const onEnd = useCallback(() => {
    clearTimeout(holdTimer.current);
    dragging.current = false;
    setLocked(true);
  }, []);

  const onMoveHandler = useCallback((clientX, clientY) => {
    if (!dragging.current) return;
    const parent = ref.current.parentElement.getBoundingClientRect();
    onMove(item.id, clientX - parent.left - offset.current.x, clientY - parent.top - offset.current.y);
  }, [item.id, onMove]);

  useEffect(() => {
    const mm = e => onMoveHandler(e.clientX, e.clientY);
    const tm = e => onMoveHandler(e.touches[0].clientX, e.touches[0].clientY);
    const up = () => onEnd();
    window.addEventListener("mousemove", mm);
    window.addEventListener("touchmove", tm, { passive: true });
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);
    return () => { window.removeEventListener("mousemove", mm); window.removeEventListener("touchmove", tm); window.removeEventListener("mouseup", up); window.removeEventListener("touchend", up); };
  }, [onMoveHandler, onEnd]);

  return (
    <div
      ref={ref}
      onMouseDown={e => onStart(e.clientX, e.clientY)}
      onTouchStart={e => onStart(e.touches[0].clientX, e.touches[0].clientY)}
      style={{
        position: "absolute",
        left: item.x, top: item.y,
        cursor: locked ? "grab" : "grabbing",
        userSelect: "none",
        transition: locked ? "transform .2s" : "none",
        transform: locked ? "scale(1)" : "scale(1.15)",
        zIndex: locked ? 1 : 10,
      }}
    >
      <div style={{
        background: PALETTE.white, borderRadius: 12, padding: "6px 10px", boxShadow: locked ? "none" : "0 4px 12px rgba(0,0,0,0.15)",
        border: `1px solid ${PALETTE.blush}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
        fontSize: 28,
      }}>
        {item.emoji}
        <span style={{ fontSize: 9, color: PALETTE.textMuted, fontFamily: "'DM Mono', monospace" }}>{item.label}</span>
      </div>
      {!locked && <div style={{ position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)", fontSize: 10, ...styles.mono, color: PALETTE.accent, whiteSpace: "nowrap" }}>drag me!</div>}
    </div>
  );
}

// ─── CD Player ────────────────────────────────────────────────────────────────
function CDPlayer({ playlistUrl }) {
  const [spinning, setSpinning] = useState(false);
  return (
    <div
      onClick={() => setSpinning(s => !s)}
      title="Open playlist"
      style={{ position: "fixed", bottom: 80, right: 16, zIndex: 50, cursor: "pointer" }}
    >
      <a href={playlistUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%", background: `conic-gradient(${PALETTE.brown}, ${PALETTE.navy}, ${PALETTE.olive}, ${PALETTE.brown})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: spinning ? "spin 3s linear infinite" : "none",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          border: `2px solid ${PALETTE.blush}`,
        }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: PALETTE.cream }} />
        </div>
        <div style={{ ...styles.mono, fontSize: 9, textAlign: "center", marginTop: 3, color: PALETTE.textMuted }}>▶ playlist</div>
      </a>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [days, setDays] = useState(DAYS_DATA);
  const [openDay, setOpenDay] = useState(null);
  const [collectedStamps, setCollectedStamps] = useState([]);
  const [showStamps, setShowStamps] = useState(false);
  const [draggables, setDraggables] = useState(DRAGGABLES);
  const [playlistUnlocked, setPlaylistUnlocked] = useState(false);

  const today = new Date();
  const isUnlockable = (dayNum) => {
    const unlockDate = new Date(`2026-07-${String(dayNum).padStart(2, "0")}T08:00:00`);
    if (dayNum === 27) return new Date("2026-07-27T00:00:00") <= today;
    return unlockDate <= today || true; // Remove `|| true` in production
  };

  const handleOpen = (d) => {
    if (!isUnlockable(d.day)) return;
    setOpenDay(d);
    setDays(prev => prev.map(x => x.day === d.day ? { ...x, unlocked: true } : x));
    if (d.day === 9) setPlaylistUnlocked(true);
  };

  const handleCollectStamp = (dayNum) => {
    if (!collectedStamps.includes(dayNum)) {
      setCollectedStamps(prev => [...prev, dayNum]);
    }
  };

  const handleMove = useCallback((id, x, y) => {
    setDraggables(prev => prev.map(d => d.id === id ? { ...d, x, y } : d));
  }, []);

  const getStatus = (d) => {
    if (!isUnlockable(d.day)) return "locked";
    if (collectedStamps.includes(d.day)) return "stamped";
    if (d.unlocked) return "opened";
    return "available";
  };

  const statusStyles = {
    locked: { opacity: 0.4, cursor: "not-allowed", background: "#E8E0D4" },
    available: { cursor: "pointer", background: PALETTE.cream, animation: "pulse 3s infinite" },
    opened: { cursor: "pointer", background: PALETTE.white, borderColor: PALETTE.accent },
    stamped: { cursor: "pointer", background: PALETTE.white, borderColor: PALETTE.stamp },
  };

  if (showIntro) return (
    <>
      <FloatingBg />
      <WelcomeScreen onDone={() => setShowIntro(false)} />
    </>
  );

  return (
    <div style={{ background: PALETTE.bg, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", position: "relative", overflowX: "hidden" }}>
      <FloatingBg />
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500&family=Caveat:wght@500;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "40px 20px 0" }}>
        <p style={{ ...styles.mono, fontSize: 11, color: PALETTE.textMuted, marginBottom: 8, letterSpacing: 2 }}>JULY 2026</p>
        <h1 style={{ ...styles.display, fontSize: 30, marginBottom: 4 }}>for you, my love 🤎</h1>
        <p style={{ ...styles.handwriting, fontSize: 16, color: PALETTE.brownMid, marginBottom: 24 }}>
          27 days of little things, leading up to you.
        </p>
        <Countdown />
        <p style={{ ...styles.body, fontSize: 13, color: PALETTE.textMuted, marginTop: 10 }}>
          until your birthday · 28 July 2026 ♡
        </p>
      </div>

      {/* Stamp nav */}
      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 20, position: "relative", zIndex: 1 }}>
        <button style={{ ...styles.btnSmall, gap: 4, display: "flex", alignItems: "center" }} onClick={() => setShowStamps(true)}>
          🪙 Stamps ({collectedStamps.length})
        </button>
      </div>

      {/* Simple note */}
      <div style={{ maxWidth: 360, margin: "20px auto 0", padding: "0 20px", position: "relative", zIndex: 1 }}>
        <div style={{ background: PALETTE.cream, borderRadius: 14, padding: "14px 16px", borderLeft: `3px solid ${PALETTE.accent}` }}>
          <p style={{ ...styles.handwriting, fontSize: 15, color: PALETTE.brown, lineHeight: 1.8 }}>
            Open a door each morning at 8am. The last one opens at midnight on the 27th. Take your time — there's no rush. ♡
          </p>
        </div>
      </div>

      {/* Calendar grid */}
      <div style={{ maxWidth: 400, margin: "24px auto 0", padding: "0 16px", position: "relative", zIndex: 1 }}>
        <p style={{ ...styles.mono, fontSize: 10, color: PALETTE.textMuted, letterSpacing: 2, marginBottom: 12, textAlign: "center" }}>
          ADVENT CALENDAR · JULY 2026
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {days.map((d) => {
            const status = getStatus(d);
            const isToday = d.day === today.getDate() && today.getMonth() === 6 && today.getFullYear() === 2026;
            return (
              <div
                key={d.day}
                onClick={() => handleOpen(d)}
                style={{
                  borderRadius: 12,
                  border: `1.5px solid ${collectedStamps.includes(d.day) ? PALETTE.stamp : d.unlocked ? PALETTE.accent : PALETTE.blush}`,
                  padding: "10px 6px",
                  textAlign: "center",
                  transition: "transform .15s, box-shadow .15s",
                  position: "relative",
                  ...statusStyles[status],
                  ...(isToday && !d.unlocked ? { boxShadow: `0 0 0 2px ${PALETTE.accent}` } : {}),
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 2 }}>
                  {d.unlocked ? d.emoji : status === "locked" ? "🔒" : "🎁"}
                </div>
                <div style={{ ...styles.mono, fontSize: 10, color: PALETTE.textMuted }}>
                  {String(d.day).padStart(2, "0")}
                </div>
                {collectedStamps.includes(d.day) && (
                  <div style={{ position: "absolute", top: -6, right: -6, background: PALETTE.stamp, borderRadius: "50%", width: 16, height: 16, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>🪙</div>
                )}
                {isToday && (
                  <div style={{ position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)", ...styles.mono, fontSize: 8, color: PALETTE.accent, whiteSpace: "nowrap" }}>today</div>
                )}
              </div>
            );
          })}
          {/* Filler for 28th birthday */}
          <div style={{ borderRadius: 12, border: `1.5px solid ${PALETTE.stamp}`, padding: "10px 6px", textAlign: "center", background: `${PALETTE.stamp}22` }}>
            <div style={{ fontSize: 22, marginBottom: 2 }}>🎂</div>
            <div style={{ ...styles.mono, fontSize: 10, color: PALETTE.accent }}>28</div>
          </div>
        </div>
      </div>

      {/* Draggable items area */}
      <div style={{ maxWidth: 400, margin: "32px auto 0", padding: "0 16px", position: "relative", zIndex: 1 }}>
        <p style={{ ...styles.mono, fontSize: 10, color: PALETTE.textMuted, letterSpacing: 2, marginBottom: 6 }}>HIS FAVOURITE THINGS ↓</p>
        <p style={{ ...styles.body, fontSize: 11, color: PALETTE.textMuted, marginBottom: 8 }}>Hold & drag to rearrange 🖐</p>
        <div style={{ position: "relative", height: 240, background: PALETTE.cream, borderRadius: 16, border: `1px dashed ${PALETTE.blush}`, overflow: "hidden" }}>
          {draggables.map(item => (
            <DraggableItem key={item.id} item={item} onMove={handleMove} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "40px 20px", position: "relative", zIndex: 1 }}>
        <p style={{ ...styles.handwriting, fontSize: 18, color: PALETTE.brownMid }}>made with love, just for you ♡</p>
        <p style={{ ...styles.mono, fontSize: 10, color: PALETTE.textMuted, marginTop: 6 }}>every single pixel</p>
      </div>

      {/* Modals */}
      {openDay && (
        <DayModal
          day={openDay}
          onClose={() => setOpenDay(null)}
          onCollectStamp={handleCollectStamp}
          collectedStamps={collectedStamps}
        />
      )}
      {showStamps && (
        <StampBook
          stamps={STAMPS.filter(s => collectedStamps.includes(s.id))}
          onClose={() => setShowStamps(false)}
        />
      )}
      {playlistUnlocked && <CDPlayer playlistUrl="https://youtube.com/playlist?list=PLxxxxxx" />}
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const styles = {
  display: { fontFamily: "'DM Serif Display', serif", color: PALETTE.dark, fontWeight: 400 },
  handwriting: { fontFamily: "'Caveat', cursive", color: PALETTE.brown },
  body: { fontFamily: "'DM Sans', sans-serif", color: PALETTE.text, margin: 0 },
  mono: { fontFamily: "'DM Mono', monospace", margin: 0 },
  h2: { fontFamily: "'DM Serif Display', serif", fontSize: 20, fontWeight: 400, color: PALETTE.dark, margin: 0 },
  card: {
    background: PALETTE.white, borderRadius: 20, padding: "24px 20px",
    boxShadow: "0 8px 32px rgba(42,37,32,0.12)",
    position: "relative", width: "90%",
  },
  overlay: {
    position: "fixed", inset: 0, background: `${PALETTE.bg}EE`, zIndex: 100,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  overlayDark: {
    position: "fixed", inset: 0, background: "rgba(26,22,16,0.7)", zIndex: 100,
    display: "flex", alignItems: "center", justifyContent: "center",
    backdropFilter: "blur(4px)",
  },
  btn: {
    background: PALETTE.brown, color: PALETTE.cream, border: `1px solid ${PALETTE.brown}`,
    borderRadius: 10, padding: "10px 20px", fontSize: 14, cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  },
  btnSmall: {
    background: "transparent", color: PALETTE.brown, border: `1px solid ${PALETTE.blush}`,
    borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer",
    fontFamily: "'DM Mono', monospace",
  },
  close: {
    background: "transparent", border: "none", fontSize: 18, cursor: "pointer",
    color: PALETTE.textMuted, padding: 4,
  },
};
