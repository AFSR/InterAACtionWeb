/* eslint-disable */
// Calibration flow for @afsr/gaze-client + WebGazer fallback.
//
// Nine targets arranged on a 3x3 grid, dwell-based (no click needed).
// After calibration, the result stage lets the user save the learned
// regression under a named profile, or load an existing one from the
// intro stage to skip calibration altogether.

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
    saveBtn: document.getElementById("saveBtn"),
    grid: document.getElementById("grid"),
    currentPoint: document.getElementById("currentPoint"),
    totalPoints: document.getElementById("totalPoints"),
    resultSummary: document.getElementById("resultSummary"),
    probeDot: document.getElementById("probeDot"),
    profileList: document.getElementById("profileList"),
    importBtn: document.getElementById("importBtn"),
    importFile: document.getElementById("importFile"),
  };

  var isSafari =
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent) &&
    !/CriOS|FxiOS|EdgiOS/i.test(navigator.userAgent);

  // 4x4 grid (16 points). 9 points only constrains a noisy linear
  // mapping; the predictor sometimes settles into a diagonal bias that
  // 16 well-distributed targets break out of.
  var GRID = (function () {
    var g = [];
    for (var r = 0; r < 4; r++) {
      for (var c = 0; c < 4; c++) g.push({ r: r, c: c });
    }
    return g;
  })();
  var GRID_DENOM = 3; // (rows-1) and (cols-1) for placement.
  var DWELL_MS = 2500;
  var PRE_DWELL_MS = 600;

  var state = {
    session: null,
    currentIndex: 0,
    samples: 0,
    active: false,
    loadedProfile: null,
  };

  // ---------- stage routing ----------

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

  // ---------- calibration ----------

  function placeTargets() {
    ui.grid.innerHTML = "";
    var rect = ui.calibrating.getBoundingClientRect();
    var pad = 64;
    GRID.forEach(function (g, i) {
      var el = document.createElement("div");
      el.className = "cal-target";
      el.dataset.index = String(i);
      var x = pad + ((rect.width - 2 * pad) * g.c) / GRID_DENOM;
      var y = pad + ((rect.height - 2 * pad) * g.r) / GRID_DENOM;
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

  function onGazeDuringCalibration(_p) {
    if (!state.active) return;
    var t = targetCoords(state.currentIndex);
    state.session.teachPoint(t.x, t.y);
    state.samples++;
  }

  function onGazeDuringProbe(p) {
    ui.probeDot.style.display = "block";
    ui.probeDot.style.left = p.x + "px";
    ui.probeDot.style.top = p.y + "px";
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

  // ---------- start / stop ----------

  async function start(fromProfile) {
    if (isSafari) {
      setStatus(
        "Safari ne supporte pas encore le suivi par webcam pour cette application. " +
          "Utilisez Chrome, Edge ou Firefox en attendant.",
        true,
      );
      return;
    }
    ui.startBtn.disabled = true;
    setStatus("Initialisation…");
    try {
      state.session = await AFSRGaze.startGazeTracking({
        publicPath: "/gaze-client",
        onStatus: onStatus,
        onGaze: function (p) {
          if (!ui.calibrating.classList.contains("hidden")) {
            onGazeDuringCalibration(p);
          } else if (!ui.result.classList.contains("hidden")) {
            onGazeDuringProbe(p);
          }
        },
        onError: function (e) { setStatus("Erreur : " + e.message, true); },
      });
    } catch (e) {
      setStatus("Impossible de démarrer : " + e.message, true);
      ui.startBtn.disabled = false;
      return;
    }

    if (state.session.source === "tobii") {
      state.active = false;
      show(ui.result);
      ui.resultSummary.textContent =
        "Eye-tracker Tobii détecté via l'application compagnon. " +
        "La calibration matérielle est gérée en dehors de cette page.";
      ui.saveBtn.hidden = true;
      setCalibrated("tobii");
      return;
    }

    if (fromProfile) {
      // Profile was already loaded into WebGazer storage before begin().
      // Skip the 9-point flow; go straight to the live probe.
      state.active = false;
      show(ui.result);
      ui.resultSummary.textContent =
        'Profil "' + fromProfile.name + '" rechargé. ' +
        'Si le cercle bleu ne suit plus bien, recommencez la calibration.';
      ui.saveBtn.hidden = true;
      setCalibrated("webgazer");
      return;
    }

    state.active = true;
    ui.saveBtn.hidden = false;
    show(ui.calibrating);
    await runCalibration();
  }

  function finish() {
    state.active = false;
    show(ui.result);
    ui.resultSummary.textContent =
      GRID.length + " points calibrés. " +
      "La calibration s'affine ensuite à chaque clic dans les applications. " +
      "Donnez un nom au profil pour le retrouver plus tard, ou relancez la calibration si le cercle ne suit pas bien.";
    ui.saveBtn.hidden = false;
    setCalibrated("webgazer");
  }

  function abort() {
    state.active = false;
    if (state.session) {
      try { state.session.stop(); } catch (_) { /* ignore */ }
      state.session = null;
    }
    ui.probeDot.style.display = "none";
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

  // ---------- profiles ----------

  function fmtWhen(ts) {
    try {
      return new Date(ts).toLocaleString("fr-FR", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch (_) { return String(ts); }
  }

  async function renderProfiles() {
    if (!AFSRGaze || !AFSRGaze.listCalibrationProfiles) return;
    var list;
    try { list = await AFSRGaze.listCalibrationProfiles(); }
    catch (_) { list = []; }
    ui.profileList.innerHTML = "";
    if (list.length === 0) {
      var empty = document.createElement("li");
      empty.className = "empty";
      empty.textContent = "Aucun profil enregistré pour l'instant.";
      ui.profileList.appendChild(empty);
      return;
    }
    list.forEach(function (p) {
      var item = document.createElement("li");
      item.className = "profile-item";
      item.innerHTML =
        '<div class="meta">' +
        '<strong></strong>' +
        '<span class="when"></span>' +
        '</div>' +
        '<div class="actions">' +
        '<button type="button" data-act="load">Charger</button>' +
        '<button type="button" data-act="export">Exporter</button>' +
        '<button type="button" class="danger" data-act="delete">Supprimer</button>' +
        '</div>';
      item.querySelector("strong").textContent = p.name;
      item.querySelector(".when").textContent = fmtWhen(p.createdAt);
      item.querySelectorAll("button").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var act = btn.getAttribute("data-act");
          if (act === "load") loadProfile(p);
          else if (act === "export") exportProfile(p);
          else if (act === "delete") removeProfile(p);
        });
      });
      ui.profileList.appendChild(item);
    });
  }

  async function loadProfile(p) {
    setStatus('Chargement du profil "' + p.name + '"…');
    ui.startBtn.disabled = true;
    try {
      var ok = await AFSRGaze.loadCalibrationProfile(p.id);
      if (!ok) {
        setStatus("Impossible de charger ce profil.", true);
        ui.startBtn.disabled = false;
        return;
      }
      await start(p);
    } catch (e) {
      setStatus("Erreur : " + (e.message || e), true);
      ui.startBtn.disabled = false;
    }
  }

  async function exportProfile(p) {
    try {
      var json = AFSRGaze.exportCalibrationProfile(p);
      var blob = new Blob([json], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "afsr-calibration-" + p.name.replace(/[^\w-]+/g, "_") + ".json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    } catch (e) {
      setStatus("Erreur d'export : " + (e.message || e), true);
    }
  }

  async function removeProfile(p) {
    if (!confirm('Supprimer le profil "' + p.name + '" ? Cette action est définitive.')) return;
    try {
      await AFSRGaze.deleteCalibrationProfile(p.id);
      await renderProfiles();
      setStatus('Profil "' + p.name + '" supprimé.');
    } catch (_) { /* ignore */ }
  }

  async function handleSave() {
    if (!AFSRGaze || !AFSRGaze.saveCalibrationProfile) return;
    var defaultName = "Calibration " + new Date().toLocaleDateString("fr-FR");
    var name = prompt("Donnez un nom au profil :", defaultName);
    if (name === null) return;
    var saved = await AFSRGaze.saveCalibrationProfile(name);
    if (!saved) {
      setStatus("Rien à enregistrer (aucune calibration active).", true);
      return;
    }
    setStatus('Profil "' + saved.name + '" enregistré.');
    await renderProfiles();
  }

  async function handleImport(file) {
    try {
      var text = await file.text();
      var saved = await AFSRGaze.importCalibrationProfile(text);
      if (!saved) {
        setStatus("Fichier invalide ou format inattendu.", true);
        return;
      }
      setStatus('Profil "' + saved.name + '" importé.');
      await renderProfiles();
    } catch (e) {
      setStatus("Erreur d'import : " + (e.message || e), true);
    }
  }

  // ---------- wiring ----------

  ui.startBtn.addEventListener("click", function () { start(null); });
  ui.abortBtn.addEventListener("click", abort);
  ui.restartBtn.addEventListener("click", function () {
    if (state.session) {
      try { state.session.clearCalibration(); } catch (_) { /* ignore */ }
      try { state.session.stop(); } catch (_) { /* ignore */ }
      state.session = null;
    }
    ui.probeDot.style.display = "none";
    show(ui.intro);
    ui.startBtn.disabled = false;
    setStatus("Prêt.");
    renderProfiles();
  });
  if (ui.saveBtn) ui.saveBtn.addEventListener("click", handleSave);
  if (ui.importBtn) ui.importBtn.addEventListener("click", function () { ui.importFile.click(); });
  if (ui.importFile) ui.importFile.addEventListener("change", function () {
    var f = ui.importFile.files && ui.importFile.files[0];
    if (f) handleImport(f);
    ui.importFile.value = "";
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !ui.calibrating.classList.contains("hidden")) abort();
  });

  if (typeof AFSRGaze === "undefined") {
    ui.startBtn.disabled = true;
    setStatus("Le module de suivi du regard n'a pas pu se charger (/gaze-client/). Réessayez plus tard.", true);
  } else {
    renderProfiles();
  }
})();
