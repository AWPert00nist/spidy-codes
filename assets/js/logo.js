/* SB logo: pointer tilt, click burst + spin, orbiting dots, and a hint that invites people to play */
(function () {
    var wrap = document.querySelector('#intro .image.logo-anim');
    if (!wrap) return;
    var img = wrap.querySelector('img');
    if (!img) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var COLORS = ['#6c63ff', '#00c6ff', '#ff6ec7', '#ffd166', '#2ee6a6'];

    // gradient ring as a real element so hover/click can ramp its speed smoothly (no jump)
    var ring = document.createElement('span');
    ring.className = 'logo-ring';
    wrap.insertBefore(ring, wrap.firstChild);
    wrap.classList.add('has-ring');
    var ringAnim = (!reduce && ring.animate) ? ring.animate(
        [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
        { duration: 6000, iterations: Infinity }) : null;
    var rate = 1, target = 1;
    function ramp() {
        if (!ringAnim) return;
        rate += (target - rate) * 0.08;
        ringAnim.playbackRate = rate;
        if (Math.abs(target - rate) > 0.01) requestAnimationFrame(ramp); else { rate = target; ringAnim.playbackRate = rate; }
    }
    function setSpeed(v) { target = v; ramp(); }
    wrap.addEventListener('pointerenter', function () { setSpeed(6); ring.style.filter = 'drop-shadow(0 0 8px rgba(108,99,255,0.8))'; });
    wrap.addEventListener('pointerleave', function () { setSpeed(1); ring.style.filter = ''; });

    // decorations
    var orbit = document.createElement('span');
    orbit.className = 'logo-orbit';
    orbit.innerHTML = '<i></i><i></i><i></i>';
    wrap.appendChild(orbit);

    var hint = document.createElement('span');
    hint.className = 'logo-hint';
    hint.textContent = 'Tap me ✨';
    wrap.appendChild(hint);

    var clicks = 0, interacted = false, hideTimer;
    var messages = ['Again! 🚀', 'Keep going 🎉', 'Move your mouse over it too 👀', 'You’re a natural 😎'];

    function say(text) {
        hint.textContent = text;
        hint.classList.remove('hide');
        clearTimeout(hideTimer);
        hideTimer = setTimeout(function () { hint.classList.add('hide'); }, 3500);
    }

    function burst(x, y) {
        if (reduce || !wrap.animate) return;
        for (var i = 0; i < 18; i++) {
            var d = document.createElement('span');
            d.className = 'logo-spark';
            d.style.background = COLORS[i % COLORS.length];
            if (x != null) { d.style.left = x + 'px'; d.style.top = y + 'px'; }
            wrap.appendChild(d);
            var ang = (Math.PI * 2 * i) / 18 + Math.random() * 0.4;
            var dist = 90 + Math.random() * 90;
            var anim = d.animate([
                { transform: 'translate(0,0) scale(1)', opacity: 1 },
                { transform: 'translate(' + Math.cos(ang) * dist + 'px,' + Math.sin(ang) * dist + 'px) scale(0)', opacity: 0 }
            ], { duration: 700 + Math.random() * 400, easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)' });
            anim.onfinish = (function (el) { return function () { el.remove(); }; })(d);
        }
    }

    // spin/wobble use the Web Animations API so the CSS entrance animation is never re-triggered
    var busy = false;
    function play(frames, opts, done) {
        if (reduce || busy || !img.animate) return;
        busy = true;
        img.style.transform = '';
        var a = img.animate(frames, opts);
        a.onfinish = a.oncancel = function () { busy = false; if (done) done(); };
    }
    function spin() {
        play([
            { transform: 'rotate(0deg) scale(1)' },
            { transform: 'rotate(180deg) scale(1.12)', offset: 0.5 },
            { transform: 'rotate(360deg) scale(1)' }
        ], { duration: 900, easing: 'cubic-bezier(0.5, 0, 0.2, 1)' });
    }
    function wobble() {
        play([
            { transform: 'rotate(0deg)' }, { transform: 'rotate(-9deg)' }, { transform: 'rotate(8deg)' },
            { transform: 'rotate(-5deg)' }, { transform: 'rotate(3deg)' }, { transform: 'rotate(0deg)' }
        ], { duration: 800, easing: 'ease-in-out' });
    }

    // pointer tilt (mouse, pen and touch drag)
    function tilt(e) {
        if (reduce || busy) return;
        var r = wrap.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        img.style.transform = 'perspective(600px) rotateY(' + (x * 28) + 'deg) rotateX(' + (-y * 28) + 'deg) scale(1.06)';
    }
    wrap.addEventListener('pointermove', tilt);
    wrap.addEventListener('pointerleave', function () { img.style.transform = ''; });

    wrap.addEventListener('click', function (e) {
        var r = wrap.getBoundingClientRect();
        interacted = true;
        clicks++;
        burst(e.clientX - r.left, e.clientY - r.top);
        spin();
        if (ringAnim) { setSpeed(14); setTimeout(function () { setSpeed(wrap.matches(':hover') ? 6 : 1); }, 700); }
        say(messages[Math.min(clicks - 1, messages.length - 1)]);
    });

    // until someone plays with it, wobble the logo now and then
    if (!reduce) {
        var nudger = setInterval(function () {
            if (interacted) { clearInterval(nudger); return; }
            wobble();
        }, 7000);
    }
})();
