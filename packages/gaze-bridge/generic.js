/*
 * @afsr/gaze-bridge — generic gaze-to-click adapter for bundled apps.
 *
 * Auto-starts gaze tracking when the user has already calibrated
 * (localStorage.afsr_calibrated_at is set) and the user has not
 * explicitly disabled it (localStorage.afsr_gaze_enabled !== 'false').
 *
 * Adds two floating UI elements to the host page:
 *   - A toggle pill "Regard: ON / OFF" in the top-right corner.
 *   - A gaze cursor that follows the live gaze and synthesises a click
 *     when the user dwells on a clickable element for DWELL_MS.
 *
 * Both are position:fixed + high z-index, so they overlay the app
 * without interfering with its DOM.
 *
 * Requires /gaze-client/afsr-gaze.umd.js to be loaded first.
 */
(function () {
  "use strict";

  if (window.__afsrGazeBridgeLoaded) return;
  window.__afsrGazeBridgeLoaded = true;

  var DWELL_MS = 1000;
  var SMOOTHING = 0.25; // lower = more inertia; was 0.35
  var JUMP_PX = 400; // gaze samples farther than this from the last
                    // smoothed point are treated as a WebGazer glitch
                    // and ignored for SUPPRESS_AFTER_JUMP_MS.
  var SUPPRESS_AFTER_JUMP_MS = 200;
  var CENTER_LOCK_MS = 1500; // if the gaze sits near screen centre for
                             // this long, surface a "recalibrate" hint.
  var CENTER_LOCK_RADIUS_PX = 80;
  var CLICKABLE_SELECTOR =
    'button, a[href], input:not([type="hidden"]):not([disabled]), ' +
    'select:not([disabled]), textarea:not([disabled]), ' +
    '[role="button"], [role="link"], [role="checkbox"], [role="menuitem"], ' +
    '[role="tab"], [role="switch"], [onclick], ' +
    '[tabindex]:not([tabindex="-1"])';

  var STORAGE_ENABLED = "afsr_gaze_enabled";
  var STORAGE_CALIBRATED = "afsr_calibrated_at";

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

  function buildUI() {
    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.setAttribute("aria-live", "polite");
    toggle.style.cssText = [
      "position:fixed", "top:16px", "right:16px", "z-index:2147483000",
      "padding:0.55rem 1rem", "border-radius:999px",
      "border:2px solid rgba(255,255,255,0.3)",
      "background:rgba(11,13,18,0.85)", "color:#fff",
      "font:600 14px/1 system-ui, sans-serif", "cursor:pointer",
      "box-shadow:0 4px 12px rgba(0,0,0,0.3)",
    ].join(";");
    toggle.addEventListener("click", function () {
      if (state.enabled) disable(); else enable();
    });

    var home = document.createElement("a");
    home.href = "/";
    home.textContent = "← Portail";
    home.setAttribute("aria-label", "Retour au portail InterAACtion Web");
    home.style.cssText = [
      "position:fixed", "bottom:16px", "left:16px", "z-index:2147483000",
      "padding:0.55rem 1rem", "border-radius:999px",
      "border:2px solid rgba(255,255,255,0.3)",
      "background:rgba(11,13,18,0.85)", "color:#fff",
      "font:600 14px/1 system-ui, sans-serif",
      "text-decoration:none",
      "box-shadow:0 4px 12px rgba(0,0,0,0.3)",
    ].join(";");

    var hint = document.createElement("div");
    hint.setAttribute("role", "status");
    hint.setAttribute("aria-live", "polite");
    hint.style.cssText = [
      "position:fixed", "top:64px", "right:16px", "z-index:2147483000",
      "padding:0.5rem 0.85rem", "border-radius:var(--radius,8px)",
      "border:1px solid rgba(255,191,71,0.6)",
      "background:rgba(90,60,0,0.9)", "color:#ffe7a8",
      "font:500 13px/1.3 system-ui, sans-serif",
      "max-width:240px",
      "display:none",
      "box-shadow:0 4px 12px rgba(0,0,0,0.35)",
    ].join(";");

    var cursor = document.createElement("div");
    cursor.setAttribute("aria-hidden", "true");
    cursor.style.cssText = [
      "position:fixed", "top:0", "left:0",
      "width:44px", "height:44px", "border-radius:50%",
      "border:3px solid rgba(255,255,255,0.7)",
      "background:radial-gradient(circle, rgba(116,169,236,0.45) 0%, rgba(116,169,236,0) 70%)",
      "transform:translate(-50%,-50%)",
      "pointer-events:none", "z-index:2147482999",
      "display:none",
      "transition:border-color 120ms linear",
    ].join(";");

    var ring = document.createElement("div");
    ring.style.cssText = [
      "position:absolute", "inset:-8px", "border-radius:50%",
      "border:4px solid transparent",
      "border-top-color:#74a9ec",
      "transform:rotate(0deg)",
      "transition:transform 80ms linear, opacity 200ms linear",
      "opacity:0",
    ].join(";");
    cursor.appendChild(ring);

    document.body.appendChild(toggle);
    document.body.appendChild(home);
    document.body.appendChild(hint);
    document.body.appendChild(cursor);

    return { toggle: toggle, home: home, hint: hint, cursor: cursor, ring: ring };
  }

  function setToggleLabel() {
    ui.toggle.textContent = state.enabled ? "👁 Regard : ON" : "👁 Regard : OFF";
    ui.toggle.setAttribute(
      "aria-label",
      state.enabled
        ? "Désactiver le pilotage au regard"
        : "Activer le pilotage au regard",
    );
  }

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
    var init = { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y };
    target.dispatchEvent(new MouseEvent("mousedown", init));
    target.dispatchEvent(new MouseEvent("mouseup", init));
    target.dispatchEvent(new MouseEvent("click", init));
    // Flash to confirm
    ui.cursor.style.borderColor = "#4caf50";
    ui.ring.style.opacity = "0";
    setTimeout(function () {
      if (state.enabled) ui.cursor.style.borderColor = "rgba(255,255,255,0.7)";
    }, 250);
  }

  function onGaze(p) {
    var now = performance.now();

    // Glitch filter: drop samples that teleport far from the last
    // smoothed position. WebGazer occasionally snaps the prediction
    // back to screen centre when the face detector stutters; those
    // frames should not reset the dwell target.
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

    // Center-lock detection: if the gaze is stuck near the viewport
    // centre for CENTER_LOCK_MS, surface a recalibration hint.
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

    // Hit-test ignoring the cursor itself (pointer-events:none already
    // keeps elementFromPoint honest, but belt-and-braces hide it).
    var under = document.elementFromPoint(x, y);
    var target = findClickable(under);

    if (!target) {
      resetDwell();
      return;
    }

    if (target !== state.currentTarget) {
      state.currentTarget = target;
      state.dwellStart = performance.now();
      ui.ring.style.opacity = "1";
      ui.cursor.style.borderColor = "#74a9ec";
    }

    var elapsed = performance.now() - state.dwellStart;
    var progress = Math.min(1, elapsed / DWELL_MS);
    // Spin the ring's top border — at progress=1 it has rotated 360°.
    ui.ring.style.transform = "rotate(" + progress * 360 + "deg)";

    if (progress >= 1) {
      var snapshot = state.currentTarget;
      resetDwell();
      synthesiseClick(snapshot, x, y);
      // Debounce: force a fresh gaze sample before another dwell starts.
      state.currentTarget = snapshot;
      state.dwellStart = performance.now() + 200;
    }
  }

  async function enable() {
    if (state.enabled) return;
    if (!storageGet(STORAGE_CALIBRATED)) {
      // Require a calibration first. Send user over.
      var calib = "/calibration/";
      if (confirm(
        "Le suivi du regard n'est pas encore calibré. " +
        "Aller à la page de calibration maintenant ?",
      )) {
        window.location.href = calib;
      }
      return;
    }
    if (typeof AFSRGaze === "undefined") {
      console.warn("AFSRGaze not loaded — is /gaze-client/afsr-gaze.umd.js on the page?");
      return;
    }
    state.enabled = true;
    storageSet(STORAGE_ENABLED, "true");
    setToggleLabel();
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
    setToggleLabel();
  }

  function init() {
    if (!document.body) {
      document.addEventListener("DOMContentLoaded", init, { once: true });
      return;
    }
    ui = buildUI();
    setToggleLabel();

    var explicitlyDisabled = storageGet(STORAGE_ENABLED) === "false";
    var calibrated = !!storageGet(STORAGE_CALIBRATED);
    if (calibrated && !explicitlyDisabled) {
      // Let the page settle before asking the camera.
      setTimeout(enable, 500);
    }
  }

  init();
})();
