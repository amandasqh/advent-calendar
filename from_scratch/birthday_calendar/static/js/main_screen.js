document.addEventListener('DOMContentLoaded', () => {

    // -----------------------------------------------------------------
    // CSRF helper (Django same-origin fetch calls)
    // -----------------------------------------------------------------
    const CSRF_TOKEN = document.querySelector('meta[name="csrf-token"]')?.content || '';

    function apiPost(url, body) {
        return fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': CSRF_TOKEN,
            },
            body: JSON.stringify(body || {}),
        }).then((res) => res.json()).catch(() => null);
    }

    // -----------------------------------------------------------------
    // Floating background symbols
    // -----------------------------------------------------------------
    const page = document.querySelector('.main-screen');
    const floatingLayer = document.querySelector('.floating-bg');

    if (page && floatingLayer) {
        const symbols = ['♡', '✿', '🌷', '☁️', '✦', '✨'];
        for (let i = 0; i < 16; i += 1) {
            const dot = document.createElement('span');
            dot.textContent = symbols[i % symbols.length];
            dot.style.left = `${Math.random() * 100}%`;
            dot.style.top = `${Math.random() * 100}%`;
            dot.style.fontSize = `${0.9 + Math.random() * 1.3}rem`;
            dot.style.animationDelay = `${Math.random() * 6}s`;
            dot.style.animationDuration = `${10 + Math.random() * 10}s`;
            floatingLayer.appendChild(dot);
        }
    }

    // -----------------------------------------------------------------
    // Countdown
    // -----------------------------------------------------------------
    const countdown = document.getElementById('countdown');
    const targetDate = new Date('2026-07-24T00:00:00+08:00');

    function animateDigit(id, value) {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.textContent === value) return;
        el.classList.remove('is-flipping');
        void el.offsetWidth;
        el.textContent = value;
        el.classList.add('is-flipping');
    }

    function updateCountdown() {
        const now = new Date();
        const diff = targetDate - now;

        if (diff <= 0) {
            ['days', 'hours', 'minutes', 'seconds'].forEach((id) => animateDigit(id, '00'));
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        animateDigit('days', String(days).padStart(2, '0'));
        animateDigit('hours', String(hours).padStart(2, '0'));
        animateDigit('minutes', String(minutes).padStart(2, '0'));
        animateDigit('seconds', String(seconds).padStart(2, '0'));
    }

    if (countdown) {
        updateCountdown();
        setInterval(updateCountdown, 1000);
    }

    // -----------------------------------------------------------------
    // Boxes / progress
    // -----------------------------------------------------------------
    const boxes = Array.from(document.querySelectorAll('.table-item'));
    const surface = document.getElementById('table-surface');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const progressCard = document.querySelector('.progress-card');
    const totalBoxes = boxes.length;
    const progressState = { pct: 0 };
    const todayIndex = parseInt(surface?.dataset.todayIndex || '0', 10);

    // -----------------------------------------------------------------
    // Mobile layout: below this width, boxes render as a plain grid
    // instead of the draggable overlapping pile (see main_screen.css
    // `.is-mobile-grid` -- the pile only peeks ~34px per card on a phone
    // screen, so almost everything stays hidden until dragged apart).
    // -----------------------------------------------------------------
    const MOBILE_GRID_BREAKPOINT = 700;
    function isMobileLayout() {
        return window.innerWidth <= MOBILE_GRID_BREAKPOINT;
    }
    const mobileGridActive = isMobileLayout();
    if (surface && mobileGridActive) {
        surface.classList.add('is-mobile-grid');
        const hint = document.querySelector('.table-hint');
        if (hint) hint.textContent = 'Tap a box to open it ✨';
    }

    function currentUnlockedCount() {
        return boxes.filter((box) => box.classList.contains('state-opened')).length;
    }

    function updateProgress() {
        const unlockedCount = currentUnlockedCount();
        const percent = totalBoxes ? Math.round((unlockedCount / totalBoxes) * 100) : 0;

        if (progressText) {
            progressText.textContent = `${unlockedCount}/${totalBoxes}`;
        }

        if (progressBar) {
            if (window.gsap) {
                gsap.to(progressState, {
                    pct: percent,
                    duration: 0.8,
                    ease: 'power2.out',
                    onUpdate: () => {
                        progressBar.style.width = `${progressState.pct}%`;
                    },
                });
            } else {
                progressBar.style.width = `${percent}%`;
            }
        }

        if (progressCard) {
            progressCard.classList.toggle('is-complete', percent >= 100);
        }
    }

    // -----------------------------------------------------------------
    // Default "stack" layout for boxes with no saved position yet.
    // First 12 days pile up on the left, last 12 on the right -- day 1
    // (and day 13) sit on top of their pile so they're easy to grab first.
    // -----------------------------------------------------------------
    function layoutStackPositions() {
        if (!surface) return;
        const rect = surface.getBoundingClientRect();
        const itemW = boxes[0] ? boxes[0].getBoundingClientRect().width : 120;
        const itemH = boxes[0] ? boxes[0].getBoundingClientRect().height : 150;
        const leftBaseX = 16;
        const rightBaseX = Math.max(leftBaseX, rect.width - itemW - 16);
        const baseY = 24;
        const cascade = 34;

        // Saved positions are absolute pixels from whatever viewport they were
        // dragged on, so clamp into the CURRENT surface bounds -- otherwise a
        // desktop-dragged item can land off-canvas on a narrower one.
        const maxX = Math.max(4, rect.width - itemW - 4);
        const maxY = Math.max(4, rect.height - itemH - 4);

        boxes.forEach((box) => {
            const number = parseInt(box.dataset.number, 10);
            const hasSaved = box.dataset.hasSavedPosition === 'true';
            const isLeft = number <= totalBoxes / 2;
            const stackIndex = isLeft ? number - 1 : number - 1 - totalBoxes / 2;

            let x, y;
            if (hasSaved) {
                x = parseFloat(box.style.getPropertyValue('--x')) || 0;
                y = parseFloat(box.style.getPropertyValue('--y')) || 0;
                x = Math.min(Math.max(x, 4), maxX);
                y = Math.min(Math.max(y, 4), maxY);
            } else {
                x = (isLeft ? leftBaseX : rightBaseX) + (stackIndex % 3) * 6;
                y = baseY + stackIndex * cascade;
            }

            const rotation = hasSaved ? 0 : (stackIndex % 2 === 0 ? -4 : 4) - (isLeft ? 2 : -2);
            const zIndex = hasSaved ? 5 : 200 - stackIndex;

            gsap.set(box, { x, y, rotation, zIndex });
        });
    }

    // -----------------------------------------------------------------
    // Draggable + position persistence
    // -----------------------------------------------------------------
    function initDraggable() {
        if (!boxes.length || typeof Draggable === 'undefined') return;
        gsap.registerPlugin(Draggable);
        const itemWidth = boxes[0].getBoundingClientRect().width || 88;
        const itemHeight = boxes[0].getBoundingClientRect().height || 88;

        boxes.forEach((box) => {
            Draggable.create(box, {
                type: 'x,y',
                bounds: surface,
                onPress() {
                    box.classList.add('is-dragging');
                },
                onRelease() {
                    box.classList.remove('is-dragging');
                    const parentRect = surface.getBoundingClientRect();
                    const clampedX = Math.max(4, Math.min(this.x, parentRect.width - itemWidth - 4));
                    const clampedY = Math.max(4, Math.min(this.y, parentRect.height - itemHeight - 4));
                    gsap.to(box, { x: clampedX, y: clampedY, duration: 0.3, ease: 'power2.out' });
                    box.dataset.hasSavedPosition = 'true';
                    apiPost('/api/save-position/', {
                        number: parseInt(box.dataset.number, 10),
                        x: clampedX,
                        y: clampedY,
                    });
                },
            });
        });
    }

    // -----------------------------------------------------------------
    // Stamp collection (unchanged mechanics from the original build)
    // -----------------------------------------------------------------
    const modal = document.getElementById('modal');
    const stampModal = document.getElementById('stamp-modal');
    const stampModalClose = document.getElementById('stamp-modal-close');
    const stampModalImage = document.getElementById('stamp-modal-image');
    const stampModalTitle = document.getElementById('stamp-modal-title');
    const stampModalBody = document.getElementById('stamp-modal-body');
    const stampModalDate = document.getElementById('stamp-modal-date');
    const stampTrigger = document.getElementById('stamp-trigger');
    const stampCount = document.getElementById('stamp-count');
    const stampCollectionModal = document.getElementById('stamp-collection-modal');
    const stampCollectionClose = document.getElementById('stamp-collection-close');
    const stampCollectionList = document.getElementById('stamp-collection-list');

    const collectedStamps = [];
    let pendingStamp = null;

    function showStampModal(stamp) {
        if (!stampModal) return;
        stampModalImage.src = stamp.image;
        stampModalImage.alt = stamp.title;
        stampModalTitle.textContent = stamp.title;
        stampModalBody.textContent = stamp.body;
        stampModalDate.textContent = stamp.date;
        stampModal.classList.remove('d-none');
        if (window.gsap) gsap.fromTo(stampModal, { opacity: 0 }, { opacity: 1, duration: 0.5 });
        fireStampConfetti();
    }

    function addStampToCollection(stamp) {
        if (!stamp || collectedStamps.some((entry) => entry.title === stamp.title)) return;
        collectedStamps.push(stamp);
        if (stampCount) stampCount.textContent = collectedStamps.length;
        renderStampCollection();
    }

    function renderStampCollection() {
        if (!stampCollectionList) return;
        stampCollectionList.innerHTML = '';
        if (!collectedStamps.length) {
            stampCollectionList.innerHTML = '<p class="subcopy">No stamps yet. Keep opening your little surprises.</p>';
            return;
        }
        collectedStamps.forEach((stamp) => {
            const item = document.createElement('div');
            item.className = 'stamp-collection-item';
            item.innerHTML = `
        <img src="${stamp.image}" alt="${stamp.title}" />
        <div>
          <strong>${stamp.title}</strong>
          <p class="fst-italic">${stamp.body}</p>
        </div>`;
            stampCollectionList.appendChild(item);
        });
    }

    function maybeQueueStamp(box) {
        if (box.dataset.stamp !== 'true') return;
        pendingStamp = {
            title: box.dataset.stampTitle || 'Little stamp',
            body: box.dataset.stampBody || 'A sweet keepsake for your collection.',
            image: box.dataset.stampImage || '',
            date: box.dataset.stampDate || '',
        };
    }

    // Boxes that were already opened in a PREVIOUS session/device should
    // show up in the mailbox immediately on load -- without replaying the
    // "new stamp!" popup or confetti, since nothing new just happened.
    function restoreCollectedStampsFromServer() {
        boxes.forEach((box) => {
            if (box.dataset.stamp === 'true' && box.dataset.state === 'opened') {
                addStampToCollection({
                    title: box.dataset.stampTitle || 'Little stamp',
                    body: box.dataset.stampBody || 'A sweet keepsake for your collection.',
                    image: box.dataset.stampImage || '',
                    date: box.dataset.stampDate || '',
                });
            }
        });
    }

    function releasePendingStampIfAny() {
        if (pendingStamp) {
            const stamp = pendingStamp;
            pendingStamp = null;
            addStampToCollection(stamp);
            showStampModal(stamp);
        }
    }

    if (stampModalClose) {
        stampModalClose.addEventListener('click', () => {
            stampModal.classList.add('d-none');
            if (stampTrigger && window.gsap) {
                gsap.fromTo(stampTrigger, { scale: 1 }, { scale: 1.2, duration: 0.3, yoyo: true, repeat: 3 });
            }
        });
    }
    if (stampModal) {
        stampModal.addEventListener('click', (e) => { if (e.target === stampModal) stampModal.classList.add('d-none'); });
    }
    if (stampTrigger) {
        stampTrigger.addEventListener('click', () => stampCollectionModal.classList.remove('d-none'));
    }
    if (stampCollectionClose) {
        stampCollectionClose.addEventListener('click', () => stampCollectionModal.classList.add('d-none'));
    }
    if (stampCollectionModal) {
        stampCollectionModal.addEventListener('click', (e) => { if (e.target === stampCollectionModal) stampCollectionModal.classList.add('d-none'); });
    }

    // -----------------------------------------------------------------
    // Generic modal helpers (open/close with a small gsap fade)
    // -----------------------------------------------------------------
    function openBackdrop(el) {
        if (!el) return;
        el.classList.remove('d-none');
        if (window.gsap) gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.35 });
    }
    function closeBackdrop(el) {
        if (!el) return;
        el.classList.add('d-none');
    }

    function wireBackdropClose(el, onClose) {
        if (!el) return;
        el.addEventListener('click', (e) => {
            if (e.target === el) {
                closeBackdrop(el);
                if (onClose) onClose();
            }
        });
        const closeBtn = el.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                closeBackdrop(el);
                if (onClose) onClose();
            });
        }
    }

    // ============================ Generic modal (photo/others) ============================
    const modalTitle = document.getElementById('modal-title');
    const modalEmoji = document.getElementById('modal-emoji');
    const modalBody = document.getElementById('modal-body');
    const modalPhotoGrid = document.getElementById('modal-photo-grid');
    wireBackdropClose(modal, releasePendingStampIfAny);

    function openGenericModal(content) {
        modalTitle.textContent = content.title || 'A little surprise';
        modalEmoji.textContent = content.emoji || '💌';
        modalBody.textContent = content.body || '';
        modalPhotoGrid.innerHTML = '';
        (content.images || []).forEach((src) => {
            const img = document.createElement('img');
            img.src = `/static/${src}`;
            img.alt = content.title || 'photo';
            modalPhotoGrid.appendChild(img);
        });
        openBackdrop(modal);
    }

    // ============================ Gift modal (shake to reveal) ============================
    const giftModal = document.getElementById('gift-modal');
    const giftModalTitle = document.getElementById('gift-modal-title');
    const giftModalBody = document.getElementById('gift-modal-body');
    const giftShakeStage = document.getElementById('gift-shake-stage');
    const giftBoxArt = document.getElementById('gift-box-art');
    const giftShakeFill = document.getElementById('gift-shake-fill');
    const giftReveal = document.getElementById('gift-reveal');

    // Coupon-day reveals get the "usual" confetti.
    function fireCouponConfetti() {
        if (typeof confetti !== 'function') return;
        confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 }, colors: ['#5aa9e6', '#d4a5a5', '#e8c988', '#a9c0a0'] });
    }

    // Gift-day reveals get their own distinct look: a punchier, wider burst
    // with little gift-box-ish confetti pieces, fired from lower on the
    // screen (as if popping out of the box) instead of the coupon's rain-down.
    function fireGiftConfetti() {
        if (typeof confetti !== 'function') return;
        const giftShape = typeof confetti.shapeFromText === 'function'
            ? confetti.shapeFromText({ text: '🎁', scalar: 2.4 })
            : null;
        const defaults = {
            spread: 100,
            startVelocity: 42,
            gravity: 1.1,
            ticks: 200,
            scalar: 1,
            shapes: giftShape ? ['square', 'circle', giftShape] : ['square', 'circle'],
            colors: ['#ff9f6b', '#e8c988', '#a9c0a0', '#7B9FB8', '#C3B6D6'],
        };
        confetti(Object.assign({}, defaults, { particleCount: 60, angle: 60, origin: { x: 0.25, y: 0.85 } }));
        confetti(Object.assign({}, defaults, { particleCount: 60, angle: 120, origin: { x: 0.75, y: 0.85 } }));
        confetti(Object.assign({}, defaults, { particleCount: 40, angle: 90, origin: { x: 0.5, y: 0.7 } }));
    }

    // A gentler burst -- stars + tiny hearts -- for the little stamp
    // collectible moments, so it reads as a keepsake, not a big reward.
    function fireStampConfetti() {
        if (typeof confetti !== 'function') return;
        const heartShape = typeof confetti.shapeFromText === 'function'
            ? confetti.shapeFromText({ text: '💗', scalar: 2.2 })
            : null;
        confetti({
            particleCount: 20,
            spread: 55,
            startVelocity: 20,
            gravity: 0.7,
            scalar: 0.85,
            ticks: 130,
            origin: { y: 0.65 },
            shapes: heartShape ? ['star', heartShape] : ['star'],
            colors: ['#e8c988', '#d4a5a5', '#7B9FB8'],
        });
    }

    // ---- Shake-to-reveal mini-game -----------------------------------
    let giftMeter = 0;
    let giftRevealed = false;
    let giftPressed = false;
    let giftLastPoint = null;
    let giftDecayInterval = null;
    let giftMotionBaseline = null;
    let giftListenersBound = false;

    function pointFromEvent(e) {
        const p = e.touches && e.touches[0] ? e.touches[0] : e;
        return { x: p.clientX, y: p.clientY };
    }

    function addGiftShake(amount) {
        if (giftRevealed) return;
        giftMeter = Math.min(100, giftMeter + amount);
        if (giftShakeFill) giftShakeFill.style.width = `${giftMeter}%`;
        if (window.gsap && giftBoxArt) {
            const kick = (giftMeter / 100) * 14;
            gsap.to(giftBoxArt, {
                rotation: (Math.random() > 0.5 ? 1 : -1) * kick,
                duration: 0.08,
                ease: 'power1.out',
            });
        }
        if (giftMeter >= 100) revealGift();
    }

    function onGiftPressStart(e) {
        if (giftRevealed) return;
        giftPressed = true;
        giftLastPoint = pointFromEvent(e);
        // Give immediate feedback the instant they press down, rather than
        // waiting for them to also successfully drag -- this is the bit
        // that felt "broken" before: nothing happened until a big enough
        // movement registered, so the first press or two felt dead.
        addGiftShake(6);
    }
    function onGiftPointerMove(e) {
        if (!giftPressed || giftRevealed) return;
        const point = pointFromEvent(e);
        if (giftLastPoint) {
            const dist = Math.hypot(point.x - giftLastPoint.x, point.y - giftLastPoint.y);
            // A floor on top of the distance-based gain, so even small,
            // slow, "warming up" movements clearly move the meter instead
            // of quietly losing to the decay timer.
            addGiftShake(Math.min(Math.max(dist * 0.35, 1.5), 14));
        }
        giftLastPoint = point;
    }
    function onGiftPressEnd() {
        giftPressed = false;
        giftLastPoint = null;
    }

    function onGiftDeviceMotion(e) {
        if (giftRevealed) return;
        const a = e.accelerationIncludingGravity || e.acceleration;
        if (!a) return;
        const magnitude = Math.abs(a.x || 0) + Math.abs(a.y || 0) + Math.abs(a.z || 0);
        if (giftMotionBaseline === null) { giftMotionBaseline = magnitude; return; }
        const delta = Math.abs(magnitude - giftMotionBaseline);
        giftMotionBaseline = magnitude;
        if (delta > 3) addGiftShake(Math.min(delta * 1.6, 9));
    }

    function bindGiftListeners() {
        if (giftListenersBound || !giftBoxArt) return;
        giftListenersBound = true;
        giftBoxArt.addEventListener('mousedown', onGiftPressStart);
        window.addEventListener('mousemove', onGiftPointerMove);
        window.addEventListener('mouseup', onGiftPressEnd);
        giftBoxArt.addEventListener('touchstart', (e) => {
            onGiftPressStart(e);
            // iOS 13+ requires an explicit, gesture-triggered permission request.
            if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
                DeviceMotionEvent.requestPermission().catch(() => {});
            }
        }, { passive: true });
        giftBoxArt.addEventListener('touchmove', onGiftPointerMove, { passive: true });
        giftBoxArt.addEventListener('touchend', onGiftPressEnd);
        window.addEventListener('devicemotion', onGiftDeviceMotion);

        giftDecayInterval = setInterval(() => {
            if (giftRevealed) return;
            giftMeter = Math.max(0, giftMeter - 1.5);
            if (giftShakeFill) giftShakeFill.style.width = `${giftMeter}%`;
        }, 120);
    }

    function unbindGiftListeners() {
        if (!giftListenersBound) return;
        giftListenersBound = false;
        window.removeEventListener('mousemove', onGiftPointerMove);
        window.removeEventListener('mouseup', onGiftPressEnd);
        window.removeEventListener('devicemotion', onGiftDeviceMotion);
        if (giftDecayInterval) clearInterval(giftDecayInterval);
        giftDecayInterval = null;
    }

    function revealGift() {
        if (giftRevealed) return;
        giftRevealed = true;
        unbindGiftListeners();
        if (window.gsap) {
            gsap.to(giftShakeStage, {
                opacity: 0,
                scale: 0.9,
                duration: 0.3,
                onComplete: () => {
                    giftShakeStage.classList.add('d-none');
                    giftReveal.classList.remove('d-none');
                    gsap.from(giftReveal, { opacity: 0, y: 18, duration: 0.5, ease: 'back.out(1.6)' });
                },
            });
        } else {
            giftShakeStage.classList.add('d-none');
            giftReveal.classList.remove('d-none');
        }
        fireGiftConfetti();
    }

    function resetGiftMinigame() {
        giftMeter = 0;
        giftRevealed = false;
        giftMotionBaseline = null;
        if (giftShakeFill) giftShakeFill.style.width = '0%';
        if (giftBoxArt && window.gsap) gsap.set(giftBoxArt, { rotation: 0 });
        if (giftShakeStage) { giftShakeStage.classList.remove('d-none'); giftShakeStage.style.opacity = 1; giftShakeStage.style.transform = 'none'; }
        if (giftReveal) giftReveal.classList.add('d-none');
    }

    wireBackdropClose(giftModal, () => { unbindGiftListeners(); releasePendingStampIfAny(); });

    function openGiftModal(content, isFirstOpen) {
        giftModalTitle.textContent = content.title || 'A gift for you';
        giftModalBody.textContent = content.body || '';

        if (isFirstOpen) {
            resetGiftMinigame();
            bindGiftListeners();
        } else {
            // Already opened before -- no need to make them shake it again.
            giftRevealed = true;
            unbindGiftListeners();
            giftShakeStage.classList.add('d-none');
            giftReveal.classList.remove('d-none');
        }
        openBackdrop(giftModal);
    }

    // ============================ Coupon modal (scratch-to-reveal) ============================
    const couponModal = document.getElementById('coupon-modal');
    const couponModalTitle = document.getElementById('coupon-modal-title');
    const couponModalBody = document.getElementById('coupon-modal-body');
    const couponScratchList = document.getElementById('coupon-scratch-list');
    wireBackdropClose(couponModal, releasePendingStampIfAny);

    function buildScratchCard(src, alreadyRevealed) {
        const item = document.createElement('div');
        item.className = 'coupon-scratch-item' + (alreadyRevealed ? ' is-revealed' : '');

        const img = document.createElement('img');
        img.className = 'coupon-art';
        img.src = `/static/${src}`;
        img.alt = 'Coupon';
        item.appendChild(img);

        if (!alreadyRevealed) {
            couponModalTitle.style.visibility = 'hidden';
            couponModalBody.style.visibility = 'hidden';

            const canvas = document.createElement('canvas');
            item.appendChild(canvas);

            requestAnimationFrame(() => {
                const rect = item.getBoundingClientRect();
                canvas.width = rect.width;
                canvas.height = rect.height;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#c9b6a3';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'rgba(255,255,255,0.85)';
                ctx.font = `${Math.max(14, canvas.width * 0.06)}px "Atkinson Hyperlegible Mono", sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText('scratch me ✨', canvas.width / 2, canvas.height / 2);

                let isDown = false;
                let revealed = false;

                function scratchAt(clientX, clientY) {
                    const r = canvas.getBoundingClientRect();
                    const x = clientX - r.left;
                    const y = clientY - r.top;
                    ctx.globalCompositeOperation = 'destination-out';
                    ctx.beginPath();
                    ctx.arc(x, y, 22, 0, Math.PI * 2);
                    ctx.fill();
                }

                function checkRevealProgress() {
                    if (revealed) return;
                    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                    let cleared = 0;
                    for (let i = 3; i < data.length; i += 4 * 12) {
                        if (data[i] === 0) cleared += 1;
                    }
                    const sampleCount = Math.ceil(data.length / (4 * 12));
                    if (cleared / sampleCount > 0.2) {
                        revealed = true;
                        item.classList.add('is-revealed');
                        fireCouponConfetti();
                        couponModalTitle.style.visibility = 'visible';
                        couponModalBody.style.visibility = 'visible';
                    }
                }

                function pointerDown(e) {
                    isDown = true;
                    const p = e.touches ? e.touches[0] : e;
                    scratchAt(p.clientX, p.clientY);
                }
                function pointerMove(e) {
                    if (!isDown) return;
                    e.preventDefault();
                    const p = e.touches ? e.touches[0] : e;
                    scratchAt(p.clientX, p.clientY);
                    checkRevealProgress();
                }
                function pointerUp() { isDown = false; checkRevealProgress(); }

                canvas.addEventListener('mousedown', pointerDown);
                canvas.addEventListener('mousemove', pointerMove);
                window.addEventListener('mouseup', pointerUp);
                canvas.addEventListener('touchstart', pointerDown, { passive: true });
                canvas.addEventListener('touchmove', pointerMove, { passive: false });
                canvas.addEventListener('touchend', pointerUp);
            });
        }

        return item;
    }

    function openCouponModal(content, isFirstOpen) {
        couponModalTitle.textContent = content.title || 'Scratch to reveal';
        couponModalBody.textContent = content.body || '';
        couponScratchList.innerHTML = '';
        (content.coupons || []).forEach((src) => {
            couponScratchList.appendChild(buildScratchCard(src, !isFirstOpen));
        });
        openBackdrop(couponModal);
    }

    // ============================ Letter modal ============================
    const letterModal = document.getElementById('letter-modal');
    const letterModalTitle = document.getElementById('letter-modal-title');
    const letterModalDate = document.getElementById('letter-modal-date');
    const letterModalBody = document.getElementById('letter-modal-body');
    wireBackdropClose(letterModal, releasePendingStampIfAny);

    function openLetterModal(content) {
        const paragraphs = content.letter || [content.body || ''];
        letterModalTitle.textContent = paragraphs[0] && paragraphs[0].endsWith(',') ? paragraphs[0] : 'Dear Mossy,';
        const rest = paragraphs[0] && paragraphs[0].endsWith(',') ? paragraphs.slice(1) : paragraphs;
        letterModalDate.textContent = new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
        letterModalBody.innerHTML = '';
        rest.forEach((line) => {
            const p = document.createElement('p');
            p.textContent = line;
            letterModalBody.appendChild(p);
        });
        openBackdrop(letterModal);
        if (window.gsap) {
            gsap.from(letterModalBody.children, { opacity: 0, y: 16, stagger: 0.15, duration: 0.6, ease: 'power2.out', delay: 0.15 });
        }
    }

    // ============================ Bucket list modal (day 10) ============================
    // Items live server-side in SiteState (see views.py _get_bucket_items),
    // seeded from BOX_CONTENT but reorderable/extendable from here on --
    // each item has a stable `id` so checked-state and order both survive
    // edits. `bucketItems` mirrors the server's current list locally so
    // reorder/add can re-render immediately without a round trip.
    const bucketlistModal = document.getElementById('bucketlist-modal');
    const bucketlistTitle = document.getElementById('bucketlist-modal-title');
    const bucketlistBody = document.getElementById('bucketlist-modal-body');
    const bucketlistProgress = document.getElementById('bucketlist-progress');
    const bucketlistItemsEl = document.getElementById('bucketlist-items');
    const bucketlistAddForm = document.getElementById('bucketlist-add-form');
    const bucketlistAddEmoji = document.getElementById('bucketlist-add-emoji');
    const bucketlistAddText = document.getElementById('bucketlist-add-text');
    wireBackdropClose(bucketlistModal, releasePendingStampIfAny);

    let bucketItems = [];
    let bucketChecked = new Set();

    function renderBucketlist() {
        bucketlistItemsEl.innerHTML = '';
        bucketItems.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'bucketlist-item' + (bucketChecked.has(item.id) ? ' is-checked' : '');
            row.dataset.id = item.id;

            const moveWrap = document.createElement('span');
            moveWrap.className = 'bucketlist-item__move';

            const upBtn = document.createElement('button');
            upBtn.type = 'button';
            upBtn.className = 'bucketlist-item__move-btn';
            upBtn.textContent = '▲';
            upBtn.setAttribute('aria-label', 'Move up');
            upBtn.disabled = index === 0;
            upBtn.addEventListener('click', (e) => { e.stopPropagation(); moveBucketItem(index, -1); });

            const downBtn = document.createElement('button');
            downBtn.type = 'button';
            downBtn.className = 'bucketlist-item__move-btn';
            downBtn.textContent = '▼';
            downBtn.setAttribute('aria-label', 'Move down');
            downBtn.disabled = index === bucketItems.length - 1;
            downBtn.addEventListener('click', (e) => { e.stopPropagation(); moveBucketItem(index, 1); });

            moveWrap.append(upBtn, downBtn);

            const emoji = document.createElement('span');
            emoji.className = 'bucketlist-item__emoji';
            emoji.textContent = item.emoji || '✨';

            const text = document.createElement('span');
            text.className = 'bucketlist-item__text';
            text.textContent = item.text || '';

            const check = document.createElement('button');
            check.type = 'button';
            check.className = 'bucketlist-item__check';
            check.textContent = '✓';
            check.setAttribute('aria-label', 'Mark as done');
            check.addEventListener('click', () => toggleBucketChecked(item.id, row, check));

            row.append(moveWrap, emoji, text, check);
            bucketlistItemsEl.appendChild(row);
        });
        updateBucketlistProgress();
    }

    function toggleBucketChecked(id, row, check) {
        const nowChecked = row.classList.toggle('is-checked');
        if (nowChecked) {
            bucketChecked.add(id);
            if (window.gsap) gsap.fromTo(check, { scale: 0 }, { scale: 1.15, duration: 0.3, ease: 'back.out(3)' });
        } else {
            bucketChecked.delete(id);
        }
        updateBucketlistProgress();
        apiPost('/api/bucket-list/', { id });
    }

    function moveBucketItem(index, delta) {
        const target = index + delta;
        if (target < 0 || target >= bucketItems.length) return;
        [bucketItems[index], bucketItems[target]] = [bucketItems[target], bucketItems[index]];
        renderBucketlist();
        apiPost('/api/bucket-list/reorder/', { order: bucketItems.map((item) => item.id) });
    }

    function updateBucketlistProgress() {
        if (bucketlistProgress) bucketlistProgress.textContent = `${bucketChecked.size}/${bucketItems.length} dreams marked ✨`;
    }

    if (bucketlistAddForm) {
        bucketlistAddForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = bucketlistAddText.value.trim();
            if (!text) return;
            const emoji = bucketlistAddEmoji.value.trim();
            const submitBtn = bucketlistAddForm.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;
            apiPost('/api/bucket-list/add/', { text, emoji }).then((res) => {
                if (res && res.ok) {
                    bucketItems = res.items;
                    bucketlistAddText.value = '';
                    bucketlistAddEmoji.value = '';
                    renderBucketlist();
                }
            }).finally(() => {
                if (submitBtn) submitBtn.disabled = false;
            });
        });
    }

    function openBucketlistModal(content) {
        bucketlistTitle.textContent = content.title || 'Our bucket list';
        bucketlistBody.textContent = content.body || '';

        fetch('/api/state/').then((r) => r.json()).then((state) => {
            bucketItems = state.bucket_items || [];
            bucketChecked = new Set(state.bucket_checked || []);
            renderBucketlist();
        }).catch(() => {
            bucketItems = [];
            bucketChecked = new Set();
            renderBucketlist();
        });

        openBackdrop(bucketlistModal);
    }

    // ============================ World map modal (day 18) ============================
    // Rendered with jsVectorMap (https://www.jsvectormap.com/) -- a small,
    // dependency-free SVG world map. This is a fixed, curated set of pins
    // (not session/session-toggle based), matching a specific real list:
    // visited, an upcoming trip, and a shared bucket list.
    const mapModal = document.getElementById('map-modal');
    wireBackdropClose(mapModal, releasePendingStampIfAny);

    const MAP_MARKERS = [
        { name: 'Kuala Lumpur', note: 'Visited 💚', coords: [3.139, 101.6869], style: { fill: '#9DBE8F' } },
        { name: 'Penang', note: 'Visited 💚', coords: [5.4141, 100.3288], style: { fill: '#9DBE8F' } },
        { name: 'Japan', note: 'Upcoming trip! ✈️', coords: [36.2048, 138.2529], style: { fill: '#E8C988' } },
        { name: 'Canada', note: 'On our bucket list 💭', coords: [56.1304, -106.3468], style: { fill: '#C3B6D6' } },
        { name: 'New Zealand', note: 'On our bucket list 💭', coords: [-40.9006, 174.8860], style: { fill: '#C3B6D6' } },
        { name: 'USA', note: 'On our bucket list 💭', coords: [37.0902, -95.7129], style: { fill: '#C3B6D6' } },
        { name: 'London', note: 'On our bucket list 💭', coords: [51.5072, -0.1276], style: { fill: '#C3B6D6' } },
        { name: 'South Korea', note: 'On our bucket list 💭', coords: [35.9078, 127.7669], style: { fill: '#C3B6D6' } },
    ];

    let worldMapInstance = null;

    function openMapModal() {
        openBackdrop(mapModal);
        // jsVectorMap needs a visible, laid-out container to measure --
        // build it lazily, the first time this modal is actually opened.
        if (!worldMapInstance && window.jsVectorMap) {
            requestAnimationFrame(() => {
                worldMapInstance = new jsVectorMap({
                    selector: '#jvm-world-map',
                    map: 'world',
                    zoomButtons: true,
                    zoomOnScroll: false,
                    showTooltip: true,
                    regionStyle: {
                        initial: { fill: '#dbe9f5', stroke: '#ffffff', strokeWidth: 0.5 },
                        hover: { fill: '#bcdcf5' },
                    },
                    markersSelectable: false,
                    markerStyle: {
                        initial: { fill: '#5F7F96', stroke: '#fff', 'stroke-width': 2, r: 6 },
                        hover: { fill: '#5F7F96' },
                    },
                    markers: MAP_MARKERS,
                    // Build a name + short description tooltip. jsVectorMap's
                    // Tooltip API has changed slightly across versions, so we
                    // try each known method rather than assume one.
                    onMarkerTooltipShow(event, tooltip, index) {
                        const marker = MAP_MARKERS[index];
                        if (!marker) return;
                        const html = `<strong>${marker.name}</strong><span>${marker.note || ''}</span>`;
                        if (typeof tooltip.text === 'function') {
                            tooltip.text(html, true);
                        } else if (typeof tooltip.getElement === 'function') {
                            tooltip.getElement().innerHTML = html;
                        } else if (tooltip.selector) {
                            tooltip.selector.innerHTML = html;
                        }
                    },
                });
            });
        }
    }

    // ============================ Breathing modal ============================
    const breathingModal = document.getElementById('breathing-modal');
    const breathingCircle = document.getElementById('breathing-circle');
    const breathingInstruction = document.getElementById('breathing-instruction');
    const breathingAffirmation = document.getElementById('breathing-affirmation');
    const breathingToggle = document.getElementById('breathing-toggle');
    wireBackdropClose(breathingModal, () => stopBreathing());

    const AFFIRMATIONS = [
        'You are allowed to slow down.',
        'This feeling will pass.',
        'You are safe right now.',
        'One breath at a time.',
        'You are doing better than you think.',
    ];

    let breathingTl = null;
    let breathingRunning = false;
    let leavesInterval = null;

    // A gentle, continuous drift of leaves -- adapted from canvas-confetti's
    // own "snow" recipe (one particle at a time, near-zero velocity, soft
    // gravity) but with leaf shapes/colors instead of snow.
    function startFallingLeaves() {
        if (typeof confetti !== 'function' || leavesInterval) return;
        const leafShape = typeof confetti.shapeFromText === 'function'
            ? confetti.shapeFromText({ text: '🍃', scalar: 1.8 })
            : null;
        let skew = 1;
        leavesInterval = setInterval(() => {
            skew = Math.max(0.8, skew - 0.002);
            confetti({
                particleCount: 1,
                startVelocity: 0,
                ticks: 320,
                origin: { x: Math.random(), y: (Math.random() * skew) - 0.2 },
                colors: ['#A9C0A0', '#9DBE8F', '#E8C988'],
                shapes: leafShape ? [leafShape] : ['circle'],
                gravity: 0.45 + Math.random() * 0.2,
                scalar: 0.7 + Math.random() * 0.6,
                drift: (Math.random() - 0.5) * 0.8,
                disableForReducedMotion: true,
            });
        }, 220);
    }

    function stopFallingLeaves() {
        if (leavesInterval) {
            clearInterval(leavesInterval);
            leavesInterval = null;
        }
    }

    function startBreathing() {
        if (!window.gsap) return;
        breathingRunning = true;
        breathingToggle.textContent = 'Stop';
        let affirmationIndex = 0;
        breathingAffirmation.textContent = AFFIRMATIONS[0];
        startFallingLeaves();

        breathingTl = gsap.timeline({ repeat: -1, onRepeat: () => {
            affirmationIndex = (affirmationIndex + 1) % AFFIRMATIONS.length;
            breathingAffirmation.textContent = AFFIRMATIONS[affirmationIndex];
        } });
        breathingTl
            .call(() => { breathingInstruction.textContent = 'Breathe in...'; })
            .to(breathingCircle, { scale: 1.6, duration: 4, ease: 'sine.inOut' })
            .call(() => { breathingInstruction.textContent = 'Hold...'; })
            .to(breathingCircle, { scale: 1.6, duration: 7 })
            .call(() => { breathingInstruction.textContent = 'Breathe out...'; })
            .to(breathingCircle, { scale: 1, duration: 8, ease: 'sine.inOut' });
    }

    function stopBreathing() {
        breathingRunning = false;
        if (breathingTl) { breathingTl.kill(); breathingTl = null; }
        if (window.gsap) gsap.to(breathingCircle, { scale: 1, duration: 0.6 });
        breathingInstruction.textContent = 'Ready?';
        breathingToggle.textContent = 'Start';
        stopFallingLeaves();
    }

    if (breathingToggle) {
        breathingToggle.addEventListener('click', () => {
            if (breathingRunning) stopBreathing(); else startBreathing();
        });
    }

    function openBreathingModal() {
        stopBreathing();
        openBackdrop(breathingModal);
    }

    // ============================ Finale modal ============================
    const finaleModal = document.getElementById('finale-modal');
    wireBackdropClose(finaleModal, releasePendingStampIfAny);

    function openFinaleModal() {
        openBackdrop(finaleModal);
    }

    // -----------------------------------------------------------------
    // Long-press peek: holding down on a still-locked box gives a little
    // "opens in N days" hint instead of just shake-and-reject on tap.
    // -----------------------------------------------------------------
    function showLockedPeek(box) {
        const number = parseInt(box.dataset.number, 10);
        const daysLeft = Math.max(1, number - todayIndex);
        const inner = box.querySelector('.table-item__inner');
        if (!inner) return;

        let bubble = inner.querySelector('.peek-bubble');
        if (!bubble) {
            bubble = document.createElement('span');
            bubble.className = 'peek-bubble';
            inner.appendChild(bubble);
        }
        bubble.textContent = daysLeft === 1 ? 'opens tomorrow 👀' : `opens in ${daysLeft} days`;
        bubble.classList.add('is-visible');

        if (window.gsap) {
            gsap.fromTo(inner, { scale: 1 }, { scale: 1.06, duration: 0.22, yoyo: true, repeat: 1, ease: 'sine.inOut' });
        }

        clearTimeout(bubble._hideTimer);
        bubble._hideTimer = setTimeout(() => bubble.classList.remove('is-visible'), 1600);
    }

    function bindLongPressPreview(box) {
        let pressTimer = null;
        let justPeeked = false;

        const start = () => {
            if (box.dataset.state !== 'locked') return;
            pressTimer = setTimeout(() => {
                justPeeked = true;
                showLockedPeek(box);
            }, 480);
        };
        const cancel = () => clearTimeout(pressTimer);

        box.addEventListener('touchstart', start, { passive: true });
        box.addEventListener('touchend', cancel);
        box.addEventListener('touchmove', cancel);
        box.addEventListener('mousedown', start);
        box.addEventListener('mouseup', cancel);
        box.addEventListener('mouseleave', cancel);

        // Capture phase, so this runs before the click handler below and
        // can swallow the click that naturally follows a long-press --
        // otherwise a peek would immediately also trigger the shake-reject.
        box.addEventListener('click', (e) => {
            if (justPeeked) {
                justPeeked = false;
                e.stopPropagation();
            }
        }, true);
    }

    // -----------------------------------------------------------------
    // "Day X opened today!" toast -- only for the box that unlocked today,
    // as a little extra nudge/reward for opening it same-day.
    // -----------------------------------------------------------------
    const dayToast = document.getElementById('day-toast');
    let dayToastTimer = null;
    function showDayToast(number) {
        if (!dayToast) return;
        dayToast.textContent = `Day ${number} opened today! 🎉`;
        dayToast.classList.add('is-visible');
        clearTimeout(dayToastTimer);
        dayToastTimer = setTimeout(() => dayToast.classList.remove('is-visible'), 2600);
    }

    // -----------------------------------------------------------------
    // Box click dispatch
    // -----------------------------------------------------------------
    function markOpenedLocally(box) {
        box.classList.remove('state-available', 'state-locked');
        box.classList.add('state-opened');
        box.dataset.state = 'opened';
        updateProgress();
    }

    boxes.forEach((box) => {
        bindLongPressPreview(box);
        box.addEventListener('click', (e) => {
            // A drag that ends as a tiny move can still fire a click -- ignore
            // clicks that immediately follow a drag release.
            if (box.classList.contains('is-dragging')) return;

            const state = box.dataset.state;
            if (state === 'locked') {
                box.classList.add('is-shaking');
                setTimeout(() => box.classList.remove('is-shaking'), 450);
                return;
            }

            let content = {};
            try { content = JSON.parse(box.dataset.content || '{}'); } catch (err) { content = {}; }
            const type = box.dataset.type;
            const isFirstOpen = state !== 'opened';

            switch (type) {
                case 'photo':
                case 'others':
                    openGenericModal(content);
                    break;
                case 'gift':
                    openGiftModal(content, isFirstOpen);
                    break;
                case 'coupon':
                    openCouponModal(content, isFirstOpen);
                    break;
                case 'letter':
                    openLetterModal(content);
                    break;
                case 'bucketlist':
                    openBucketlistModal(content);
                    break;
                case 'map':
                    openMapModal();
                    break;
                case 'breathing':
                    openBreathingModal();
                    break;
                case 'finale':
                    openFinaleModal();
                    break;
                default:
                    openGenericModal(content);
            }

            if (isFirstOpen) {
                const number = parseInt(box.dataset.number, 10);
                maybeQueueStamp(box);
                markOpenedLocally(box);
                apiPost('/api/open-box/', { number });
                if (number === todayIndex) {
                    showDayToast(number);
                }
                if (number === 6) {
                    revealMusicIframeLive();
                }
            }
        });
    });


    const musicIframe = document.getElementById('music-iframe');
    let musicExpanded = false;
    let musicBounceInterval = null;

    function revealMusicIframeLive() {
        if (!musicIframe || !musicIframe.classList.contains('is-locked')) return;
        musicIframe.classList.remove('is-locked');
        if (window.gsap) {
            gsap.fromTo(musicIframe,
                { opacity: 0, scale: 0.3 },
                { opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(1.7)', delay: 0.3 });
        }
        startMusicIdleBounce();
    }

    function startMusicIdleBounce() {
        if (!musicIframe || musicBounceInterval) return;
        musicBounceInterval = setInterval(() => {
            if (musicExpanded) return; // don't jiggle it while someone's using it
            musicIframe.classList.remove('is-bouncing');
            void musicIframe.offsetWidth; // restart the CSS animation
            musicIframe.classList.add('is-bouncing');
        }, 14000);
    }

    if (musicIframe) {
        window.addEventListener('message', (event) => {
            if (!event.data) return;

            if (event.data.type === 'music-player-resize') {
                musicExpanded = !!event.data.expanded;
                if (event.data.expanded) {
                    musicIframe.style.height = 'min(680px, 90vh)';
                } else {
                    musicIframe.style.height = `${event.data.height}px`;
                }
                musicIframe.classList.add('is-ready');
            }

            if (event.data.type === 'music-player-clip' && event.data.inset) {
                const { top, right, bottom, left } = event.data.inset;
                musicIframe.style.clipPath = `inset(${top}px ${right}px ${bottom}px ${left}px round 12px)`;
            }
        });

        if (!musicIframe.classList.contains('is-locked')) {
            // Already unlocked on a previous visit -- show up right away,
            // just with the idle bounce (no big entrance replay).
            startMusicIdleBounce();
        }
    }

    // -----------------------------------------------------------------
    // Init
    // -----------------------------------------------------------------
    if (!mobileGridActive) {
        layoutStackPositions();
        initDraggable();
    }
    updateProgress();
    restoreCollectedStampsFromServer();
    renderStampCollection();
    if (stampCount) stampCount.textContent = collectedStamps.length;

    if (!mobileGridActive) {
        window.addEventListener('load', () => layoutStackPositions());
    }

    // -----------------------------------------------------------------
    // A couple of small idle flourishes
    // -----------------------------------------------------------------
    const heroLogo = document.querySelector('.hero-logo');
    if (heroLogo && window.gsap) {
        gsap.to(heroLogo, {
            rotate: 8,
            duration: 1.6,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
            transformOrigin: '50% 90%',
        });
    }

    if (stampTrigger && window.gsap) {
        gsap.to(stampTrigger, {
            y: -6,
            duration: 1.1,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
            delay: 1,
        });
    }

    window.addEventListener('resize', () => {
        // Crossing the mobile/desktop breakpoint (e.g. rotating a phone)
        // changes which layout mode should be active -- simplest correct
        // fix is a reload, since switching live would mean tearing down
        // and rebuilding GSAP Draggable instances mid-session.
        if (isMobileLayout() !== mobileGridActive) {
            location.reload();
            return;
        }
        // Re-run stack layout only for boxes that were never dragged/saved,
        // so a resize doesn't fight with something the person moved on purpose.
        if (!mobileGridActive) layoutStackPositions();
    });
});
