/*
 * @afsr/gaze-bridge — unified chrome + gaze-to-click adapter for the
 * InterAACtion app suite.
 *
 * Injects a single top-centre app bar into every host page so users get
 * the same controls in AugCom, InterAACtionScene, InterAACtionPlayer
 * and GazePlay:
 *
 *   [logo]  AugCom        ⏎ Portail   👁 Regard ON
 *
 *   - "⏎ Portail" goes to /, every time, in every app.
 *   - "👁 Regard ON/OFF" enables or disables gaze piloting locally.
 *     State persists in localStorage.afsr_gaze_enabled.
 *
 * Plus the floating helpers from earlier versions:
 *   - A gaze cursor with a dwell-progress ring.
 *   - A "Recalibrer" hint when the predictor sticks near screen centre.
 *
 * Auto-starts gaze tracking when the user has already calibrated
 * (localStorage.afsr_calibrated_at) and has not flipped the toggle off.
 *
 * Requires /gaze-client/afsr-gaze.umd.js to be loaded first.
 */
(function () {
  "use strict";

  if (window.__afsrGazeBridgeLoaded) return;
  window.__afsrGazeBridgeLoaded = true;

  // ---- Tunables ----
  var DWELL_MS = 1000;
  // Higher = more responsive, less smoothing. WebGazer emits at ~20 Hz
  // (50 ms cadence) so the EMA convergence time is ~ N samples to 90 %
  // for k = 0.55 → 3 samples ≈ 150 ms (perceived as snappy). Going
  // lower (k = 0.25) felt smooth but laggy in field testing.
  var SMOOTHING = 0.55;
  // Only drop *truly* bad samples — head turns can move the predicted
  // gaze 500+ px in one frame and that's normal. 400 px was over-eager.
  var JUMP_PX = 700;
  var SUPPRESS_AFTER_JUMP_MS = 120;
  var CENTER_LOCK_MS = 1500;
  var CENTER_LOCK_RADIUS_PX = 80;
  var CLICKABLE_SELECTOR =
    'button, a[href], input:not([type="hidden"]):not([disabled]), ' +
    'select:not([disabled]), textarea:not([disabled]), ' +
    '[role="button"], [role="link"], [role="checkbox"], [role="menuitem"], ' +
    '[role="tab"], [role="switch"], [onclick], ' +
    '[tabindex]:not([tabindex="-1"])';

  var STORAGE_ENABLED = "afsr_gaze_enabled";
  var STORAGE_CALIBRATED = "afsr_calibrated_at";

  // iPhone/iPad: WebGazer + MediaPipe runs but the experience is
  // CPU-bound and battery-hungry. Don't auto-start the predictor on
  // first load — leave it to the user to opt in via the toggle.
  var IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  // App name derived from the first URL segment so the bar reads the
  // same as the portal landing card.
  var APP_NAMES = {
    augcom: "AugCom",
    scene: "InterAACtionScene",
    player: "InterAACtionPlayer",
    gazeplay: "GazePlay",
    calibration: "Calibration",
  };

  // Mirrors portal/assets/tokens.css. Inline copies because this script
  // runs inside third-party apps that don't load our stylesheet.
  var CHROME = {
    bg:        "rgba(11,13,18,0.88)",
    bgHover:   "rgba(11,13,18,0.96)",
    fg:        "#ffffff",
    muted:     "rgba(255,255,255,0.65)",
    border:    "rgba(255,255,255,0.16)",
    borderHi:  "rgba(255,255,255,0.32)",
    accent:    "#74a9ec",
    accentBg:  "rgba(116,169,236,0.45)",
    success:   "#4caf50",
    warning:   "rgba(255,191,71,0.6)",
    warningBg: "rgba(90,60,0,0.92)",
    warningFg: "#ffe7a8",
    shadow:    "0 8px 24px rgba(0,0,0,0.35)",
    font:      '500 14px/1 "Inter", system-ui, -apple-system, sans-serif',
    fontBold:  '600 14px/1 "Inter", system-ui, -apple-system, sans-serif',
    fontTitle: '700 14px/1 "Inter", system-ui, -apple-system, sans-serif',
    radius:    "12px",
    radiusPill:"999px",
    zChrome:   "2147483000",
    zCursor:   "2147482999",
  };

  // ---- State ----
  var state = {
    session: null,
    enabled: false,
    smoothedX: null,
    smoothedY: null,
    currentTarget: null,
    dwellStart: 0,
    suppressUntil: 0,
    centerLockedSince: 0,
    warnedCenterLock: false,
  };

  var ui = null;

  function storageGet(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }
  function storageSet(key, val) {
    try { localStorage.setItem(key, val); } catch (_) { /* ignore */ }
  }

  function appNameFromUrl() {
    var seg = (location.pathname.split("/")[1] || "").toLowerCase();
    return APP_NAMES[seg] || null;
  }

  function styleEl(el, props) {
    el.style.cssText = props.join(";");
  }

  // Reference an icon from the shared sprite at /assets/icons.svg.
  // We use SVG <use> so the same source of truth (portal/assets/
  // icons.svg) is shared with the portal and the GazePlay hub.
  function iconSvg(id, size) {
    size = size || 18;
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", String(size));
    svg.setAttribute("height", String(size));
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.style.flex = "0 0 auto";
    var use = document.createElementNS(ns, "use");
    use.setAttribute("href", "/assets/icons.svg#" + id);
    svg.appendChild(use);
    return svg;
  }

  function makeBarBtn(iconId, label, ariaLabel) {
    var b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", ariaLabel);
    var icon = iconSvg(iconId, 18);
    var span = document.createElement("span");
    span.textContent = label;
    span.style.cssText = "white-space:nowrap";
    b.appendChild(icon);
    b.appendChild(span);
    styleEl(b, [
      "appearance:none",
      "border:1px solid " + CHROME.border,
      "background:transparent",
      "color:" + CHROME.fg,
      "padding:0.45rem 0.85rem",
      "border-radius:" + CHROME.radiusPill,
      "font:" + CHROME.fontBold,
      "cursor:pointer",
      "white-space:nowrap",
      "display:inline-flex",
      "align-items:center",
      "gap:0.4rem",
      "transition:border-color 150ms ease, background 150ms ease, color 150ms ease",
    ]);
    b.addEventListener("mouseenter", function () {
      b.style.borderColor = CHROME.borderHi;
      b.style.background = "rgba(255,255,255,0.06)";
    });
    b.addEventListener("mouseleave", function () {
      b.style.borderColor = CHROME.border;
      b.style.background = "transparent";
    });
    return b;
  }

  // ---- UI construction ----
  function buildUI() {
    // Top-centre app bar
    var bar = document.createElement("div");
    bar.setAttribute("role", "toolbar");
    bar.setAttribute("aria-label", "Barre InterAACtion");
    styleEl(bar, [
      "position:fixed",
      "top:max(12px, env(safe-area-inset-top))",
      "left:50%",
      "transform:translateX(-50%)",
      "z-index:" + CHROME.zChrome,
      "display:flex",
      "align-items:center",
      "gap:0.75rem",
      "padding:0.4rem 0.6rem 0.4rem 0.75rem",
      "background:" + CHROME.bg,
      "color:" + CHROME.fg,
      "border:1px solid " + CHROME.border,
      "border-radius:" + CHROME.radiusPill,
      "box-shadow:" + CHROME.shadow,
      "font:" + CHROME.font,
      "backdrop-filter:saturate(160%) blur(10px)",
      "-webkit-backdrop-filter:saturate(160%) blur(10px)",
      "max-width:calc(100vw - 24px)",
      "transition:opacity 150ms ease, transform 150ms ease",
    ]);

    // Brand: small gradient dot + product name
    var brand = document.createElement("a");
    brand.href = "/";
    brand.setAttribute("aria-label", "Accueil InterAACtion Web");
    styleEl(brand, [
      "display:inline-flex",
      "align-items:center",
      "gap:0.5rem",
      "color:inherit",
      "text-decoration:none",
      "padding-right:0.55rem",
      "border-right:1px solid " + CHROME.border,
    ]);
    // Brand uses the shared logo from /assets/icons.svg so the same
    // identity is reused on the portal, calibration page and every app.
    var brandIcon = iconSvg("icon-logo", 22);
    var brandName = document.createElement("span");
    brandName.textContent = "InterAACtion";
    styleEl(brandName, ["font:" + CHROME.fontTitle, "letter-spacing:-0.01em"]);
    brand.appendChild(brandIcon);
    brand.appendChild(brandName);

    // App label
    var appLabel = document.createElement("span");
    var appName = appNameFromUrl();
    appLabel.textContent = appName || "";
    styleEl(appLabel, [
      "color:" + CHROME.muted,
      "font:" + CHROME.font,
      "white-space:nowrap",
      "max-width:14ch",
      "overflow:hidden",
      "text-overflow:ellipsis",
    ]);
    if (!appName) appLabel.style.display = "none";

    // Calibrate button
    var calibrate = makeBarBtn(
      "icon-calibrate",
      "Calibrer",
      "Recalibrer le suivi du regard",
    );
    calibrate.addEventListener("click", function () {
      window.location.href = "/calibration/";
    });

    // Gaze toggle
    var toggle = makeBarBtn(
      "icon-eye",
      "Regard",
      "Activer ou désactiver le pilotage au regard",
    );
    toggle.addEventListener("click", function () {
      if (state.enabled) disable(); else enable();
    });

    // Portal button
    var portal = makeBarBtn(
      "icon-home",
      "Portail",
      "Retour au portail InterAACtion Web",
    );
    portal.addEventListener("click", function () {
      window.location.href = "/";
    });

    bar.appendChild(brand);
    bar.appendChild(appLabel);
    bar.appendChild(calibrate);
    bar.appendChild(toggle);
    bar.appendChild(portal);
    bar.appendChild(toggle);

    // Floating recalibration hint (only shown when the predictor wedges)
    var hint = document.createElement("div");
    hint.setAttribute("role", "status");
    hint.setAttribute("aria-live", "polite");
    styleEl(hint, [
      "position:fixed",
      "top:64px",
      "left:50%",
      "transform:translateX(-50%)",
      "z-index:" + CHROME.zChrome,
      "padding:0.5rem 0.85rem",
      "border-radius:" + CHROME.radius,
      "border:1px solid " + CHROME.warning,
      "background:" + CHROME.warningBg,
      "color:" + CHROME.warningFg,
      'font:500 13px/1.3 "Inter", system-ui, sans-serif',
      "max-width:300px",
      "display:none",
      "box-shadow:" + CHROME.shadow,
    ]);

    // Floating gaze cursor
    var cursor = document.createElement("div");
    cursor.setAttribute("aria-hidden", "true");
    styleEl(cursor, [
      "position:fixed", "top:0", "left:0",
      "width:44px", "height:44px",
      "border-radius:50%",
      "border:3px solid rgba(255,255,255,0.7)",
      "background:radial-gradient(circle, " + CHROME.accentBg + " 0%, rgba(116,169,236,0) 70%)",
      "transform:translate(-50%,-50%)",
      "pointer-events:none",
      "z-index:" + CHROME.zCursor,
      "display:none",
      "transition:border-color 120ms linear",
    ]);
    var ring = document.createElement("div");
    styleEl(ring, [
      "position:absolute",
      "inset:-8px",
      "border-radius:50%",
      "border:4px solid transparent",
      "border-top-color:" + CHROME.accent,
      "transform:rotate(0deg)",
      "transition:transform 80ms linear, opacity 200ms linear",
      "opacity:0",
    ]);
    cursor.appendChild(ring);

    document.body.appendChild(bar);
    document.body.appendChild(hint);
    document.body.appendChild(cursor);

    return { bar: bar, toggle: toggle, hint: hint, cursor: cursor, ring: ring };
  }

  function setToggleState() {
    var suffix = IS_IOS ? " (exp.)" : "";
    var labelSpan = ui.toggle.querySelector("span");
    var useEl = ui.toggle.querySelector("svg use");
    if (state.enabled) {
      if (labelSpan) labelSpan.textContent = "Regard ON" + suffix;
      if (useEl) useEl.setAttribute("href", "/assets/icons.svg#icon-eye");
      ui.toggle.style.borderColor = CHROME.accent;
      ui.toggle.style.color = CHROME.accent;
      ui.toggle.setAttribute("aria-pressed", "true");
    } else {
      if (labelSpan) labelSpan.textContent = "Regard OFF" + suffix;
      if (useEl) useEl.setAttribute("href", "/assets/icons.svg#icon-eye-off");
      ui.toggle.style.borderColor = CHROME.border;
      ui.toggle.style.color = CHROME.fg;
      ui.toggle.setAttribute("aria-pressed", "false");
    }
  }

  // ---- Dwell engine ----
  function resetDwell() {
    state.currentTarget = null;
    state.dwellStart = 0;
    ui.ring.style.opacity = "0";
    ui.ring.style.transform = "rotate(0deg)";
    ui.cursor.style.borderColor = "rgba(255,255,255,0.7)";
  }

  function findClickable(el) {
    if (!el) return null;
    return el.closest ? el.closest(CLICKABLE_SELECTOR) : null;
  }

  function synthesiseClick(target, x, y) {
    // Recalibrate WebGazer with this click's coordinates *before* we
    // dispatch, so the regression learns "the user was looking around
    // here when they clicked here". WebGazer's own document click
    // listener will also catch the dispatched event (capture phase),
    // but we call recordScreenPosition directly so it works even if
    // addMouseEventListeners was disabled or the dispatch fails to
    // bubble (some Angular components stopPropagation on click).
    if (window.webgazer && typeof window.webgazer.recordScreenPosition === "function") {
      try { window.webgazer.recordScreenPosition(x, y, "click"); } catch (_) { /* ignore */ }
    }
    var init = { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y };
    target.dispatchEvent(new MouseEvent("mousedown", init));
    target.dispatchEvent(new MouseEvent("mouseup", init));
    target.dispatchEvent(new MouseEvent("click", init));
    ui.cursor.style.borderColor = CHROME.success;
    ui.ring.style.opacity = "0";
    setTimeout(function () {
      if (state.enabled) ui.cursor.style.borderColor = "rgba(255,255,255,0.7)";
    }, 250);
  }

  function onGaze(p) {
    var now = performance.now();

    if (state.smoothedX !== null) {
      var dx = p.x - state.smoothedX;
      var dy = p.y - state.smoothedY;
      if (dx * dx + dy * dy > JUMP_PX * JUMP_PX) {
        state.suppressUntil = now + SUPPRESS_AFTER_JUMP_MS;
        return;
      }
    }
    if (now < state.suppressUntil) return;

    if (state.smoothedX === null) {
      state.smoothedX = p.x;
      state.smoothedY = p.y;
    } else {
      state.smoothedX = state.smoothedX * (1 - SMOOTHING) + p.x * SMOOTHING;
      state.smoothedY = state.smoothedY * (1 - SMOOTHING) + p.y * SMOOTHING;
    }
    var x = state.smoothedX;
    var y = state.smoothedY;

    var cx = window.innerWidth / 2;
    var cy = window.innerHeight / 2;
    var nearCentre =
      (x - cx) * (x - cx) + (y - cy) * (y - cy) <
      CENTER_LOCK_RADIUS_PX * CENTER_LOCK_RADIUS_PX;
    if (nearCentre) {
      if (!state.centerLockedSince) state.centerLockedSince = now;
      if (!state.warnedCenterLock && now - state.centerLockedSince > CENTER_LOCK_MS) {
        state.warnedCenterLock = true;
        ui.hint.innerHTML =
          'Le regard semble bloqué au centre. ' +
          '<a style="color:#ffe7a8;text-decoration:underline" href="/calibration/">Recalibrer</a>';
        ui.hint.style.display = "block";
      }
    } else {
      state.centerLockedSince = 0;
      if (state.warnedCenterLock) {
        state.warnedCenterLock = false;
        ui.hint.style.display = "none";
      }
    }

    ui.cursor.style.left = x + "px";
    ui.cursor.style.top = y + "px";
    ui.cursor.style.display = "block";

    var under = document.elementFromPoint(x, y);
    var target = findClickable(under);

    // Don't dwell on our own bar — it's chrome.
    if (target && ui.bar.contains(target)) {
      // Bar buttons stay clickable; the dwell logic still applies inside
      // them (so the user can use the bar with their gaze too) but with
      // the same ring as everywhere else. No special-casing needed.
    }

    if (!target) {
      resetDwell();
      return;
    }

    if (target !== state.currentTarget) {
      state.currentTarget = target;
      state.dwellStart = now;
      ui.ring.style.opacity = "1";
      ui.cursor.style.borderColor = CHROME.accent;
    }

    var elapsed = now - state.dwellStart;
    var progress = Math.min(1, elapsed / DWELL_MS);
    ui.ring.style.transform = "rotate(" + progress * 360 + "deg)";

    if (progress >= 1) {
      var snapshot = state.currentTarget;
      resetDwell();
      synthesiseClick(snapshot, x, y);
      state.currentTarget = snapshot;
      state.dwellStart = now + 200;
    }
  }

  // ---- Tracking lifecycle ----
  async function enable() {
    if (state.enabled) return;
    if (!storageGet(STORAGE_CALIBRATED)) {
      if (confirm(
        "Le suivi du regard n'est pas encore calibré. Aller à la page de calibration maintenant ?",
      )) {
        window.location.href = "/calibration/";
      }
      return;
    }
    if (typeof AFSRGaze === "undefined") {
      console.warn("AFSRGaze not loaded — is /gaze-client/afsr-gaze.umd.js on the page?");
      return;
    }
    state.enabled = true;
    storageSet(STORAGE_ENABLED, "true");
    setToggleState();
    try {
      state.session = await AFSRGaze.startGazeTracking({
        publicPath: "/gaze-client",
        onGaze: onGaze,
        onError: function (e) { console.warn("[gaze-bridge]", e); },
      });
    } catch (e) {
      console.error("[gaze-bridge] failed to start:", e);
      disable();
    }
  }

  function disable() {
    state.enabled = false;
    storageSet(STORAGE_ENABLED, "false");
    if (state.session) {
      try { state.session.stop(); } catch (_) { /* ignore */ }
      state.session = null;
    }
    resetDwell();
    ui.cursor.style.display = "none";
    setToggleState();
  }

  // ---- Init ----
  function init() {
    if (!document.body) {
      document.addEventListener("DOMContentLoaded", init, { once: true });
      return;
    }
    ui = buildUI();
    setToggleState();

    var explicitlyDisabled = storageGet(STORAGE_ENABLED) === "false";
    var explicitlyEnabled = storageGet(STORAGE_ENABLED) === "true";
    var calibrated = !!storageGet(STORAGE_CALIBRATED);
    // Auto-start only on non-iOS once the user has both calibrated and
    // not flipped the toggle off. On iOS, only start if the user
    // explicitly opted in this session (toggle was last set to "true").
    var shouldAutoStart = calibrated && !explicitlyDisabled &&
      (!IS_IOS || explicitlyEnabled);
    if (shouldAutoStart) {
      setTimeout(enable, 500);
    }
  }

  init();
})();
