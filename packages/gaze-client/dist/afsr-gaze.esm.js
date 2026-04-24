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
  wg.showVideo(false);
  wg.showPredictionPoints(false);
  wg.showFaceOverlay(false);
  wg.showFaceFeedbackBox(false);
  if (wg.params && typeof wg.params === "object") {
    wg.params.faceMeshPath = `${publicPath}/vendor/mediapipe/face_mesh/`;
  }
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
export {
  startGazeTracking
};
