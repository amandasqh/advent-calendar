document.addEventListener('DOMContentLoaded', () => {

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const statsGrid = document.getElementById('finale-stats-grid');
    const MESSAGE_COUNT = statsGrid ? Number(statsGrid.dataset.messageCount) || 0 : 0;
    const RELATIONSHIP_START_DATE = statsGrid ? statsGrid.dataset.relationshipStart || null : null;

    function timeTogetherSoFar() {
        if (!RELATIONSHIP_START_DATE) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        const start = new Date(`${RELATIONSHIP_START_DATE}T00:00:00`);
        const diffSeconds = Math.floor(Math.max(0, Date.now() - start.getTime()) / 1000);
        return {
            days: Math.floor(diffSeconds / 86400),
            hours: Math.floor((diffSeconds % 86400) / 3600),
            minutes: Math.floor((diffSeconds % 3600) / 60),
            seconds: diffSeconds % 60,
        };
    }

    function pulse(el) {
        if (!el) return;
        el.classList.remove('is-pulsing');
        void el.offsetWidth;
        el.classList.add('is-pulsing');
    }

    // Odometer-style digit roll: the old value spins up and out while the
    // new one spins up into place from below, like a rotating wheel.
    function rollDigits(mask, text) {
        if (!mask) return;
        const current = mask.querySelector('.countdown__value');
        if (current && current.textContent === text) return;

        const incoming = document.createElement('span');
        incoming.className = 'countdown__value';
        incoming.textContent = text;

        if (!window.gsap || prefersReducedMotion) {
            if (current) current.remove();
            mask.appendChild(incoming);
            return;
        }

        mask.appendChild(incoming);
        gsap.set(incoming, { yPercent: 100 });
        const tl = gsap.timeline({
            onComplete: () => { if (current) current.remove(); },
        });
        if (current) {
            tl.to(current, { yPercent: -100, duration: 0.45, ease: 'power2.inOut' }, 0);
        }
        tl.to(incoming, { yPercent: 0, duration: 0.45, ease: 'power2.inOut' }, 0);
    }

    function animateCountUp(el, target, duration = 1800) {
        if (!el) return;
        const start = performance.now();
        function tick(now) {
            const progress = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(target * eased).toLocaleString();
            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                pulse(el);
            }
        }
        requestAnimationFrame(tick);
    }

    const statMessagesEl = document.getElementById('stat-messages');
    const statDaysEl = document.getElementById('stat-days');
    const statHoursEl = document.getElementById('stat-hours');
    const statMinsEl = document.getElementById('stat-mins');
    const statSecsEl = document.getElementById('stat-secs');
    const statsPoll = document.getElementById('stats-poll');
    const pollFeedback = document.getElementById('stats-poll-feedback');

    function startTimeTicker() {
        if (!statDaysEl || !statHoursEl || !statMinsEl || !statSecsEl) return;
        function tick() {
            const { days, hours, minutes, seconds } = timeTogetherSoFar();
            const daysStr = String(days).padStart(3, '0');
            const hoursStr = String(hours).padStart(2, '0');
            const minsStr = String(minutes).padStart(2, '0');
            const secsStr = String(seconds).padStart(2, '0');

            rollDigits(statDaysEl, daysStr);
            rollDigits(statHoursEl, hoursStr);
            rollDigits(statMinsEl, minsStr);
            rollDigits(statSecsEl, secsStr);
        }
        tick();
        setInterval(tick, 1000);
    }

    function revealStats() {
        if (!statsGrid) return;
        statsGrid.classList.add('is-revealed');
        animateCountUp(statMessagesEl, MESSAGE_COUNT);
        startTimeTicker();
    }

    if (statsGrid) {
        const POLL_SEEN_KEY = 'finaleStatsPollSeen';
        const alreadySeenPoll = localStorage.getItem(POLL_SEEN_KEY) === '1';

        if (statsPoll && !alreadySeenPoll) {
            const steps = Array.from(statsPoll.querySelectorAll('[data-poll-step]'));
            const stepCount = new Set(steps.map((el) => el.dataset.pollStep)).size;
            let currentStep = 0;

            function showStep(step) {
                steps.forEach((el) => { el.hidden = Number(el.dataset.pollStep) !== step; });
            }

            function finishPoll() {
                localStorage.setItem(POLL_SEEN_KEY, '1');
                statsPoll.classList.add('is-done');
                setTimeout(() => {
                    statsPoll.hidden = true;
                    revealStats();
                }, 900);
            }

            statsPoll.querySelectorAll('.stats-poll__option').forEach((btn) => {
                btn.addEventListener('click', () => {
                    const [min, max] = btn.dataset.range.split('-').map(Number);
                    const actual = currentStep === 0 ? MESSAGE_COUNT : timeTogetherSoFar().days;
                    if (pollFeedback) {
                        pollFeedback.textContent = actual >= min && actual <= max
                            ? 'ooh, spot on 👀'
                            : "hehe, not quite -- let's see...";
                    }
                    currentStep += 1;
                    if (currentStep >= stepCount) {
                        finishPoll();
                    } else {
                        showStep(currentStep);
                    }
                });
            });

            showStep(0);
        } else {
            if (statsPoll) statsPoll.hidden = true;
            if ('IntersectionObserver' in window) {
                const statsObserver = new IntersectionObserver((entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            revealStats();
                            statsObserver.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.4 });
                statsObserver.observe(statsGrid);
            } else {
                revealStats();
            }
        }
    }

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

    // Little hearts that puff out from the cursor as it moves (desktop, mouse only).
    const cursorTrail = document.getElementById('finale-cursor-trail');
    if (cursorTrail && window.gsap && !prefersReducedMotion && window.matchMedia('(pointer: fine)').matches) {
        const trailSymbols = ['💗', '💕', '💖', '♡', '💓'];
        let lastSpawn = 0;
        window.addEventListener('pointermove', (e) => {
            if (e.pointerType && e.pointerType !== 'mouse') return;
            const now = performance.now();
            if (now - lastSpawn < 50) return;
            lastSpawn = now;

            const heart = document.createElement('span');
            heart.className = 'cursor-heart';
            heart.textContent = trailSymbols[Math.floor(Math.random() * trailSymbols.length)];
            heart.style.left = `${e.clientX}px`;
            heart.style.top = `${e.clientY}px`;
            cursorTrail.appendChild(heart);

            gsap.fromTo(heart, {
                scale: 0.5 + Math.random() * 0.4,
                opacity: 1,
                rotate: (Math.random() - 0.5) * 30,
            }, {
                y: -26 - Math.random() * 24,
                x: (Math.random() - 0.5) * 26,
                scale: 0,
                opacity: 0,
                rotate: (Math.random() - 0.5) * 90,
                duration: 0.7 + Math.random() * 0.4,
                ease: 'power1.out',
                onComplete: () => heart.remove(),
            });
        }, { passive: true });
    }

    function splitIntoWords(el) {
        const text = el.textContent;
        el.textContent = '';
        const frag = document.createDocumentFragment();
        const words = text.split(' ').filter(Boolean);
        words.forEach((word, i) => {
            const span = document.createElement('span');
            span.className = 'finale-word';
            span.textContent = word + (i < words.length - 1 ? ' ' : '');
            frag.appendChild(span);
        });
        el.appendChild(frag);
        return el.querySelectorAll('.finale-word');
    }

    if (window.gsap && window.ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
    }

    if (window.gsap && window.ScrollTrigger && !prefersReducedMotion) {
        // Hero: title flies in word-by-word, eyebrow/subcopy ease in around it.
        gsap.from('.finale-eyebrow', { opacity: 0, y: -14, duration: 0.7, ease: 'power2.out' });
        const heroTitleEl = document.querySelector('.finale-hero-title');
        if (heroTitleEl) {
            const words = splitIntoWords(heroTitleEl);
            gsap.from(words, {
                opacity: 0,
                y: 40,
                rotate: 6,
                duration: 0.9,
                stagger: 0.08,
                ease: 'back.out(1.6)',
                delay: 0.15,
            });
        }
        gsap.from('.finale-hero-sub', { opacity: 0, y: 14, duration: 0.8, delay: 0.7, ease: 'power2.out' });
        gsap.from('.finale-scroll-cue', { opacity: 0, duration: 1, delay: 1.1 });

        // Scrapbook notes + polaroids settle into their tilted resting angle instead of
        // just fading up, so they feel tossed/pinned into place.
        document.querySelectorAll('[data-reveal]').forEach((el) => {
            const isNote = el.classList.contains('scrap-note');
            const isPolaroid = el.classList.contains('polaroid');

            if (isNote || isPolaroid) {
                const siblingIndex = Array.from(el.parentElement.children).indexOf(el);
                const isOddChild = siblingIndex % 2 === 0; // matches CSS :nth-child(odd)
                const baseRotate = isNote ? (isOddChild ? -2 : 2) : (isOddChild ? -4 : 3);
                const wobble = isOddChild ? -8 : 8;

                gsap.fromTo(el, {
                    opacity: 0,
                    y: 40,
                    scale: 0.88,
                    rotate: baseRotate + wobble,
                }, {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    rotate: baseRotate,
                    duration: 1,
                    ease: 'back.out(1.5)',
                    scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' },
                });
            } else {
                gsap.fromTo(el, { opacity: 0, y: 30 }, {
                    opacity: 1,
                    y: 0,
                    duration: 0.9,
                    ease: 'power2.out',
                    scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' },
                });
            }
        });

        gsap.to('.finale-hero-title', {
            yPercent: -20,
            ease: 'none',
            scrollTrigger: {
                trigger: '.finale-hero',
                start: 'top top',
                end: 'bottom top',
                scrub: true,
            },
        });

        // Big parallax drift for whole sections, layered at different depths.
        gsap.utils.toArray('.finale-scrapbook, .finale-polaroids, .finale-stats').forEach((section, i) => {
            gsap.to(section, {
                yPercent: i % 2 === 0 ? -6 : 6,
                ease: 'none',
                scrollTrigger: {
                    trigger: section,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                },
            });
        });

        // Each polaroid drifts at its own speed for depth, on top of its settle-in tilt.
        gsap.utils.toArray('.polaroid').forEach((polaroid, i) => {
            gsap.to(polaroid, {
                yPercent: i % 2 === 0 ? -16 : 16,
                ease: 'none',
                scrollTrigger: {
                    trigger: polaroid,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                },
            });

            const img = polaroid.querySelector('img');
            if (img) {
                gsap.timeline({
                    scrollTrigger: {
                        trigger: polaroid,
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: true,
                    },
                })
                    .fromTo(img, { scale: 0.85 }, { scale: 1.12, ease: 'none' })
                    .to(img, { scale: 0.85, ease: 'none' });
            }
        });

        // The very last photo gets the same grow/shrink breathing effect.
        const finalImg = document.getElementById('final-img');
        if (finalImg) {
            gsap.timeline({
                scrollTrigger: {
                    trigger: finalImg,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                },
            })
                .fromTo(finalImg, { scale: 0.85 }, { scale: 1.08, ease: 'none' })
                .to(finalImg, { scale: 0.85, ease: 'none' });
        }

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
        document.querySelectorAll('[data-reveal]').forEach((el) => {
            el.style.opacity = 1;
            el.style.transform = 'none';
        });
    }

    const loopRow = document.getElementById('finale-loop-row');
    if (loopRow) {
        loopRow.innerHTML += loopRow.innerHTML;
    }

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

    const flame = document.getElementById('cake-flame');
    const tapHint = document.getElementById('finale-tap-hint');
    const finalTitle = document.getElementById('finale-final-title');

    function revealFinalTitle() {
        if (finalTitle) finalTitle.classList.add('is-revealed');
    }

    function hideFinalTitle() {
        if (finalTitle) finalTitle.classList.remove('is-revealed');
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

    if (window.gsap && window.ScrollTrigger && finalTitle) {
        ScrollTrigger.create({
            trigger: finalTitle,
            start: 'top 80%',
            onEnter: revealFinalTitle,
            onLeaveBack: hideFinalTitle,
        });
    }
});
