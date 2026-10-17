/* KaroPays ad banners.
 * Each banner runs inside its OWN iframe (srcdoc) so that:
 *  - the provider's document.write() works (it is ignored for late-injected scripts),
 *  - every banner gets its own atOptions (no shared global between the 3 slots),
 *  - one failing banner cannot break the others.
 * Handles blocked scripts and empty responses; it never promises a fill. */
(function (w) {
  "use strict";
  var CFG = { key: "82565278dee02e769d1a15ccdd7a7b49", host: "https://www.highrevenueformat.com", width: 300, height: 250, timeoutMs: 9000 };

  function docFor(o) {
    var opts = JSON.stringify({ key: o.key, format: "iframe", height: o.height, width: o.width, params: {} }).replace(/</g, "\\u003c");
    return '<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}' +
      'body{display:flex;justify-content:center;align-items:center;min-height:' + o.height + 'px}</style></head><body>' +
      '<script>var atOptions=' + opts + ';<\/script>' +
      '<script src="' + o.host + '/' + o.key + '/invoke.js" onerror="window.__adBlocked=1"><\/script></body></html>';
  }

  function note(slot, text) {
    slot.classList.add("is-empty");
    slot.replaceChildren();
    var p = document.createElement("p");
    p.className = "ad-note";
    p.textContent = text;
    slot.appendChild(p);
  }

  function load(slot, o) {
    var frame = document.createElement("iframe");
    frame.width = o.width; frame.height = o.height;
    frame.title = "Advertisement";
    frame.setAttribute("scrolling", "no");
    frame.setAttribute("frameborder", "0");
    frame.style.cssText = "border:0;width:" + o.width + "px;height:" + o.height + "px;max-width:100%;overflow:hidden";
    frame.srcdoc = docFor(o);
    slot.dataset.adState = "loading";
    slot.appendChild(frame);
    w.setTimeout(function () {
      try {
        if (frame.contentWindow.__adBlocked) { slot.dataset.adState = "blocked"; return note(slot, "Advertisement blocked by your browser or network."); }
        var inner = frame.contentDocument && frame.contentDocument.querySelector("iframe, img, ins, a");
        if (inner) { slot.dataset.adState = "filled"; return; }
        slot.dataset.adState = "empty";
        note(slot, "No advertisement available right now.");
      } catch (e) { slot.dataset.adState = "unknown"; }
    }, o.timeoutMs);
  }

  function mount(slot, options) {
    var o = Object.assign({}, CFG, options || {});
    slot.classList.add("ad-slot");
    if (!("IntersectionObserver" in w)) return load(slot, o);
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); load(slot, o); }
    }, { rootMargin: "400px 0px" });
    io.observe(slot);
  }

  /* Creates `count` independent banner placements inside `container`. */
  function mountBanners(container, count, options) {
    container.replaceChildren();
    for (var i = 0; i < (count || 3); i++) {
      var card = document.createElement("article"); card.className = "ad-card";
      var slot = document.createElement("div"); slot.className = "banner-frame"; slot.id = "kp-banner-slot-" + (i + 1);
      card.appendChild(slot); container.appendChild(card);
      mount(slot, options);
    }
  }

  /* Third-party network tags (push / popunder / vignette). Failures are ignored. */
  function addTag(src, attrs) {
    var s = document.createElement("script");
    s.src = src; s.async = true;
    Object.keys(attrs || {}).forEach(function (k) { s.setAttribute(k, attrs[k]); });
    s.onerror = function () { s.remove(); };
    document.body.appendChild(s);
  }

  w.KaroAds = { mountBanners: mountBanners, addTag: addTag };
})(window);
