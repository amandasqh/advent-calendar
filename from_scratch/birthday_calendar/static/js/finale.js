document.addEventListener('DOMContentLoaded', () => {

    // -----------------------------------------------------------------
    // Floating hearts, drifting up the whole page
    // -----------------------------------------------------------------
    const heartsLayer = document.getElementById('finale-hearts');
    const heartSymbols = ['💗', '💕', '💖', '♡'];

    function spawnHeart() {
        if (!heartsLayer) return;
        const heart = document.createElement('span');
        heart.textContent = heartSymbols[Math.floor(Math.random() * heartSymbols.length)];
        heart.style.left = `${Math.random() * 100}%`;
        heart.style.fontSize = `${0.9 + Math.random() * 1.4}rem`;
        const duration = 8 + Math.random() * 8;
        heart.style.animationDuration = `${duration}s`;
        heartsLayer.appendChild(heart);
        setTimeout(() => heart.remove(), duration * 1000 + 200);
    }

    for (let i = 0; i < 10; i += 1) {
        setTimeout(spawnHeart, i * 400);
    }
    setInterval(spawnHeart, 1200);

    // -----------------------------------------------------------------
    // Scroll-triggered reveals (scrapbook notes + polaroids)
    // -----------------------------------------------------------------
    if (window.gsap && window.ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);

        document.querySelectorAll('[data-reveal]').forEach((el, i) => {
            gsap.to(el, {
                opacity: 1,
                y: 0,
                duration: 0.9,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                },
            });
        });

        // gentle parallax on the hero title
        const heroTitle = document.querySelector('.finale-hero-title');
        if (heroTitle) {
            gsap.to(heroTitle, {
                yPercent: -20,
                ease: 'none',
                scrollTrigger: {
                    trigger: '.finale-hero',
                    start: 'top top',
                    end: 'bottom top',
                    scrub: true,
                },
            });
        }

        // photo reel drifts slightly with scroll for a subtle parallax feel
        gsap.to('#finale-loop-row', {
            xPercent: -5,
            ease: 'none',
            scrollTrigger: {
                trigger: '.finale-loop-section',
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
            },
        });
    } else {
        // No GSAP/ScrollTrigger available -- just show everything.
        document.querySelectorAll('[data-reveal]').forEach((el) => {
            el.style.opacity = 1;
            el.style.transform = 'none';
        });
    }

    // -----------------------------------------------------------------
    // Seamless infinite loop: duplicate the row once so the CSS animation
    // (translateX -50%) never shows a gap.
    // -----------------------------------------------------------------
    const loopRow = document.getElementById('finale-loop-row');
    if (loopRow) {
        loopRow.innerHTML += loopRow.innerHTML;
    }

    // -----------------------------------------------------------------
    // Confetti recipes (adapted from canvas-confetti's own examples),
    // themed to the site's palette instead of the default red/white.
    // -----------------------------------------------------------------
    const THEME_COLORS = ['#5aa9e6', '#d4a5a5', '#e8c988', '#a9c0a0', '#C3B6D6'];

    function schoolPrideBurst(durationMs = 1600) {
        if (typeof confetti !== 'function') return;
        const end = Date.now() + durationMs;
        (function frame() {
            confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: THEME_COLORS });
            confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: THEME_COLORS });
            if (Date.now() < end) requestAnimationFrame(frame);
        })();
    }

    function fireworksBurst(durationMs = 2600) {
        if (typeof confetti !== 'function') return;
        const animationEnd = Date.now() + durationMs;
        const defaults = { startVelocity: 28, spread: 360, ticks: 60, zIndex: 0, colors: THEME_COLORS };
        function randomInRange(min, max) { return Math.random() * (max - min) + min; }
        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 45 * (timeLeft / durationMs);
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
    }

    function celebrateCandleBlowOut() {
        schoolPrideBurst(1400);
        setTimeout(() => fireworksBurst(2600), 500);
    }

    // -----------------------------------------------------------------
    // Candle: tap/click to "blow out" and make a wish
    // -----------------------------------------------------------------
    const flame = document.getElementById('cake-flame');
    const tapHint = document.getElementById('finale-tap-hint');
    const finalTitle = document.getElementById('finale-final-title');

    function revealFinalTitle() {
        if (finalTitle) finalTitle.classList.add('is-revealed');
    }

    if (flame) {
        flame.parentElement.addEventListener('click', () => {
            if (flame.classList.contains('is-blown-out')) return;
            flame.classList.add('is-blown-out');
            if (tapHint) tapHint.classList.add('is-hidden');
            celebrateCandleBlowOut();
            revealFinalTitle();

            const cake = document.querySelector('.cake');
            if (cake && window.gsap) {
                gsap.fromTo(cake, { rotate: -4 }, { rotate: 4, duration: 0.12, repeat: 5, yoyo: true, ease: 'sine.inOut', transformOrigin: '50% 100%', onComplete: () => gsap.set(cake, { rotate: 0 }) });
            }
        });
    } else {
        revealFinalTitle();
    }

    // Reveal the final title anyway once it scrolls into view, in case the
    // person never taps the candle.
    if (window.gsap && window.ScrollTrigger && finalTitle) {
        ScrollTrigger.create({
            trigger: finalTitle,
            start: 'top 80%',
            onEnter: revealFinalTitle,
        });
    }
});
