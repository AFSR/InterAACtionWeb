/* eslint-disable */
// Calibration flow for @afsr/gaze-client + WebGazer fallback.
//
// Nine targets arranged on a 3x3 grid. For each target:
//   1. Wait 500 ms so the user's gaze has time to land on it.
//   2. Accumulate gaze samples for 2000 ms, feeding every sample to
//      session.teachPoint(targetX, targetY) — WebGazer treats each call as
//      "the user was looking at this screen pixel when this gaze sample
//      was captured", which is exactly what we want.
//   3. Mark the target as done, move on.
//
// After the last target, move to the result stage with a "probe surface"
// that mirrors the live gaze, so the user can see how well calibration
// worked.
//
// Everything is keyboard-escapable at any time.

(function () {
  "use strict";

  var ui = {
    intro: document.getElementById("intro"),
    calibrating: document.getElementById("calibrating"),
    result: document.getElementById("result"),
    status: document.getElementById("statusBar"),
    startBtn: document.getElementById("startBtn"),
    abortBtn: document.getElementById("abortBtn"),
    restartBtn: document.getElementById("restartBtn"),
    grid: document.getElementById("grid"),
    currentPoint: document.getElementById("currentPoint"),
    totalPoints: document.getElementById("totalPoints"),
    resultSummary: document.getElementById("resultSummary"),
    probeSurface: document.getElementById("probeSurface"),
    probeDot: document.getElementById("probeDot"),
  };

  var GRID = [
    { r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 },
    { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 },
    { r: 2, c: 0 }, { r: 2, c: 1 }, { r: 2, c: 2 },
  ];
  var DWELL_MS = 2000;
  var PRE_DWELL_MS = 500;

  var state = {
    session: null,
    currentIndex: 0,
    samples: 0,
    active: false,
  };

  function show(stage) {
    [ui.intro, ui.calibrating, ui.result].forEach(function (el) {
      el.classList.add("hidden");
    });
    stage.classList.remove("hidden");
  }

  function setStatus(text, isError) {
    ui.status.textContent = text;
    ui.status.classList.toggle("error", !!isError);
  }

  function placeTargets() {
    ui.grid.innerHTML = "";
    var rect = ui.calibrating.getBoundingClientRect();
    var pad = 64;
    GRID.forEach(function (g, i) {
      var el = document.createElement("div");
      el.className = "cal-target";
      el.dataset.index = String(i);
      var x = pad + ((rect.width - 2 * pad) * g.c) / 2;
      var y = pad + ((rect.height - 2 * pad) * g.r) / 2;
      el.style.left = x + "px";
      el.style.top = y + "px";
      ui.grid.appendChild(el);
    });
  }

  function targetCoords(index) {
    var el = ui.grid.children[index];
    var rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  function runPoint(index) {
    return new Promise(function (resolve) {
      var el = ui.grid.children[index];
      ui.currentPoint.textContent = String(index + 1);
      state.currentIndex = index;
      state.samples = 0;
      el.classList.add("active");

      setTimeout(function () {
        var until = Date.now() + DWELL_MS;
        (function tick() {
          if (!state.active) return resolve();
          if (Date.now() >= until) {
            el.classList.remove("active");
            el.classList.add("done");
            return resolve();
          }
          // teachPoint is driven by gaze samples arriving via onGaze,
          // not by this loop. This tick just waits for the dwell to end.
          requestAnimationFrame(tick);
        })();
      }, PRE_DWELL_MS);
    });
  }

  async function runCalibration() {
    placeTargets();
    for (var i = 0; i < GRID.length; i++) {
      if (!state.active) break;
      await runPoint(i);
    }
    if (state.active) finish();
  }

  function onGazeDuringCalibration(p) {
    if (!state.active) return;
    var t = targetCoords(state.currentIndex);
    // Teach: associate the current gaze sample (whatever WebGazer thinks
    // the user is looking at) with the ground-truth target position.
    state.session.teachPoint(t.x, t.y);
    state.samples++;
  }

  function onGazeDuringProbe(p) {
    var rect = ui.probeSurface.getBoundingClientRect();
    var relX = p.x - rect.left;
    var relY = p.y - rect.top;
    if (relX < 0 || relY < 0 || relX > rect.width || relY > rect.height) {
      ui.probeDot.style.display = "none";
      return;
    }
    ui.probeDot.style.display = "block";
    ui.probeDot.style.left = relX + "px";
    ui.probeDot.style.top = relY + "px";
  }

  function onStatus(s) {
    var map = {
      "connecting-companion": "Recherche de l'application compagnon…",
      "loading-webgazer": "Chargement du suivi par webcam (1,9 Mo)…",
      "tobii-active": "Eye-tracker Tobii détecté, calibration matérielle gérée à part.",
      "webgazer-active": "Caméra active.",
      "error": "Échec de l'initialisation du suivi du regard.",
      "stopped": "Suivi arrêté.",
      "idle": "Prêt.",
    };
    if (map[s]) setStatus(map[s], s === "error");
  }

  async function start() {
    ui.startBtn.disabled = true;
    setStatus("Initialisation…");
    try {
      state.session = await AFSRGaze.startGazeTracking({
        publicPath: "/gaze-client",
        onStatus: onStatus,
        onGaze: function (p) {
          // Route gaze samples to whichever phase is live.
          if (!ui.calibrating.classList.contains("hidden")) {
            onGazeDuringCalibration(p);
          } else if (!ui.result.classList.contains("hidden")) {
            onGazeDuringProbe(p);
          }
        },
        onError: function (e) {
          setStatus("Erreur : " + e.message, true);
        },
      });
    } catch (e) {
      setStatus("Impossible de démarrer : " + e.message, true);
      ui.startBtn.disabled = false;
      return;
    }

    if (state.session.source === "tobii") {
      // No calibration needed — bail out to result directly.
      state.active = false;
      show(ui.result);
      ui.resultSummary.textContent =
        "Eye-tracker Tobii détecté via l'application compagnon. " +
        "La calibration matérielle est gérée en dehors de cette page.";
      ui.probeSurface.style.display = "none";
      setCalibrated("tobii");
      return;
    }

    // WebGazer path: run the 9-point flow.
    state.active = true;
    show(ui.calibrating);
    await runCalibration();
  }

  function finish() {
    state.active = false;
    show(ui.result);
    ui.resultSummary.textContent =
      "9 points calibrés avec " + state.samples + " échantillons de regard. " +
      "La précision dépend de la stabilité de votre posture face à la caméra — " +
      "si le cercle bleu ci-dessous ne suit pas bien votre regard, relancez la calibration.";
    setCalibrated("webgazer");
  }

  function abort() {
    state.active = false;
    if (state.session) {
      try { state.session.stop(); } catch (_) { /* ignore */ }
      state.session = null;
    }
    show(ui.intro);
    ui.startBtn.disabled = false;
    setStatus("Calibration annulée.");
  }

  function setCalibrated(source) {
    try {
      localStorage.setItem("afsr_calibrated_at", String(Date.now()));
      localStorage.setItem("afsr_calibration_source", source);
    } catch (_) { /* quota / private mode */ }
  }

  ui.startBtn.addEventListener("click", start);
  ui.abortBtn.addEventListener("click", abort);
  ui.restartBtn.addEventListener("click", function () {
    if (state.session) {
      try { state.session.clearCalibration(); } catch (_) { /* ignore */ }
      try { state.session.stop(); } catch (_) { /* ignore */ }
      state.session = null;
    }
    show(ui.intro);
    ui.startBtn.disabled = false;
    setStatus("Prêt.");
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !ui.calibrating.classList.contains("hidden")) {
      abort();
    }
  });

  // If AFSRGaze didn't load, tell the user straight away.
  if (typeof AFSRGaze === "undefined") {
    ui.startBtn.disabled = true;
    setStatus("Le module de suivi du regard n'a pas pu se charger (/gaze-client/). Réessayez plus tard.", true);
  }
})();
