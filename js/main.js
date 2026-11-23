/* Scroll reveal.
   Elements marked .reveal fade up once as they enter the viewport.
   Items sharing a .reveal-group parent stagger in sequence. */

(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  var items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduced || !("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("is-visible"); });
    return;
  }

  // Stagger siblings inside a group so a row of cards arrives in order.
  document.querySelectorAll(".reveal-group").forEach(function (group) {
    group.querySelectorAll(":scope > .reveal").forEach(function (el, i) {
      el.style.setProperty("--reveal-delay", (i % 2) * 90 + "ms");
    });
  });

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.08 }
  );

  items.forEach(function (el) { observer.observe(el); });
})();


/* Skills explorer.
   The markers expand in place rather than opening a separate panel, and their
   positions are randomised on each load. Hover drives it on a mouse; tap and
   keyboard focus do the same job where there is no hover. */

(function () {
  "use strict";

  var chips = Array.prototype.slice.call(document.querySelectorAll(".chip"));
  if (!chips.length) return;

  var closeTimer = null;

  /* Measure the LABEL, not the marker. The marker also contains the hidden
     description, which at max-content lays out as one long unbroken line —
     measuring the marker itself produces absurdly wide chips that overlap
     and make hover flicker between neighbours. */
  function measure() {
    chips.forEach(function (chip) {
      var label = chip.querySelector(".chip-label");
      if (!label) return;

      var wasOpen = chip.classList.contains("is-open");
      chip.classList.remove("is-open");   // open state is bold, and wider

      var cs = getComputedStyle(chip);
      var frame = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) +
                  parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth);
      var w = label.getBoundingClientRect().width + frame;
      if (w) chip.style.setProperty("--w", Math.ceil(w) + "px");

      if (wasOpen) chip.classList.add("is-open");
    });
  }

  function open(chip) {
    clearTimeout(closeTimer);
    chips.forEach(function (c) { c.classList.toggle("is-open", c === chip); });
  }

  function closeAll(delay) {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(function () {
      chips.forEach(function (c) { c.classList.remove("is-open"); });
    }, delay === undefined ? 130 : delay);
  }

  chips.forEach(function (chip) {
    chip.addEventListener("mouseenter", function () { open(chip); });
    chip.addEventListener("mouseleave", function () { closeAll(); });
    chip.addEventListener("focusin", function () { open(chip); });
    chip.addEventListener("focusout", function (e) {
      if (!chip.contains(e.relatedTarget)) closeAll();
    });
    // Touch has no hover, so a tap toggles.
    chip.addEventListener("click", function (e) {
      if (e.target.closest("a")) return;          // let project links through
      if (chip.classList.contains("is-open")) closeAll(0);
      else open(chip);
    });
    chip.addEventListener("keydown", function (e) {
      if ((e.key === "Enter" || e.key === " ") && e.target === chip) {
        e.preventDefault();
        open(chip);
      }
      if (e.key === "Escape") { closeAll(0); chip.blur(); }
    });
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".chip")) closeAll(0);
  });

  /* Random scatter.
     Positions are drawn fresh each load, then vetted: markers may overlap the
     headline (that is the depth effect) but never each other, never the
     highlighted word, and never so close to an edge that the expanded card
     would run off. Fractions are kept so a resize re-places rather than
     re-randomises. */

  var stage = document.querySelector(".hero-stage");
  var guard = document.querySelector(".hero-title .mark");

  function overlaps(a, b, pad) {
    return !(a.right + pad < b.left || a.left - pad > b.right ||
             a.bottom + pad < b.top || a.top - pad > b.bottom);
  }

  function scatterChips(reuse) {
    if (!stage || window.matchMedia("(max-width: 760px)").matches) return;

    var s = stage.getBoundingClientRect();
    if (!s.width || !s.height) return;

    var keepOut = null;
    if (guard) {
      var g = guard.getBoundingClientRect();
      keepOut = { left: g.left - s.left, top: g.top - s.top,
                  right: g.right - s.left, bottom: g.bottom - s.top };
    }

    var taken = [];

    // Pinned markers claim their spot first so the random ones avoid it.
    var order = chips.slice().sort(function (a, b) {
      return (b.hasAttribute("data-pin") ? 1 : 0) - (a.hasAttribute("data-pin") ? 1 : 0);
    });

    order.forEach(function (chip) {
      var rect = chip.getBoundingClientRect();
      var w = rect.width;
      var h = rect.height;
      var mx = w / 2 + 6;
      var my = h / 2 + 6;

      var spot = null;

      if (chip.hasAttribute("data-pin")) {
        // Remember the authored position once; --x is rewritten below.
        if (chip._px == null) {
          chip._px = parseFloat(chip.style.getPropertyValue("--x")) / 100;
          chip._py = parseFloat(chip.style.getPropertyValue("--y")) / 100;
        }
        spot = { fx: chip._px, fy: chip._py };
      } else if (reuse && chip._fx != null) {
        spot = { fx: chip._fx, fy: chip._fy };
      } else {
        for (var i = 0; i < 400 && !spot; i++) {
          var relax = i > 250 ? 10 : 24;          // loosen if the field is tight
          var cx = mx + Math.random() * Math.max(1, s.width - mx * 2);
          var cy = my + Math.random() * Math.max(1, s.height - my * 2);
          var box = { left: cx - w / 2, right: cx + w / 2,
                      top: cy - h / 2, bottom: cy + h / 2 };

          if (keepOut && overlaps(box, keepOut, 18)) continue;
          if (taken.some(function (t) { return overlaps(box, t, relax); })) continue;

          spot = { fx: cx / s.width, fy: cy / s.height };
        }
        if (!spot) spot = { fx: 0.5, fy: 0.5 };
      }

      chip._fx = spot.fx;
      chip._fy = spot.fy;

      var px = spot.fx * s.width;
      var py = spot.fy * s.height;
      taken.push({ left: px - w / 2, right: px + w / 2,
                   top: py - h / 2, bottom: py + h / 2 });

      chip.style.setProperty("--x", (spot.fx * 100).toFixed(2) + "%");
      chip.style.setProperty("--y", (spot.fy * 100).toFixed(2) + "%");
      // Expanded cards grow away from whichever edge they sit nearest.
      chip.style.setProperty("--ax", "-" + (15 + 70 * spot.fx).toFixed(0) + "%");
      chip.style.setProperty("--ay", "-" + (15 + 70 * spot.fy).toFixed(0) + "%");
    });
  }

  /* Entrance: send each marker off to its nearest edge, then let it glide
     back in. Staggered so they arrive one after another rather than as a
     block. */
  var STAGGER = 0;           // ms between arrivals; set by the path editor

  function entrance() {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var s = stage && stage.getBoundingClientRect();

    if (reduced || !s || !s.width) {
      chips.forEach(function (c) { c.classList.add("is-in"); });
      return;
    }

    var order = chips.slice().sort(function () { return Math.random() - 0.5; });

    order.forEach(function (chip, i) {
      /* Authored start points win. data-fx / data-fy come from the path
         editor and are authored per marker; without them, fall back to
         flying straight out through the nearer side of the window. */
      var fx = chip.dataset.fx, fy = chip.dataset.fy;
      if (!fx) {
        var r = chip.getBoundingClientRect();
        var vw = document.documentElement.clientWidth;
        var out = (r.left + r.width / 2) < vw / 2
          ? -(r.right + 60) : (vw - r.left + 60);
        fx = Math.round(out) + "px";
        fy = fy || "0px";
      }
      chip.style.setProperty("--fx", fx);
      chip.style.setProperty("--fy", fy || "0px");
      chip.style.transitionDelay = (i * STAGGER) + "ms";
      chip.classList.add("enter");
    });

    // Two frames: one to paint the offstage position, one to start the move.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        chips.forEach(function (chip) {
          chip.classList.add("entering", "is-in");
          chip.classList.remove("enter");
        });
        setTimeout(function () {
          chips.forEach(function (chip) {
            chip.classList.remove("entering");
            chip.style.transitionDelay = "";
            chip.style.removeProperty("--fx");
            chip.style.removeProperty("--fy");
          });
        }, STAGGER * chips.length + 1600);
      });
    });
  }


  /* The curve on the About page starts at the very top of the page, which
     means it has to rise by exactly the header's height. That height is not
     knowable in CSS, so it is measured and published as a variable. */
  (function () {
    var header = document.querySelector(".site-header");
    if (!header) return;
    function setHeaderHeight() {
      document.documentElement.style.setProperty(
        "--header-h", header.getBoundingClientRect().height + "px");
    }
    setHeaderHeight();
    window.addEventListener("resize", setHeaderHeight);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(setHeaderHeight);
  })();

  /* Settle the layout first, then fly the markers in.
     The web font changes every label's measured width, so re-measuring
     mid-flight moved markers by setting left/top — which are not animated,
     so they teleported instead of arriving. Waiting for the font means all
     six travel the whole way and land where they belong. */
  var started = false;
  function begin() {
    if (started) return;
    started = true;
    measure();
    scatterChips(false);
    entrance();
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(begin);
    setTimeout(begin, 1200);        // in case the font never resolves
  } else {
    begin();
  }

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    if (!started) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { measure(); scatterChips(true); }, 150);
  });
})();


/* Back to top.
   Appears once the page has scrolled past roughly one screen. */

(function () {
  "use strict";

  // querySelectorAll, not querySelector: the single-page bundle used for
  // previews holds every page at once, so there is one button per route.
  var btns = Array.prototype.slice.call(document.querySelectorAll(".to-top"));
  if (!btns.length) return;

  var threshold = 400;
  var ticking = false;

  function update() {
    var y = window.scrollY || document.documentElement.scrollTop;
    btns.forEach(function (b) { b.classList.toggle("is-visible", y > threshold); });
    ticking = false;
  }

  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }, { passive: true });

  btns.forEach(function (btn) {
  btn.addEventListener("click", function () {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    // Send focus back to the top of the document, not just the pixels.
    var main = document.querySelector("main");
    if (main) {
      main.setAttribute("tabindex", "-1");
      main.focus({ preventScroll: true });
      main.removeAttribute("tabindex");
    }
  });
  });

  update();
})();


/* Image comparison slider.
   Generic: it drives any .compare-frame on the page and never references a
   particular image. To reuse, copy the markup and change the two <img> sources
   and the two labels — nothing here needs editing. */

(function () {
  "use strict";

  var frames = Array.prototype.slice.call(document.querySelectorAll(".compare-frame"));
  if (!frames.length) return;

  frames.forEach(function (frame) {
    var handle = frame.querySelector(".compare-handle");
    var hint = frame.parentNode.querySelector(".compare-hint");
    var touched = false;

    function set(pct) {
      pct = Math.max(0, Math.min(100, pct));
      frame.style.setProperty("--pos", pct.toFixed(2) + "%");
      if (handle) handle.setAttribute("aria-valuenow", Math.round(pct));
    }

    function fromEvent(e) {
      var r = frame.getBoundingClientRect();
      if (!r.width) return;
      set(((e.clientX - r.left) / r.width) * 100);
    }

    function used() {
      if (touched || !hint) return;
      touched = true;
      hint.classList.add("is-gone");
    }

    frame.addEventListener("pointerdown", function (e) {
      frame.setPointerCapture(e.pointerId);
      frame.classList.add("is-dragging");
      fromEvent(e);                     // a click alone jumps the divider there
      used();
      e.preventDefault();
    });

    frame.addEventListener("pointermove", function (e) {
      if (!frame.classList.contains("is-dragging")) return;
      fromEvent(e);
    });

    function stop(e) {
      if (!frame.classList.contains("is-dragging")) return;
      frame.classList.remove("is-dragging");
      try { frame.releasePointerCapture(e.pointerId); } catch (err) {}
    }
    frame.addEventListener("pointerup", stop);
    frame.addEventListener("pointercancel", stop);

    // Keyboard: the handle behaves as a slider.
    if (handle) {
      handle.addEventListener("keydown", function (e) {
        var cur = parseFloat(frame.style.getPropertyValue("--pos")) || 50;
        var step = e.shiftKey ? 10 : 2;
        var next = null;
        if (e.key === "ArrowLeft") next = cur - step;
        if (e.key === "ArrowRight") next = cur + step;
        if (e.key === "Home") next = 0;
        if (e.key === "End") next = 100;
        if (next === null) return;
        e.preventDefault();
        set(next);
        used();
      });
    }

    set(50);
  });
})();


/* Image comparison slider.
   Generic: it drives any .compare-frame on the page and never references a
   particular image. To reuse, copy the markup and change the two <img> sources
   and the two labels — nothing here needs editing. */

(function () {
  "use strict";

  var frames = Array.prototype.slice.call(document.querySelectorAll(".compare-frame"));
  if (!frames.length) return;

  frames.forEach(function (frame) {
    var handle = frame.querySelector(".compare-handle");
    var hint = frame.parentNode.querySelector(".compare-hint");
    var touched = false;

    function set(pct) {
      pct = Math.max(0, Math.min(100, pct));
      frame.style.setProperty("--pos", pct.toFixed(2) + "%");
      if (handle) handle.setAttribute("aria-valuenow", Math.round(pct));
    }

    function fromEvent(e) {
      var r = frame.getBoundingClientRect();
      if (!r.width) return;
      set(((e.clientX - r.left) / r.width) * 100);
    }

    function used() {
      if (touched || !hint) return;
      touched = true;
      hint.classList.add("is-gone");
    }

    frame.addEventListener("pointerdown", function (e) {
      frame.setPointerCapture(e.pointerId);
      frame.classList.add("is-dragging");
      fromEvent(e);                     // a click alone jumps the divider there
      used();
      e.preventDefault();
    });

    frame.addEventListener("pointermove", function (e) {
      if (!frame.classList.contains("is-dragging")) return;
      fromEvent(e);
    });

    function stop(e) {
      if (!frame.classList.contains("is-dragging")) return;
      frame.classList.remove("is-dragging");
      try { frame.releasePointerCapture(e.pointerId); } catch (err) {}
    }
    frame.addEventListener("pointerup", stop);
    frame.addEventListener("pointercancel", stop);

    // Keyboard: the handle behaves as a slider.
    if (handle) {
      handle.addEventListener("keydown", function (e) {
        var cur = parseFloat(frame.style.getPropertyValue("--pos")) || 50;
        var step = e.shiftKey ? 10 : 2;
        var next = null;
        if (e.key === "ArrowLeft") next = cur - step;
        if (e.key === "ArrowRight") next = cur + step;
        if (e.key === "Home") next = 0;
        if (e.key === "End") next = 100;
        if (next === null) return;
        e.preventDefault();
        set(next);
        used();
      });
    }

    set(50);
  });
})();


/* Works mosaic.
   Tiles keep their own proportions, so the grid is packed by giving each
   card a row span derived from its rendered height. Runs once images have
   their dimensions, and again on resize. */

(function () {
  "use strict";

  var grid = document.querySelector(".works-grid");
  if (!grid) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll(".work-card"));
  if (!cards.length) return;

  function unit(name, fallback) {
    var v = parseFloat(getComputedStyle(grid).getPropertyValue(name));
    return isNaN(v) ? fallback : v;
  }

  function layout() {
    // One column: let normal flow handle it.
    if (getComputedStyle(grid).gridTemplateColumns.split(" ").length < 2) {
      grid.classList.remove("is-tiled");
      cards.forEach(function (c) { c.style.gridRowEnd = ""; });
      return;
    }

    grid.classList.add("is-tiled");
    var row = unit("grid-auto-rows", 1);
    var gap = parseFloat(getComputedStyle(grid).getPropertyValue("column-gap"));
    if (isNaN(gap)) gap = 8;

    cards.forEach(function (card) {
      card.style.gridRowEnd = "";                 // measure unconstrained
      var h = card.getBoundingClientRect().height;
      if (!h) return;
      // Row gap is 0, so the spacing is carried inside the span. One row per
      // pixel means the gap below each tile is exactly the column gap.
      var span = Math.round(h / row) + Math.round(gap / row);
      card.style.gridRowEnd = "span " + span;
    });
  }

  // Images decide the height, so wait for each one.
  var pending = 0;
  cards.forEach(function (card) {
    var img = card.querySelector("img");
    if (img && !img.complete) {
      pending++;
      img.addEventListener("load", function () { if (--pending === 0) layout(); });
      img.addEventListener("error", function () { if (--pending === 0) layout(); });
    }
  });

  layout();
  if (pending === 0) layout();

  var t = null;
  window.addEventListener("resize", function () {
    clearTimeout(t);
    t = setTimeout(layout, 120);
  });
})();
