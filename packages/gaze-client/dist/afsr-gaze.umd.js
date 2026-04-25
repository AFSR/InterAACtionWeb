"use strict";
var AFSRGaze = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/index.ts
  var index_exports = {};
  __export(index_exports, {
    deleteCalibrationProfile: () => deleteCalibrationProfile,
    exportCalibrationProfile: () => exportCalibrationProfile,
    importCalibrationProfile: () => importCalibrationProfile,
    listCalibrationProfiles: () => listCalibrationProfiles,
    loadCalibrationProfile: () => loadCalibrationProfile,
    saveCalibrationProfile: () => saveCalibrationProfile,
    startGazeTracking: () => startGazeTracking
  });

  // src/profiles.ts
  var LOCALFORAGE_DB = "localforage";
  var LOCALFORAGE_STORE = "keyvaluepairs";
  var WEBGAZER_KEY = "webgazerGlobalData";
  var PROFILES_DB = "afsr-gaze";
  var PROFILES_STORE = "profiles";
  var PROFILES_VERSION = 1;
  function openDB(name, version, upgrade) {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(name, version);
      if (upgrade) {
        req.onupgradeneeded = () => upgrade(req.result);
      }
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        var _a;
        return reject((_a = req.error) != null ? _a : new Error("IndexedDB open failed"));
      };
      req.onblocked = () => reject(new Error("IndexedDB open blocked by another tab"));
    });
  }
  function promisify(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        var _a;
        return reject((_a = req.error) != null ? _a : new Error("IndexedDB request failed"));
      };
    });
  }
  async function openProfilesDB() {
    return openDB(PROFILES_DB, PROFILES_VERSION, (db) => {
      if (!db.objectStoreNames.contains(PROFILES_STORE)) {
        db.createObjectStore(PROFILES_STORE, { keyPath: "id" });
      }
    });
  }
  async function readWebgazerBlob() {
    try {
      const db = await openDB(LOCALFORAGE_DB, 2);
      if (!db.objectStoreNames.contains(LOCALFORAGE_STORE)) {
        db.close();
        return null;
      }
      const tx = db.transaction(LOCALFORAGE_STORE, "readonly");
      const store = tx.objectStore(LOCALFORAGE_STORE);
      const blob = await promisify(store.get(WEBGAZER_KEY));
      db.close();
      return blob != null ? blob : null;
    } catch (e) {
      return null;
    }
  }
  async function writeWebgazerBlob(blob) {
    try {
      const db = await openDB(LOCALFORAGE_DB, 2);
      if (!db.objectStoreNames.contains(LOCALFORAGE_STORE)) {
        db.close();
        return;
      }
      const tx = db.transaction(LOCALFORAGE_STORE, "readwrite");
      const store = tx.objectStore(LOCALFORAGE_STORE);
      await promisify(store.put(blob, WEBGAZER_KEY));
      db.close();
    } catch (e) {
    }
  }
  function newId() {
    return (Date.now().toString(36) + Math.random().toString(36).slice(2, 8)).slice(0, 14);
  }
  async function listCalibrationProfiles() {
    try {
      const db = await openProfilesDB();
      const tx = db.transaction(PROFILES_STORE, "readonly");
      const store = tx.objectStore(PROFILES_STORE);
      const all = await promisify(store.getAll());
      db.close();
      return all.sort((a, b) => b.createdAt - a.createdAt);
    } catch (e) {
      return [];
    }
  }
  async function saveCalibrationProfile(name) {
    const payload = await readWebgazerBlob();
    if (payload === null) return null;
    const profile = {
      id: newId(),
      name: name.trim() || "Profil sans nom",
      createdAt: Date.now(),
      source: "webgazer",
      payload
    };
    try {
      const db = await openProfilesDB();
      const tx = db.transaction(PROFILES_STORE, "readwrite");
      await promisify(tx.objectStore(PROFILES_STORE).put(profile));
      db.close();
      return profile;
    } catch (e) {
      return null;
    }
  }
  async function loadCalibrationProfile(id) {
    try {
      const db = await openProfilesDB();
      const tx = db.transaction(PROFILES_STORE, "readonly");
      const profile = await promisify(tx.objectStore(PROFILES_STORE).get(id));
      db.close();
      if (!profile) return false;
      await writeWebgazerBlob(profile.payload);
      return true;
    } catch (e) {
      return false;
    }
  }
  async function deleteCalibrationProfile(id) {
    try {
      const db = await openProfilesDB();
      const tx = db.transaction(PROFILES_STORE, "readwrite");
      await promisify(tx.objectStore(PROFILES_STORE).delete(id));
      db.close();
    } catch (e) {
    }
  }
  function exportCalibrationProfile(profile) {
    return JSON.stringify({
      _afsr: "gaze-profile/1",
      ...profile
    });
  }
  async function importCalibrationProfile(json) {
    let parsed;
    try {
      parsed = JSON.parse(json);
    } catch (e) {
      return null;
    }
    if (!parsed || typeof parsed !== "object") return null;
    const p = parsed;
    if (p._afsr !== "gaze-profile/1") return null;
    if (typeof p.name !== "string" || typeof p.createdAt !== "number") return null;
    const profile = {
      id: newId(),
      name: p.name,
      createdAt: p.createdAt,
      source: p.source === "tobii" ? "tobii" : "webgazer",
      payload: p.payload
    };
    try {
      const db = await openProfilesDB();
      const tx = db.transaction(PROFILES_STORE, "readwrite");
      await promisify(tx.objectStore(PROFILES_STORE).put(profile));
      db.close();
      return profile;
    } catch (e) {
      return null;
    }
  }

  // src/index.ts
  var DEFAULT_COMPANION_URL = "ws://127.0.0.1:47820/gaze";
  var COMPANION_HANDSHAKE_TIMEOUT_MS = 1200;
  var DEFAULT_PUBLIC_PATH = "/gaze-client";
  function emitStatus(opts, session, s) {
    var _a;
    session.status = s;
    (_a = opts.onStatus) == null ? void 0 : _a.call(opts, s);
  }
  function probeCompanion(url) {
    return new Promise((resolve) => {
      let settled = false;
      let ws;
      try {
        ws = new WebSocket(url);
      } catch (e) {
        resolve(null);
        return;
      }
      const fail = () => {
        if (settled) return;
        settled = true;
        try {
          ws.close();
        } catch (e) {
        }
        resolve(null);
      };
      const timer = window.setTimeout(fail, COMPANION_HANDSHAKE_TIMEOUT_MS);
      ws.onopen = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve(ws);
      };
      ws.onerror = fail;
      ws.onclose = fail;
    });
  }
  function injectScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(
        `script[data-afsr-gaze-script="${src}"]`
      );
      if (existing) {
        if (existing.dataset.loaded === "true") {
          resolve();
        } else {
          existing.addEventListener("load", () => resolve(), { once: true });
          existing.addEventListener(
            "error",
            () => reject(new Error(`Failed to load ${src}`)),
            { once: true }
          );
        }
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.dataset.afsrGazeScript = src;
      s.addEventListener("load", () => {
        s.dataset.loaded = "true";
        resolve();
      });
      s.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)));
      document.head.appendChild(s);
    });
  }
  async function startGazeTracking(opts = {}) {
    var _a, _b;
    const companionUrl = (_a = opts.companionUrl) != null ? _a : DEFAULT_COMPANION_URL;
    const publicPath = ((_b = opts.publicPath) != null ? _b : DEFAULT_PUBLIC_PATH).replace(/\/$/, "");
    const session = { source: null, status: "idle" };
    if (opts.force !== "webgazer") {
      emitStatus(opts, session, "connecting-companion");
      const socket = await probeCompanion(companionUrl);
      if (socket) {
        session.source = "tobii";
        emitStatus(opts, session, "tobii-active");
        socket.addEventListener("message", (ev) => {
          var _a2, _b2, _c;
          try {
            const msg = JSON.parse(String(ev.data));
            if (typeof msg.x === "number" && typeof msg.y === "number") {
              (_b2 = opts.onGaze) == null ? void 0 : _b2.call(opts, {
                x: msg.x,
                y: msg.y,
                timestamp: (_a2 = msg.timestamp) != null ? _a2 : Date.now(),
                source: "tobii",
                valid: msg.valid !== false
              });
            }
          } catch (e) {
            (_c = opts.onError) == null ? void 0 : _c.call(opts, e);
          }
        });
        const stop = () => {
          try {
            socket.close();
          } catch (e) {
          }
          session.source = null;
          emitStatus(opts, session, "stopped");
        };
        return {
          get source() {
            return session.source;
          },
          get status() {
            return session.status;
          },
          stop,
          teachPoint() {
          },
          clearCalibration() {
          }
        };
      }
    }
    emitStatus(opts, session, "loading-webgazer");
    try {
      await injectScript(`${publicPath}/vendor/webgazer.js`);
    } catch (e) {
      emitStatus(opts, session, "error");
      throw e instanceof Error ? e : new Error(String(e));
    }
    const wg = window.webgazer;
    if (!wg) {
      emitStatus(opts, session, "error");
      throw new Error("WebGazer failed to attach to window.");
    }
    wg.params.faceMeshSolutionPath = `${publicPath}/vendor/mediapipe/face_mesh`;
    wg.params.showVideo = false;
    wg.params.showVideoPreview = false;
    wg.params.showFaceOverlay = false;
    wg.params.showFaceFeedbackBox = false;
    wg.params.showGazeDot = false;
    wg.setGazeListener((data, ts) => {
      var _a2;
      if (!data) return;
      (_a2 = opts.onGaze) == null ? void 0 : _a2.call(opts, {
        x: data.x,
        y: data.y,
        timestamp: ts,
        source: "webgazer",
        valid: true
      });
    });
    try {
      await wg.begin();
    } catch (e) {
      emitStatus(opts, session, "error");
      throw e instanceof Error ? e : new Error(String(e));
    }
    session.source = "webgazer";
    emitStatus(opts, session, "webgazer-active");
    return {
      get source() {
        return session.source;
      },
      get status() {
        return session.status;
      },
      stop() {
        try {
          wg.end();
        } catch (e) {
        }
        session.source = null;
        emitStatus(opts, session, "stopped");
      },
      teachPoint(x, y) {
        wg.recordScreenPosition(x, y, "click");
      },
      clearCalibration() {
        wg.clearData();
      }
    };
  }
  return __toCommonJS(index_exports);
})();
if (typeof module !== 'undefined' && module.exports) module.exports = AFSRGaze;
