/* particles.js-style background for the hero: drifting dots, links between near neighbours,
   mouse "grab" lines, and push-away on hover. Plain canvas, no dependencies. */
(function () {
    var hero = document.getElementById('intro');
    if (!hero || !hero.getContext && !document.createElement('canvas').getContext) return;

    var canvas = document.createElement('canvas');
    canvas.className = 'hero-particles';
    hero.insertBefore(canvas, hero.firstChild);
    var ctx = canvas.getContext('2d');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var COLORS = ['108,99,255', '0,198,255', '255,110,199'];
    var LINK = 130, GRAB = 170, dpr, w, h, dots = [], mouse = { x: null, y: null }, running = false, timer;

    function size() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = hero.clientWidth; h = hero.clientHeight;
        canvas.width = w * dpr; canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var count = Math.round(Math.min(90, Math.max(24, (w * h) / 14000)));
        while (dots.length < count) dots.push(make());
        dots.length = count;
    }
    function make(x, y) {
        var a = Math.random() * Math.PI * 2, s = 0.25 + Math.random() * 0.5;
        return { x: x == null ? Math.random() * w : x, y: y == null ? Math.random() * h : y,
                 vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: 1.5 + Math.random() * 2.2,
                 c: COLORS[(Math.random() * COLORS.length) | 0] };
    }

    function step() {
        ctx.clearRect(0, 0, w, h);
        for (var i = 0; i < dots.length; i++) {
            var p = dots[i];
            if (!reduce) {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0 || p.x > w) p.vx *= -1;
                if (p.y < 0 || p.y > h) p.vy *= -1;
                if (mouse.x !== null) {            // gentle push away from the cursor
                    var dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.sqrt(dx * dx + dy * dy);
                    if (d < 90 && d > 0) { p.x += (dx / d) * 1.6; p.y += (dy / d) * 1.6; }
                }
            }
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, 6.2832);
            ctx.fillStyle = 'rgba(' + p.c + ',0.85)';
            ctx.fill();
            for (var j = i + 1; j < dots.length; j++) {
                var q = dots[j], ax = p.x - q.x, ay = p.y - q.y, dist = Math.sqrt(ax * ax + ay * ay);
                if (dist < LINK) {
                    ctx.strokeStyle = 'rgba(' + p.c + ',' + (0.42 * (1 - dist / LINK)).toFixed(3) + ')';
                    ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
                }
            }
            if (mouse.x !== null) {                // grab lines to the cursor
                var mx = p.x - mouse.x, my = p.y - mouse.y, md = Math.sqrt(mx * mx + my * my);
                if (md < GRAB) {
                    ctx.strokeStyle = 'rgba(' + p.c + ',' + (0.55 * (1 - md / GRAB)).toFixed(3) + ')';
                    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
                }
            }
        }
        
    }
    // ~30fps timer: cheaper than a 60fps rAF loop and plenty smooth for slow drifting dots
    function start() { if (running) return; running = true; step(); if (!reduce) timer = setInterval(step, 33); }
    function stop() { running = false; clearInterval(timer); }

    hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    hero.addEventListener('pointerleave', function () { mouse.x = mouse.y = null; });
    hero.addEventListener('pointerdown', function (e) {   // click or tap adds a few particles
        if (e.target.closest && e.target.closest('.logo-anim, a, button')) return;
        var r = hero.getBoundingClientRect();
        for (var k = 0; k < 4 && dots.length < 140; k++) dots.push(make(e.clientX - r.left, e.clientY - r.top));
    });

    size();
    window.addEventListener('resize', size);
    if ('IntersectionObserver' in window) {      // only animate while the hero is on screen
        new IntersectionObserver(function (en) { en[0].isIntersecting ? start() : stop(); }).observe(hero);
    } else { start(); }
    if (reduce) step();
})();
