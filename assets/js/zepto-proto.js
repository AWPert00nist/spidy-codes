/* Zepto case study: interactive prototype of the proposed notification controls.
   Frontend only. Sample data, simulated clock, nothing leaves the browser. */
(function () {
    var root = document.getElementById('zp');
    if (!root) return;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    var PR = {
        milk:   { n: 'Toned Milk',         w: '500 ml', p: 30, mrp: 33, e: '🥛', bg: '#EAF2FB', stock: 14 },
        bread:  { n: 'Whole Wheat Bread',  w: '400 g',  p: 50, mrp: 55, e: '🍞', bg: '#FBF1E3', stock: 9 },
        chips:  { n: 'Potato Chips',       w: '90 g',   p: 40, mrp: 50, e: '🥔', bg: '#FFF4D6', stock: 22 },
        almond: { n: 'Almond Milk',        w: '1 L',    p: 190, mrp: 210, e: '🥜', bg: '#F6EFE6', stock: 0 },
        oat:    { n: 'Oat Milk',           w: '1 L',    p: 165, mrp: 180, e: '🌾', bg: '#F4F0E4', stock: 6 },
        soy:    { n: 'Soy Milk',           w: '1 L',    p: 120, mrp: 130, e: '🫘', bg: '#EEF3E4', stock: 11 },
        vitc:   { n: 'Vitamin C Tablets',  w: '30 pcs', p: 220, mrp: 260, e: '💊', bg: '#FDECEA', stock: 8 }
    };
    var HOME = ['milk', 'bread', 'chips', 'almond'];
    var CATS = { order: 'Order updates', reminder: 'Reminders', recs: 'Recommendations', offers: 'Offers', sensitive: 'Health & personal care' };
    var CAMPAIGNS = [
        { id: 'usual',  t: 485,  cat: 'reminder',  e: '🥛', title: 'Your usual is ready to reorder', body: 'Milk and bread, at your door in 10 minutes.', prod: 'milk',   btn: 'Your usual basket', meta: '8:05 AM · Reminder' },
        { id: 'night',  t: 90,   cat: 'offers',    e: '🥔', title: 'Midnight munchies? 20% off chips', body: 'Tonight only on Potato Chips.',            prod: 'chips',  btn: 'Late-night offer',  meta: '1:30 AM · Offer' },
        { id: 'sold',   t: 1120, cat: 'recs',      e: '🥜', title: 'Back for you: Almond Milk',         body: 'Tap to order before it goes.',               prod: 'almond', btn: 'Item that is sold out', meta: '6:40 PM · Recommendation' },
        { id: 'sale',   t: 1155, cat: 'offers',    e: '🎉', title: 'Flash sale: 30% off snacks',          body: 'Ends at 9 PM.',                              prod: 'chips',  btn: 'Flash sale',        meta: '7:15 PM · Offer' },
        { id: 'health', t: 1260, cat: 'sensitive', e: '💊', title: 'Your health picks are waiting',       body: 'Complete your order in 10 minutes.',         prod: 'vitc',   btn: 'Health & wellness reminder', meta: '9:00 PM · Sensitive category' },
        { id: 'order',  t: 1420, cat: 'order',     e: '🛵', title: 'Your order is 2 minutes away',        body: 'Rider is nearby with your items.',           prod: null,     btn: 'Order update, late at night', meta: '11:40 PM · Order' }
    ];
    var STEPS = [
        'Open Profile → Notifications and change a setting',
        'Send the 1:30 AM offer. Quiet hours hold it',
        'Send "Your usual", tap the banner, land on live stock',
        'Send the sold-out item and tap it: see the fallback',
        'Send offers until the daily limit stops one',
        'Send the health reminder: sensitive categories are blocked'
    ];
    var s, bannerTimer;

    function fresh(on) {
        return { on: on, tab: 'home', screen: 'home', clock: 9 * 60 + 41, sent: 0, inbox: [], unread: 0, log: [], steps: {}, landing: null, cart: {},
                 p: { master: true, cats: { reminder: true, recs: true, offers: true }, quiet: true, qs: 23 * 60, qe: 7 * 60, cap: 2, sens: true } };
    }
    function reset(on) { clearTimeout(bannerTimer); s = fresh(on === undefined ? true : on); }
    function done(i) { s.steps[i] = true; }
    function rs(n) { return '₹' + n; }
    function fmt(m) { m = ((m % 1440) + 1440) % 1440; var h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return h + ':' + (mm < 10 ? '0' : '') + mm + ' ' + ap; }
    function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function inQuiet(t) { var p = s.p; if (!p.quiet) return false; return p.qs > p.qe ? (t >= p.qs || t < p.qe) : (t >= p.qs && t < p.qe); }

    /* The rules engine: what the proposed controls decide for each campaign. */
    function decide(c, releasing) {
        var p = s.p;
        if (!s.on) return p.master ? { k: 'ok', why: 'Delivered. No controls exist today beyond an on/off switch.' } : { k: 'block', why: 'Blocked: you switched all notifications off.' };
        if (c.cat === 'order') return { k: 'ok', why: 'Delivered. Order updates are transactional and always allowed, even in quiet hours.' };
        if (!p.master) return { k: 'block', why: 'Blocked: all notifications are off.' };
        if (c.cat === 'sensitive' && p.sens) return { k: 'block', why: 'Blocked: health and personal care is excluded from marketing.' };
        var key = c.cat === 'sensitive' ? 'recs' : c.cat;
        if (p.cats[key] === false) return { k: 'block', why: 'Blocked: you turned off ' + CATS[key].toLowerCase() + '.' };
        if (!releasing && inQuiet(c.t)) return { k: 'held', why: 'Held until ' + fmt(p.qe) + ' (quiet hours).' };
        if (s.sent >= p.cap) return { k: 'block', why: 'Blocked: daily limit of ' + p.cap + ' reached.' };
        return { k: 'ok', why: 'Delivered. ' + (s.sent + 1) + ' of ' + p.cap + ' today.' };
    }
    function addLog(c, d, time) { s.log.unshift({ t: time, title: c.title, k: d.k, why: d.why, id: c.id }); }
    function deliver(c, time) {
        var n = { id: c.id, e: c.e, title: c.title, body: c.body, prod: c.prod, t: time, cat: c.cat };
        s.inbox.unshift(n); s.unread++;
        if (c.cat !== 'order' && s.on) s.sent++;
        showBanner(n);
    }
    function send(id) {
        var c = CAMPAIGNS.filter(function (x) { return x.id === id; })[0];
        s.clock = c.t;
        var d = decide(c);
        addLog(c, d, c.t);
        if (d.k === 'ok') deliver(c, c.t);
        if (d.k === 'held') done(1);
        if (d.k === 'block' && c.cat === 'sensitive' && s.on) done(5);
        if (d.k === 'block' && /daily limit/.test(d.why)) done(4);
        render();
    }
    function release(id) {
        var c = CAMPAIGNS.filter(function (x) { return x.id === id; })[0];
        s.clock = s.p.qe;
        var d = decide(c, true);
        s.log.forEach(function (l) { if (l.id === id && l.k === 'held') { l.k = d.k === 'ok' ? 'ok' : 'block'; l.why = d.k === 'ok' ? 'Released at ' + fmt(s.p.qe) + ' and delivered.' : d.why; l.rel = true; } });
        if (d.k === 'ok') deliver(c, s.p.qe);
        render();
    }

    function showBanner(n) {
        var b = root.querySelector('.zp-banner');
        b.setAttribute('data-id', n.id);
        b.innerHTML = '<img src="images/logos/zepto.jpg" alt=""><div><small>Zepto · now</small><b>' + esc(n.title) + '</b><span>' + esc(n.body) + '</span></div>';
        b.classList.add('show');
        clearTimeout(bannerTimer);
        bannerTimer = setTimeout(function () { b.classList.remove('show'); }, 6000);
    }
    function hideBanner() { root.querySelector('.zp-banner').classList.remove('show'); clearTimeout(bannerTimer); }
    function openNotif(id) {
        var n = s.inbox.filter(function (x) { return x.id === id; })[0];
        if (!n) return;
        hideBanner();
        s.unread = Math.max(0, s.unread - 1);
        if (n.prod) {
            s.landing = n.prod; s.screen = 'landing';
            var st = PR[n.prod].stock;
            if (n.id === 'usual' && s.on) done(2);
            if (n.id === 'sold' && s.on && st === 0) done(3);
        } else { s.screen = 'track'; }
        render();
    }

    function stepper(k) {
        if (PR[k].stock === 0 && s.on) return '<button class="zp-add off" disabled>ADD</button>';
        if (!s.cart[k]) return '<button class="zp-add" data-a="add" data-k="' + k + '" aria-label="Add ' + PR[k].n + '">ADD</button>';
        return '<div class="zp-step"><button data-a="dec" data-k="' + k + '" aria-label="Remove one">−</button><span>' + s.cart[k] + '</span><button data-a="inc" data-k="' + k + '" aria-label="Add one">+</button></div>';
    }
    function card(k, big) {
        var it = PR[k];
        return '<div class="zp-card"><button class="zp-img" style="background:' + it.bg + '" data-a="view" data-k="' + k + '" aria-label="Open ' + it.n + '">' + it.e + '</button><div class="zp-name">' + it.n + '</div><div class="zp-w">' + it.w + '</div><div class="zp-row"><span class="zp-price">' + rs(it.p) + '<s>' + rs(it.mrp) + '</s></span>' + stepper(k) + '</div></div>';
    }

    var V = {};
    V.home = function () {
        var h = '<div><div class="zp-head"><div class="zp-loc"><div><b>10 minutes</b><small>Home · Sample address, Bengaluru</small></div><button class="zp-bell" data-a="tab" data-v="inbox" aria-label="Notifications">🔔' + (s.unread ? '<i>' + s.unread + '</i>' : '') + '</button></div><div class="zp-search">🔍&nbsp; Search for "milk"</div></div>' +
            '<div class="zp-chips"><span>All</span><span>Fresh</span><span>Dairy</span><span>Snacks</span></div><div class="zp-promo">Free delivery on your first order<small>Sample banner</small></div>' +
            '<div class="zp-sec">Picked for you<small>Sample data</small></div><div class="zp-grid">';
        HOME.forEach(function (k) { h += card(k); });
        return h + '</div></div>';
    };
    V.inbox = function () {
        var h = '<div><div class="zp-bar">Notifications</div>';
        if (!s.inbox.length) return h + '<div class="zp-pad" style="text-align:center;padding-top:60px"><div style="font-size:44px">🔔</div><b>Nothing yet</b><p class="zp-w">Send a campaign from the panel next to the phone.</p></div></div>';
        s.inbox.forEach(function (n) { h += '<button class="zp-n" data-a="open" data-id="' + n.id + '"><div class="zp-ni">' + n.e + '</div><div><b>' + esc(n.title) + '</b><span>' + esc(n.body) + '</span><em>' + fmt(n.t) + '</em></div></button>'; });
        return h + '</div>';
    };
    V.profile = function () {
        return '<div><div class="zp-head" style="padding-bottom:18px"><div class="zp-loc"><div><b>Hi, Shopper</b><small>Sample profile</small></div></div></div><div class="zp-panel"><button class="zp-n" style="border:0;padding:12px 0;background:none" data-a="settings"><div class="zp-ni">🔔</div><div><b>Notifications</b><span>' + (s.on ? 'Choose what you hear about, and when' : (s.p.master ? 'On' : 'Off')) + '</span></div><span style="margin-left:auto;align-self:center">›</span></button></div><div class="zp-note">Other profile rows are left out of this prototype.</div></div>';
    };
    V.settings = function () {
        var p = s.p, h = '<div><div class="zp-bar"><button class="zp-back" data-a="tab" data-v="profile" aria-label="Back">←</button>Notifications</div>';
        h += '<div class="zp-panel"><div class="zp-set"><div><b>Allow notifications</b><small>' + (s.on ? 'Master switch' : 'The only control available today (as I understand it)') + '</small></div><label class="zp-sw"><input type="checkbox" data-a="pm" ' + (p.master ? 'checked' : '') + '><i></i></label></div></div>';
        if (!s.on) return h + '<div class="zp-note">Turn on "Proposed controls" in the panel to see the preference centre.</div></div>';
        var dis = p.master ? '' : ' disabled';
        h += '<div class="zp-hd">What you hear about</div><div class="zp-panel">' +
            '<div class="zp-set"><div><b>Order updates</b><small>Always on, so you never miss a delivery</small></div><label class="zp-sw"><input type="checkbox" checked disabled><i></i></label></div>';
        [['reminder', 'Reminders', 'Your usual basket and restock nudges'], ['recs', 'Recommendations', 'Items picked from your activity'], ['offers', 'Offers', 'Deals and flash sales']].forEach(function (c) {
            h += '<div class="zp-set"><div><b>' + c[1] + '</b><small>' + c[2] + '</small></div><label class="zp-sw"><input type="checkbox" data-a="pc" data-k="' + c[0] + '" ' + (p.cats[c[0]] ? 'checked' : '') + dis + '><i></i></label></div>';
        });
        h += '</div><div class="zp-hd">When</div><div class="zp-panel"><div class="zp-set"><div><b>Quiet hours</b><small>Only order updates come through</small></div><label class="zp-sw"><input type="checkbox" data-a="pq" ' + (p.quiet ? 'checked' : '') + dis + '><i></i></label></div>';
        if (p.quiet) {
            h += '<div class="zp-set"><div><b>From</b></div><select class="zp-sel" data-a="qs" aria-label="Quiet hours start">';
            [21, 22, 23, 24].forEach(function (x) { h += '<option value="' + (x * 60 % 1440) + '"' + (p.qs === x * 60 % 1440 ? ' selected' : '') + '>' + fmt(x * 60) + '</option>'; });
            h += '</select></div><div class="zp-set"><div><b>To</b></div><select class="zp-sel" data-a="qe" aria-label="Quiet hours end">';
            [6, 7, 8, 9].forEach(function (x) { h += '<option value="' + x * 60 + '"' + (p.qe === x * 60 ? ' selected' : '') + '>' + fmt(x * 60) + '</option>'; });
            h += '</select></div>';
        }
        h += '<div class="zp-set"><div><b>Daily limit</b><small>Marketing messages per day</small></div><div class="zp-seg">';
        [1, 2, 3].forEach(function (n) { h += '<button data-a="cap" data-v="' + n + '" class="' + (p.cap === n ? 'on' : '') + '">' + n + '</button>'; });
        h += '</div></div></div><div class="zp-hd">Privacy</div><div class="zp-panel"><div class="zp-set"><div><b>Skip health &amp; personal care</b><small>No marketing about these categories</small></div><label class="zp-sw"><input type="checkbox" data-a="ps" ' + (p.sens ? 'checked' : '') + dis + '><i></i></label></div></div><div class="zp-note">Illustrative preference centre with placeholder copy.</div></div>';
        return h;
    };
    V.landing = function () {
        var it = PR[s.landing], out = it.stock === 0, h = '<div><div class="zp-bar"><button class="zp-back" data-a="tab" data-v="home" aria-label="Back">←</button>' + esc(it.n) + '</div><div class="zp-img big" style="background:' + it.bg + '">' + it.e + '</div><div class="zp-pad"><b style="font-size:17px">' + esc(it.n) + '</b><div class="zp-w">' + it.w + '</div><div class="zp-row"><span class="zp-price" style="font-size:18px">' + rs(it.p) + '<s>' + rs(it.mrp) + '</s></span>' + stepper(s.landing) + '</div><div style="margin-top:10px">';
        if (s.on) h += out ? '<span class="zp-so">Sold out at your store</span>' : '<span class="zp-live"><i></i>Live stock: ' + it.stock + ' left at your store</span>';
        else if (out) h += '<span class="zp-so">Currently unavailable</span>';
        h += '</div></div>';
        if (out && s.on) {
            h += '<div class="zp-fb"><b>Sold out right now. Similar items in stock:</b><div class="zp-sub">';
            ['oat', 'soy', 'milk'].forEach(function (k) { h += '<div class="zp-card"><button class="zp-img" style="background:' + PR[k].bg + '" data-a="view" data-k="' + k + '" aria-label="Open ' + PR[k].n + '">' + PR[k].e + '</button><div class="zp-name" style="min-height:0">' + PR[k].n + '</div><div class="zp-price">' + rs(PR[k].p) + '</div></div>'; });
            h += '</div><button class="zp-btn alt" style="margin-top:10px" data-a="notify">Notify me when it is back</button></div>';
        } else if (out) h += '<div class="zp-note">Dead end: the button is disabled and there are no alternatives.</div>';
        return h + '</div>';
    };
    V.track = function () {
        return '<div><div class="zp-bar"><button class="zp-back" data-a="tab" data-v="home" aria-label="Back">←</button>Order tracking</div><div class="zp-pad" style="text-align:center;padding-top:40px"><div style="font-size:64px">🛵</div><h3>Arriving in 2 minutes</h3><p class="zp-w">Sample screen. This update arrives even in quiet hours because it is about an order in progress.</p></div></div>';
    };

    function render() {
        var scr = root.querySelector('.zp-screen');
        scr.innerHTML = V[s.screen]();
        var main = s.screen === 'home' || s.screen === 'inbox' || s.screen === 'profile';
        var nav = root.querySelector('.zp-nav');
        nav.style.display = main ? 'flex' : 'none';
        if (main) {
            nav.innerHTML = [['home', '🏠', 'Home'], ['inbox', '🔔', 'Inbox'], ['profile', '👤', 'Profile']].map(function (t) {
                return '<button data-a="tab" data-v="' + t[0] + '" class="' + (s.tab === t[0] ? 'on' : '') + '"><span>' + t[1] + '</span>' + t[2] + (t[0] === 'inbox' && s.unread ? '<i class="zp-badge">' + s.unread + '</i>' : '') + '</button>';
            }).join('');
        }
        var st = root.querySelector('.zp-status');
        st.className = 'zp-status' + (s.screen === 'home' || s.screen === 'profile' ? '' : ' w');
        root.querySelector('.zp-time').textContent = fmt(s.clock);
        root.querySelectorAll('.zp-steps li').forEach(function (li, i) { li.classList.toggle('done', !!s.steps[i]); });
        root.querySelector('#zp-on').checked = s.on;
        var lg = root.querySelector('#zp-log');
        lg.innerHTML = s.log.length ? s.log.map(function (l) {
            var lab = l.k === 'ok' ? 'Delivered' : l.k === 'held' ? 'Held' : 'Blocked';
            return '<li><span class="k ' + l.k + '">' + lab + '</span><div><b>' + fmt(l.t) + '</b> · ' + esc(l.title) + '<br>' + esc(l.why) + (l.k === 'held' ? '<br><button data-a="release" data-id="' + l.id + '">Fast-forward to ' + fmt(s.p.qe) + '</button>' : '') + '</div></li>';
        }).join('') : '<li class="zp-empty">Nothing sent yet. Send a campaign above.</li>';
    }
    function keep(fn) { var e = root.querySelector('.zp-screen'), y = e.scrollTop; fn(); root.querySelector('.zp-screen').scrollTop = y; }

    function act(a, el) {
        var k = el.getAttribute('data-k'), v = el.getAttribute('data-v'), stay = false;
        switch (a) {
            case 'tab': s.tab = v; s.screen = v; if (v === 'inbox') s.unread = 0; break;
            case 'settings': s.screen = 'settings'; break;
            case 'view': s.landing = k; s.screen = 'landing'; break;
            case 'add': s.cart[k] = 1; stay = true; break;
            case 'inc': s.cart[k]++; stay = true; break;
            case 'dec': s.cart[k]--; if (s.cart[k] <= 0) delete s.cart[k]; stay = true; break;
            case 'notify': el.textContent = 'We will let you know ✓'; el.disabled = true; return;
            case 'open': openNotif(el.getAttribute('data-id')); return;
            case 'cap': s.p.cap = +v; done(0); stay = true; break;
            case 'send': send(el.getAttribute('data-id')); return;
            case 'release': release(el.getAttribute('data-id')); return;
        }
        if (stay) keep(render); else render();
    }
    root.addEventListener('click', function (e) {
        var b = e.target.closest('.zp-banner');
        if (b && root.contains(b)) { openNotif(b.getAttribute('data-id')); return; }
        var el = e.target.closest('[data-a]');
        if (!el || !root.contains(el) || el.tagName === 'INPUT' || el.tagName === 'SELECT') return;
        act(el.getAttribute('data-a'), el);
    });
    root.addEventListener('change', function (e) {
        var el = e.target, a = el.getAttribute('data-a'), p = s.p;
        if (el.id === 'zp-on') { reset(el.checked); render(); return; }
        if (a === 'pm') p.master = el.checked;
        else if (a === 'pc') p.cats[el.getAttribute('data-k')] = el.checked;
        else if (a === 'pq') p.quiet = el.checked;
        else if (a === 'ps') p.sens = el.checked;
        else if (a === 'qs') p.qs = +el.value;
        else if (a === 'qe') p.qe = +el.value;
        else return;
        done(0); keep(render);
    });
    root.addEventListener('keydown', function (e) { var b = e.target.closest && e.target.closest('.zp-banner'); if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openNotif(b.getAttribute('data-id')); } });
    root.querySelector('#zp-restart').addEventListener('click', function () { reset(s.on); render(); });

    root.querySelector('#zp-send').innerHTML = CAMPAIGNS.map(function (c) {
        return '<button data-a="send" data-id="' + c.id + '"><em>' + c.e + '</em><span>' + c.btn + '<small>' + c.meta + '</small></span></button>';
    }).join('');
    root.querySelector('.zp-steps').innerHTML = STEPS.map(function (x) { return '<li>' + x + '</li>'; }).join('');
    reset();
    render();
})();
