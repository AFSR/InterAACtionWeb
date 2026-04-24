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
 */
export type GazeSource = "tobii" | "webgazer";
export type GazeStatus = "idle" | "connecting-companion" | "tobii-active" | "loading-webgazer" | "webgazer-active" | "error" | "stopped";
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
            setGazeListener(cb: (data: {
                x: number;
                y: number;
            } | null, ts: number) => void): void;
            begin(): Promise<unknown>;
            end(): void;
            pause(): void;
            resume(): void;
            showVideo(show: boolean): void;
            showPredictionPoints(show: boolean): void;
            showFaceOverlay(show: boolean): void;
            showFaceFeedbackBox(show: boolean): void;
            recordScreenPosition(x: number, y: number, type?: string): void;
            clearData(): void;
            setRegression(name: string): void;
            params?: Record<string, unknown>;
        };
    }
}
/**
 * Start gaze tracking. Returns a session handle. Rejects only when no
 * backend can be established at all.
 */
export declare function startGazeTracking(opts?: GazeStartOptions): Promise<GazeSession>;
