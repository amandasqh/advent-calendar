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
        gsap.set(paragraphs, { opacity: 0.25, color: 'var(--ink-soft)' });

        var tl = gsap.timeline({
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
            ease: 'power2.out',
            duration: 0.2
        }, 0)
        .to(body, {
            opacity: 1,
            y: 0,
            ease: 'power2.out',
            duration: 0.15
        }, 0.05);

        // Reveal spread across a fixed fraction of the scroll range (not each
        // paragraph's own viewport position) so every line finishes by the
        // bottom of the page regardless of letter length.
        if (paragraphs.length) {
            var revealStart = 0.3;
            var revealEnd = 0.85;
            var step = paragraphs.length > 1 ? (revealEnd - revealStart) / (paragraphs.length - 1) : 0;
            var lineDuration = Math.min(0.35, step * 0.9 || 0.35);
            paragraphs.forEach(function (p, i) {
                tl.to(p, {
                    opacity: 1,
                    color: 'var(--ink)',
                    duration: lineDuration,
                    ease: 'sine.inOut'
                }, revealStart + i * step);
            });
        }

        tl.to(nav, {
            opacity: 1,
            y: 0,
            ease: 'power2.out',
            duration: 0.1
        }, 0.92);

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