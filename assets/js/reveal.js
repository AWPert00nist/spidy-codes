(function () {
    var els = document.querySelectorAll('#wrapper > section');
    if (!('IntersectionObserver' in window) || !els.length) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    document.documentElement.classList.add('js-reveal');
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); }
        });
    }, { threshold: 0.12 });
    els.forEach(function (el, i) {
        if (i === 0) return;               // keep the hero visible immediately
        el.classList.add('reveal');
        io.observe(el);
    });
})();
