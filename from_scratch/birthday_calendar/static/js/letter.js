document.addEventListener('DOMContentLoaded', () => {
    var card = document.getElementById('letter-card');
    var wrap = document.querySelector('.letter-wrap');
    var body = document.getElementById('letter-body');
    var nav = document.querySelector('.letter-page__nav');
    var paragraphs = body ? Array.from(body.querySelectorAll('p')) : [];
    var tapes = document.querySelectorAll('.tape');
    var continueBtn = document.getElementById('letter-continue-btn');

    if (window.gsap && tapes.length) {
        gsap.from(tapes, {
            y: -50,
            opacity: 0,
            rotate: '+=20',
            duration: 0.9,
            ease: 'back.out(1.7)',
            stagger: 0.18,
            delay: 0.15,
        });
    }

    if(window.gsap && window.ScrollTrigger && card && wrap && body && nav){
        gsap.set(card, {
            opacity: 1,
            transformOrigin: 'center center'
        });

        gsap.from(card, {
            opacity: 0,
            rotateY: -8,
            scale: 0.97,
            duration: 0.9,
            ease: 'power2.out',
            delay: 0.1
        });

        gsap.set(body, { opacity: 0, y: 48 });
        gsap.set(nav, { opacity: 0, y: 24 });

        gsap.timeline({
            scrollTrigger: {
                trigger: '.letter-page',
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1
            }
        })
        .to(wrap, {
            width: '100%',
            maxWidth: '1200px',
            ease: 'power2.out'
        }, 0)
        .to(body, {
            opacity: 1,
            y: 0,
            ease: 'power2.out'
        }, 0.06)
        .to(nav, {
            opacity: 1,
            y: 0,
            ease: 'power2.out'
        }, 0.94);

        gsap.to(card, {
            yPercent: -4,
            rotateX: 3,
            scrollTrigger: {
                trigger: '.letter-page',
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1
            }
        });
    }

    // -----------------------------------------------------------------
    // Karaoke-style line reveal: each paragraph starts small/dim, then
    // pops into an accent color at full size as it scrolls into view --
    // like a lyric being "sung" as you reach it -- before settling into
    // its normal readable color. Scrolling back up un-reveals it again,
    // so the highlight always tracks where you actually are in the letter
    // instead of firing everything within one narrow chunk of scroll.
    // -----------------------------------------------------------------
    if (window.gsap && window.ScrollTrigger && paragraphs.length) {
        gsap.set(paragraphs, { opacity: 0.2, scale: 0.92, color: 'var(--ink-soft)' });

        paragraphs.forEach((p) => {
            var pop = gsap.timeline({ paused: true })
                .to(p, { opacity: 1, scale: 1.08, color: 'var(--blush-pink-dk)', duration: 0.35, ease: 'back.out(2)' })
                .to(p, { scale: 1, color: 'var(--ink)', duration: 0.3, ease: 'power2.out' });

            ScrollTrigger.create({
                trigger: p,
                start: 'top 75%',
                end: 'bottom 45%',
                onEnter: function () { pop.play(0); },
                onEnterBack: function () { pop.play(0); },
                onLeaveBack: function () {
                    gsap.to(p, { opacity: 0.2, scale: 0.92, color: 'var(--ink-soft)', duration: 0.3, ease: 'power2.out' });
                },
            });
        });
    }

    if (window.gsap && continueBtn) {
        gsap.to(continueBtn, {
            y: -10,
            duration: 0.55,
            ease: 'power1.inOut',
            yoyo: true,
            repeat: -1,
        });
        continueBtn.addEventListener('mouseenter', () => {
            gsap.fromTo(continueBtn, { scale: 1 }, { scale: 1.15, duration: 0.3, yoyo: true, repeat: 1, ease: 'back.out(3)' });
        });
    }
});