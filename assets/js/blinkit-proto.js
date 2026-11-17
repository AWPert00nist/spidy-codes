/* Blinkit case study: interactive prototype of the two top-ranked features.
   Frontend only, sample data, nothing leaves the browser. */
(function () {
    var root = document.getElementById('bp');
    if (!root) return;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    var P = {
        milk:  { n: 'Toned Milk',        w: '500 ml',  p: 30, life: 2, tot: 3,  pack: 'Packed yesterday',  e: '🥛', bg: '#EAF2FB', alt: 'milk2' },
        milk2: { n: 'Toned Milk',        w: '500 ml',  p: 30, life: 5, tot: 5,  pack: 'Packed today',      e: '🥛', bg: '#EAF2FB' },
        curd:  { n: 'Fresh Curd',        w: '400 g',   p: 45, life: 6, tot: 7,  pack: 'Packed 2 days ago', e: '🥣', bg: '#F5F0FA' },
        bread: { n: 'Whole Wheat Bread', w: '400 g',   p: 50, life: 3, tot: 4,  pack: 'Packed yesterday',  e: '🍞', bg: '#FBF1E3' },
        eggs:  { n: 'Farm Eggs',         w: '6 pcs',   p: 60, life: 9, tot: 12, pack: 'Packed 3 days ago', e: '🥚', bg: '#FDF3E7' },
        paneer:{ n: 'Fresh Paneer',      w: '200 g',   p: 95, life: 5, tot: 7,  pack: 'Packed yesterday',  e: '🧀', bg: '#FFF8DC' },
        tomato:{ n: 'Tomato',            w: '500 g',   p: 40, life: 4, tot: 6,  pack: 'Packed today',      e: '🍅', bg: '#FDECEA' }
    };
    var ORDER = ['milk', 'curd', 'bread', 'eggs', 'paneer', 'tomato'];
    var DELIVERY = 25;
    var REASONS = ['Damaged or leaking', 'Wrong item', 'Item missing', 'Too close to expiry'];
    var STEPS = [
        'Tap a product to see its best-before date',
        'Add the milk to your cart',
        'Spot the expiry warning and swap for a fresher pack',
        'Place the order, then simulate delivery',
        'Report an issue and add a photo',
        'Get your instant refund'
    ];
    var s, timer;

    function reset(keepOn) {
        clearTimeout(timer);
        s = { screen: 'home', on: keepOn === undefined ? true : keepOn, cart: {}, open: null, order: null,
              refunds: 0, rep: { items: {}, reason: '', photo: null, method: 'original' }, steps: {}, result: null };
    }
    function done(i) { s.steps[i] = true; }
    function rs(n) { return '₹' + n; }
    function dateStr(d) { return new Date(Date.now() + d * 864e5).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); }
    function count() { var c = 0; for (var k in s.cart) c += s.cart[k]; return c; }
    function subtotal() { var t = 0; for (var k in s.cart) t += P[k].p * s.cart[k]; return t; }
    function chip(it) {
        if (!s.on) return '';
        var w = it.life <= 2;
        return '<span class="bp-chip ' + (w ? 'bp-warn' : 'bp-ok') + '">' + (w ? '⚠ ' : '⏱ ') + it.life + ' days left</span>';
    }
    function stepper(k) {
        if (!s.cart[k]) return '<button class="bp-add" data-a="add" data-k="' + k + '" aria-label="Add ' + P[k].n + '">ADD</button>';
        return '<div class="bp-step"><button data-a="dec" data-k="' + k + '" aria-label="Remove one">−</button><span>' + s.cart[k] + '</span><button data-a="inc" data-k="' + k + '" aria-label="Add one">+</button></div>';
    }

    var V = {};
    V.home = function () {
        var h = '<div><div class="bp-head"><b>Delivery in 10 minutes</b><span>Home · Sample address, Bengaluru</span><div class="bp-searchbar">🔍&nbsp; Search "milk"</div></div>';
        h += '<div class="bp-sec">Dairy, bread &amp; eggs<small>Sample data</small></div><div class="bp-grid">';
        ORDER.forEach(function (k) {
            var it = P[k];
            h += '<div class="bp-card"><button class="bp-img" style="background:' + it.bg + '" data-a="open" data-k="' + k + '" aria-label="Open ' + it.n + '">' + it.e + chip(it) + '</button>' +
                 '<div class="bp-name">' + it.n + '</div><div class="bp-w">' + it.w + '</div><div class="bp-row"><span class="bp-price">' + rs(it.p) + '</span>' + stepper(k) + '</div></div>';
        });
        h += '</div></div>';
        return h;
    };
    V.product = function () {
        var it = P[s.open], w = it.life <= 2, pct = Math.round(it.life / it.tot * 100);
        var h = '<div><div class="bp-bar"><button class="bp-back" data-a="home" aria-label="Back">←</button>' + it.n + '</div>' +
                '<button class="bp-img big" style="background:' + it.bg + '" disabled>' + it.e + '</button>' +
                '<div class="bp-pad"><b style="font-size:17px">' + it.n + '</b><div class="bp-w">' + it.w + '</div><div class="bp-row"><span class="bp-price" style="font-size:18px">' + rs(it.p) + '</span>' + stepper(s.open) + '</div></div>';
        if (s.on) {
            h += '<div class="bp-info ' + (w ? 'warn' : '') + '"><span class="bp-tag">Freshness</span><br><b>Best before ' + dateStr(it.life) + '</b>' +
                 '<div class="bp-meter"><i style="width:' + pct + '%;background:' + (w ? '#F59E0B' : '#0C831F') + '"></i></div>' +
                 '<p>' + it.life + ' of ' + it.tot + ' days of shelf life left · ' + it.pack + '</p></div>';
        } else {
            h += '<div class="bp-panel"><div class="bp-w">Fresh and quality assured. No date shown.</div></div>';
        }
        return h + '</div>';
    };
    V.cart = function () {
        var h = '<div><div class="bp-bar"><button class="bp-back" data-a="home" aria-label="Back">←</button>My cart</div>', warn = null;
        if (!count()) return h + '<div class="bp-center"><div style="font-size:48px">🛒</div><b>Your cart is empty</b><p class="bp-w">Add something from the home screen.</p><button class="bp-btn alt" data-a="home">Browse products</button></div></div>';
        h += '<div class="bp-panel">';
        Object.keys(s.cart).forEach(function (k) {
            var it = P[k];
            h += '<div class="bp-line"><div class="bp-item"><div class="bp-ico" style="background:' + it.bg + '">' + it.e + '</div><div><b>' + it.n + '</b><div class="bp-w">' + it.w + '</div>' + (s.on ? '<div style="margin-top:3px">' + chip(it) + '</div>' : '') + '</div></div><div style="text-align:right">' + stepper(k) + '<div class="bp-price" style="margin-top:4px">' + rs(it.p * s.cart[k]) + '</div></div></div>';
            if (s.on && it.life <= 2 && it.alt) warn = k;
        });
        h += '</div>';
        if (warn) {
            var a = P[P[warn].alt];
            h += '<div class="bp-swap"><h4>⚠ This item expires soon</h4><div class="bp-vs"><div class="a">Now in cart<b>' + P[warn].life + ' days</b>' + P[warn].pack + '</div><span>→</span><div class="b">Fresher pack<b>' + a.life + ' days</b>' + a.pack + '</div></div><button class="bp-btn sm" style="margin-top:10px;width:100%" data-a="swap" data-k="' + warn + '">Swap for fresher pack · same price</button></div>';
        }
        var sub = subtotal();
        h += '<div class="bp-panel"><div class="bp-line"><span>Items total</span><span>' + rs(sub) + '</span></div><div class="bp-line"><span>Delivery (sample)</span><span>' + rs(DELIVERY) + '</span></div><div class="bp-line bp-tot"><span>To pay</span><span>' + rs(sub + DELIVERY) + '</span></div></div>' +
             '<div class="bp-note">Sample amounts, not Blinkit’s real fees.</div><div class="bp-pad"><button class="bp-btn" data-a="place">Place order · ' + rs(sub + DELIVERY) + '</button></div></div>';
        return h;
    };
    V.placed = function () {
        return '<div><div class="bp-center"><div class="bp-ring">✓</div><h3>Order placed</h3><p class="bp-w">Prototype only. No real order was made.</p></div><div class="bp-pad"><button class="bp-btn" data-a="deliver">Simulate delivery 🛵</button></div></div>';
    };
    V.delivered = function () {
        var h = '<div><div class="bp-hero"><b>Order delivered</b><span>Arrived in 9 minutes (sample)</span></div><div class="bp-panel">';
        Object.keys(s.order).forEach(function (k) {
            h += '<div class="bp-line"><div class="bp-item"><div class="bp-ico" style="background:' + P[k].bg + '">' + P[k].e + '</div><div><b>' + P[k].n + '</b><div class="bp-w">' + P[k].w + ' × ' + s.order[k] + '</div></div></div><b>' + rs(P[k].p * s.order[k]) + '</b></div>';
        });
        h += '</div><div class="bp-pad">';
        if (s.on) h += '<button class="bp-btn" data-a="report">Report an issue</button><div class="bp-note" style="margin:8px 0 0">Proposed: photo in, refund out. No pickup, no waiting.</div>';
        else h += '<button class="bp-btn alt" data-a="support">Need help? Contact support</button><div class="bp-note" style="margin:8px 0 0">Feature off: only a support contact is offered.</div>';
        return h + '<button class="bp-btn alt" style="margin-top:10px" data-a="again">Start over</button></div></div>';
    };
    V.report = function () {
        var r = s.rep, h = '<div><div class="bp-bar"><button class="bp-back" data-a="delivered" aria-label="Back">←</button>Report an issue</div><div class="bp-pad">';
        h += '<div class="bp-h" style="margin-top:0"><em>1</em>Which item?</div>';
        Object.keys(s.order).forEach(function (k) {
            h += '<label class="bp-pill"><input type="checkbox" data-a="pick" data-k="' + k + '"' + (r.items[k] ? ' checked' : '') + '><span>' + P[k].e + ' ' + P[k].n + ' ' + P[k].w + '</span></label>';
        });
        h += '<div class="bp-h"><em>2</em>What went wrong?</div>';
        REASONS.forEach(function (x) { h += '<label class="bp-pill"><input type="radio" name="bpr" data-a="reason" data-v="' + x + '"' + (r.reason === x ? ' checked' : '') + '><span>' + x + '</span></label>'; });
        h += '<div class="bp-h"><em>3</em>Add a photo</div><div class="bp-photo">' + (r.photo ? '<img src="' + r.photo + '" alt="Your photo">' : '<div style="font-size:30px">📷</div>') +
             '<label class="bp-up">' + (r.photo ? 'Change photo' : 'Choose photo') + '<input type="file" accept="image/*" data-a="photo" style="display:none"></label>' +
             (r.photo ? '' : '<br><button class="bp-btn alt sm" style="margin-top:8px" data-a="sample">or use a sample photo</button>') +
             '<div class="bp-w" style="margin-top:6px">Stays in your browser. Nothing is uploaded.</div></div>';
        h += '<div class="bp-h"><em>4</em>Refund to</div>' +
             '<label class="bp-pill"><input type="radio" name="bpm" data-a="method" data-v="original"' + (r.method === 'original' ? ' checked' : '') + '><span>Original payment method</span></label>' +
             '<label class="bp-pill"><input type="radio" name="bpm" data-a="method" data-v="credits"' + (r.method === 'credits' ? ' checked' : '') + '><span>Blinkit credits · instant</span></label>';
        var ok = Object.keys(r.items).length && r.reason && r.photo;
        return h + '<button class="bp-btn" style="margin-top:16px" data-a="submit"' + (ok ? '' : ' disabled') + '>Get refund</button>' + (ok ? '' : '<div class="bp-w" style="margin-top:6px;text-align:center">Pick an item, a reason and add a photo</div>') + '</div></div>';
    };
    V.processing = function () {
        return '<div><div class="bp-spin"></div><div class="bp-center" style="padding-top:0"><b>Checking your photo…</b><p class="bp-w">Matching it to your order</p></div></div>';
    };
    V.refunded = function () {
        var r = s.result, conf = '';
        if (!reduce && !r.review) { var c = ['#0C831F', '#F8CB46', '#F59E0B', '#2a7de1']; for (var i = 0; i < 26; i++) conf += '<i style="left:' + (Math.random() * 100) + '%;background:' + c[i % 4] + ';animation-delay:' + (Math.random() * .5) + 's"></i>'; }
        if (r.review) return '<div><div class="bp-center"><div class="bp-ring rev">⏳</div><h3>Sent for a quick review</h3><p class="bp-w">This is report number ' + s.refunds + ' in this session, so a person checks it first. It shows how abuse checks can sit behind an instant flow.</p><button class="bp-btn alt" data-a="again">Start over</button></div></div>';
        return '<div><div class="bp-conf">' + conf + '</div><div class="bp-center"><div class="bp-ring">✓</div><div class="bp-amt">' + rs(r.amt) + '</div><h3>Refund approved</h3><p class="bp-w">' + (r.method === 'credits' ? 'Added to your Blinkit credits now.' : 'On its way to your original payment method.') + '</p>' +
               '<ul class="bp-tl"><li>Photo received</li><li>Auto-checked, low-risk</li><li>Refund sent</li></ul>' +
               '<p class="bp-w" style="margin-top:12px">Repeat patterns go to review instead.</p><button class="bp-btn alt" data-a="again">Start over</button></div></div>';
    };

    function render() {
        var scr = root.querySelector('.bp-screen'), html = V[s.screen]();
        if ((s.screen === 'home' || s.screen === 'product') && count()) html += '<div class="bp-float"><button class="bp-cartbar" data-a="cart"><span>' + count() + ' item' + (count() > 1 ? 's' : '') + '<small>' + rs(subtotal()) + ' + delivery</small></span><span>View cart →</span></div>';
        scr.innerHTML = html;
        scr.scrollTop = 0;
        root.querySelector('.bp-status').className = 'bp-status' + (s.screen === 'home' ? '' : ' w');
        root.querySelectorAll('.bp-steps li').forEach(function (li, i) { li.classList.toggle('done', !!s.steps[i]); });
        root.querySelector('#bp-on').checked = s.on;
    }
    function keepScroll(fn) { var st = root.querySelector('.bp-screen').scrollTop; fn(); root.querySelector('.bp-screen').scrollTop = st; }

    function act(a, el) {
        var k = el.getAttribute('data-k'), stay = false;
        switch (a) {
            case 'open': s.open = k; if (s.on) done(0); s.screen = 'product'; break;
            case 'home': s.screen = 'home'; break;
            case 'add': s.cart[k] = 1; if (k === 'milk') done(1); stay = true; break;
            case 'inc': s.cart[k]++; stay = true; break;
            case 'dec': s.cart[k]--; if (s.cart[k] <= 0) delete s.cart[k]; stay = true; break;
            case 'cart': s.screen = 'cart'; break;
            case 'swap': var alt = P[k].alt; s.cart[alt] = (s.cart[alt] || 0) + s.cart[k]; delete s.cart[k]; done(2); stay = true; break;
            case 'place': s.order = JSON.parse(JSON.stringify(s.cart)); s.cart = {}; done(3); s.screen = 'placed'; break;
            case 'deliver': s.screen = 'delivered'; break;
            case 'report': s.screen = 'report'; break;
            case 'delivered': s.screen = 'delivered'; break;
            case 'support': el.textContent = 'Support chat would open here (sample)'; return;
            case 'sample':
                s.rep.photo = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="260" height="150"><rect width="260" height="150" fill="#eef3e8"/><text x="130" y="88" font-size="54" text-anchor="middle">🥛</text><text x="130" y="132" font-size="13" text-anchor="middle" fill="#5d7048" font-family="Arial">sample photo</text></svg>');
                done(4); stay = true; break;
            case 'submit':
                var amt = 0; Object.keys(s.rep.items).forEach(function (x) { amt += P[x].p * s.order[x]; });
                s.refunds++; s.screen = 'processing'; render();
                timer = setTimeout(function () { s.result = { amt: amt, method: s.rep.method, review: s.refunds >= 3 }; done(5); s.screen = 'refunded'; render(); }, reduce ? 0 : 1100);
                return;
            case 'again': var on = s.on, rf = s.refunds; reset(on); s.refunds = rf; break;
        }
        if (stay) keepScroll(render); else render();
    }

    root.addEventListener('click', function (e) {
        var el = e.target.closest('[data-a]');
        if (!el || !root.contains(el) || el.tagName === 'INPUT') return;
        act(el.getAttribute('data-a'), el);
    });
    root.addEventListener('change', function (e) {
        var el = e.target, a = el.getAttribute('data-a');
        if (el.id === 'bp-on') { var on = el.checked; reset(on); render(); return; }
        if (a === 'pick') { if (el.checked) s.rep.items[el.getAttribute('data-k')] = 1; else delete s.rep.items[el.getAttribute('data-k')]; }
        else if (a === 'reason') s.rep.reason = el.getAttribute('data-v');
        else if (a === 'method') s.rep.method = el.getAttribute('data-v');
        else if (a === 'photo' && el.files && el.files[0]) {
            var f = el.files[0];
            if (!/^image\//.test(f.type)) return;
            if (s.rep.photo && s.rep.photo.indexOf('blob:') === 0) URL.revokeObjectURL(s.rep.photo);
            s.rep.photo = URL.createObjectURL(f); done(4);
        } else return;
        keepScroll(render);
    });
    root.querySelector('#bp-restart').addEventListener('click', function () { reset(s.on); render(); });

    var t = new Date(); root.querySelector('.bp-time').textContent = t.getHours() + ':' + ('0' + t.getMinutes()).slice(-2);
    reset();
    root.querySelector('.bp-steps').innerHTML = STEPS.map(function (x) { return '<li>' + x + '</li>'; }).join('');
    render();
})();
