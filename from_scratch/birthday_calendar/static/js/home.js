document.addEventListener('DOMContentLoaded', () => {
    const title = document.querySelector('h1');
    if (title && window.gsap) {
        gsap.from(title, { duration: 1, opacity: 0, y: 20, ease: 'power3.out' });
    }

    var typewriter = new Typewriter('#typewriter', {
        loop: true,
        delay: 60
    });
    typewriter
        .pauseFor(1000)
        .typeString('Thank you for coming into my life!')
        .pauseFor(1000)
        .deleteAll()
        .typeString('Here\'s a little something for you...')
        .pauseFor(500)
        .deleteChars(3)
        .typeString(' and me...')
        .pauseFor(1000)
        .deleteAll()
        .typeString('<strong>Hope you like it!</strong>')
        .pauseFor(2000)
        .start();

    var zones = document.querySelectorAll(".mag-zone");
    var zone = zones[0];
    var btn = zone.querySelector(".mag-btn");
    var strength = 0.4;
    zone.addEventListener("mousemove", (e) => {
    const rect = zone.getBoundingClientRect();
    const x = gsap.utils.mapRange(rect.left, rect.right,-rect.width / 2, rect.width / 2, e.clientX);
    const y = gsap.utils.mapRange(rect.top, rect.bottom,-rect.height / 2, rect.height / 2, e.clientY);

    gsap.to(btn, {
        x: x * strength,
        y: y * strength,
        duration: 0.4,
        ease: "power2.out",
        overwrite: true
    });
    });

    zone.addEventListener("mouseleave", () => {
    gsap.to(btn, { 
        x: 0, 
        y: 0,
        duration: 0.7,
        ease: "elastic.out(1, 0.4)",
        overwrite: true
    });
    });

    const buttons = document.querySelector('.buttons');
    if (buttons) {
        setTimeout(() => {
            buttons.style.visibility = 'visible';
            gsap.from(buttons, {
                duration: 1,
                opacity: 0,
                y: 20,
                ease: 'power3.out',
                onComplete: () => {
                    // a gentle "notice me" breathing pulse, independent of the
                    // magnetic-follow tween (which animates x/y, not scale)
                    gsap.to(btn, {
                        scale: 1.05,
                        duration: 1.3,
                        ease: 'sine.inOut',
                        yoyo: true,
                        repeat: -1,
                    });
                },
            });
        }, 10000);
    }
});