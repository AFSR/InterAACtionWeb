/**
 * @afsr/gaze-client — unified gaze-tracking API for the InterAACtion web suite.
 *
 * Strategy:
 *   1. Try to connect to the local Tauri companion on
 *      ws://127.0.0.1:<COMPANION_PORT>/gaze. The companion relays gaze
 *      coordinates coming out of a Tobii Stream Engine.
 *   2. On connection failure or timeout, load the self-hosted WebGazer.js
 *      bundle at <publicPath>/vendor/webgazer.js and fall back to
 *      webcam-based gaze tracking.
 *
 * Consumers only need to call `startGazeTracking({ onGaze })` and receive
 * normalised GazePoint events regardless of which source is active.
 *
 * Calibration profiles (saveCalibrationProfile, loadCalibrationProfile,
 * listCalibrationProfiles, deleteCalibrationProfile, …) are re-exported
 * from ./profiles so portal/calibration/ can round-trip WebGazer's
 * persisted state without reaching into IndexedDB by hand.
 */

export * from "./profiles";

const DEFAULT_COMPANION_URL = "ws://127.0.0.1:47820/gaze";
const COMPANION_HANDSHAKE_TIMEOUT_MS = 1200;
const DEFAULT_PUBLIC_PATH = "/gaze-client";

export type GazeSource = "tobii" | "webgazer";
export type GazeStatus =
  | "idle"
  | "connecting-companion"
  | "tobii-active"
  | "loading-webgazer"
  | "webgazer-active"
  | "error"
  | "stopped";

export interface GazePoint {
  /** Viewport X in CSS pixels. */
  x: number;
  /** Viewport Y in CSS pixels. */
  y: number;
  /** Unix epoch milliseconds. */
  timestamp: number;
  /** Which backend emitted this sample. */
  source: GazeSource;
  /** False when the tracker reports "eyes lost" but still emits samples. */
  valid: boolean;
}

export interface GazeStartOptions {
  /** Override of the companion WebSocket URL. */
  companionUrl?: string;
  /**
   * Absolute or relative base path under which vendor/webgazer.js and
   * vendor/mediapipe/ are served. Defaults to "/gaze-client".
   */
  publicPath?: string;
  /** Forced backend, bypasses the companion probe. */
  force?: GazeSource;
  /** Called for each gaze sample. */
  onGaze?: (p: GazePoint) => void;
  /** Status transitions. Useful to drive a "calibration needed" banner. */
  onStatus?: (s: GazeStatus) => void;
  /** Any non-fatal error. Fatal failures reject `startGazeTracking`. */
  onError?: (e: Error) => void;
}

export interface GazeSession {
  /** Currently active backend. Null while loading or stopped. */
  readonly source: GazeSource | null;
  /** Last known status. */
  readonly status: GazeStatus;
  /** Stop listening and release hardware (webcam, WebSocket). */
  stop(): void;
  /**
   * Run the calibration flow. For WebGazer, this is a no-op placeholder
   * here — the portal owns the calibration UI and simply feeds
   * recordScreenPosition() through `teachPoint` calls below.
   */
  teachPoint(x: number, y: number): void;
  /** Drop all learned calibration data (WebGazer only). */
  clearCalibration(): void;
}

declare global {
  interface Window {
    webgazer?: {
      setGazeListener(cb: (data: { x: number; y: number } | null, ts: number) => void): unknown;
      begin(onFail?: () => void): Promise<unknown>;
      end(): void;
      pause(): void;
      resume(): void;
      showVideo(show: boolean): unknown;
      showPredictionPoints(show: boolean): unknown;
      showFaceOverlay(show: boolean): unknown;
      showFaceFeedbackBox(show: boolean): unknown;
      recordScreenPosition(x: number, y: number, type?: string): void;
      clearData(): Promise<void> | void;
      setRegression(name: string): unknown;
      params: Record<string, unknown>;
    };
  }
}

function emitStatus(opts: GazeStartOptions, session: MutableSession, s: GazeStatus): void {
  session.status = s;
  opts.onStatus?.(s);
}

interface MutableSession {
  source: GazeSource | null;
  status: GazeStatus;
}

/**
 * Attempt a short WebSocket handshake with the companion. Resolves to a
 * connected socket on success, to null if the companion is unreachable.
 */
function probeCompanion(url: string): Promise<WebSocket | null> {
  return new Promise((resolve) => {
    let settled = false;
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      resolve(null);
      return;
    }
    const fail = (): void => {
      if (settled) return;
      settled = true;
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      resolve(null);
    };
    const timer = window.setTimeout(fail, COMPANION_HANDSHAKE_TIMEOUT_MS);
    ws.onopen = (): void => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(ws);
    };
    ws.onerror = fail;
    ws.onclose = fail;
  });
}

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-afsr-gaze-script="${src}"]`,
    );
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
      } else {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener(
          "error",
          () => reject(new Error(`Failed to load ${src}`)),
          { once: true },
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

/**
 * Start gaze tracking. Returns a session handle. Rejects only when no
 * backend can be established at all.
 */
export async function startGazeTracking(opts: GazeStartOptions = {}): Promise<GazeSession> {
  const companionUrl = opts.companionUrl ?? DEFAULT_COMPANION_URL;
  const publicPath = (opts.publicPath ?? DEFAULT_PUBLIC_PATH).replace(/\/$/, "");
  const session: MutableSession = { source: null, status: "idle" };

  // Tobii path
  if (opts.force !== "webgazer") {
    emitStatus(opts, session, "connecting-companion");
    const socket = await probeCompanion(companionUrl);
    if (socket) {
      session.source = "tobii";
      emitStatus(opts, session, "tobii-active");
      socket.addEventListener("message", (ev) => {
        try {
          const msg = JSON.parse(String(ev.data)) as Partial<GazePoint>;
          if (typeof msg.x === "number" && typeof msg.y === "number") {
            opts.onGaze?.({
              x: msg.x,
              y: msg.y,
              timestamp: msg.timestamp ?? Date.now(),
              source: "tobii",
              valid: msg.valid !== false,
            });
          }
        } catch (e) {
          opts.onError?.(e as Error);
        }
      });
      const stop = (): void => {
        try {
          socket.close();
        } catch {
          /* ignore */
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
        teachPoint(): void {
          /* no-op: Tobii does its own calibration out-of-band */
        },
        clearCalibration(): void {
          /* no-op */
        },
      };
    }
  }

  // WebGazer path
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

  // Point WebGazer's face-mesh loader at the vendored assets BEFORE
  // begin() — createDetector() reads this once during init and never
  // looks again. Absolute path so it works from any route (/, /augcom/,
  // /calibration/, …). Strip the trailing slash; WebGazer appends one.
  wg.params.faceMeshSolutionPath = `${publicPath}/vendor/mediapipe/face_mesh`;
  // Quiet the default visualisation; apps layer their own cursor on top.
  wg.params.showVideo = false;
  wg.params.showVideoPreview = false;
  wg.params.showFaceOverlay = false;
  wg.params.showFaceFeedbackBox = false;
  wg.params.showGazeDot = false;
  // Disable WebGazer's internal Kalman filter — it adds visible lag on
  // top of the EMA the bridge already applies, which was the main
  // perceived "drag" in field testing. The bridge smoothing handles
  // jitter on its own.
  wg.params.applyKalmanFilter = false;

  wg.setGazeListener((data, ts) => {
    if (!data) return;
    opts.onGaze?.({
      x: data.x,
      y: data.y,
      timestamp: ts,
      source: "webgazer",
      valid: true,
    });
  });

  // weightedRidge biases the regression towards more recent samples,
  // so every click in the apps (captured by WebGazer's own document
  // click listener) nudges the mapping back into shape. Plain ridge
  // (the default) treats every sample equally and tends to lock into
  // the diagonal bias the 9-point grid leaves behind.
  try { wg.setRegression("weightedRidge"); } catch { /* fall back to default */ }

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
    stop(): void {
      try {
        wg.end();
      } catch {
        /* ignore */
      }
      session.source = null;
      emitStatus(opts, session, "stopped");
    },
    teachPoint(x: number, y: number): void {
      wg.recordScreenPosition(x, y, "click");
    },
    clearCalibration(): void {
      wg.clearData();
    },
  };
}
