/**
 * Calibration profile management.
 *
 * WebGazer persists the learned regression model in IndexedDB via the
 * `localforage` library under database=localforage, store=keyvaluepairs,
 * key="webgazerGlobalData". We treat that blob as opaque: a profile is
 * simply a named copy of it, plus some bookkeeping.
 *
 * Profiles are stored in a separate IndexedDB (afsr-gaze) so clearing
 * WebGazer data (via clearCalibration()) does not wipe the archive.
 *
 * All functions resolve even if IndexedDB is unavailable (private mode,
 * quota refusal) so callers can display a fallback without crashing.
 */
export interface CalibrationProfile {
    id: string;
    name: string;
    createdAt: number;
    source: "webgazer" | "tobii";
    /** Opaque WebGazer blob. Null for Tobii profiles (no client-side data). */
    payload: unknown;
}
/** List every profile, newest first. */
export declare function listCalibrationProfiles(): Promise<CalibrationProfile[]>;
/**
 * Snapshot the current WebGazer state under a user-provided name.
 * Returns the new profile, or null if the snapshot was empty (no
 * calibration on record to save).
 */
export declare function saveCalibrationProfile(name: string): Promise<CalibrationProfile | null>;
/**
 * Copy the profile's payload back into WebGazer's IndexedDB location.
 * Call BEFORE startGazeTracking(): WebGazer reads the blob during
 * `begin()`.
 */
export declare function loadCalibrationProfile(id: string): Promise<boolean>;
export declare function deleteCalibrationProfile(id: string): Promise<void>;
/**
 * Serialise a profile to a JSON string suitable for file download. The
 * payload is opaque, so this is a one-to-one dump plus an afsr magic
 * marker so importCalibrationProfile can sanity-check.
 */
export declare function exportCalibrationProfile(profile: CalibrationProfile): string;
/**
 * Parse an exported JSON, assign a fresh id, and persist it. Returns
 * the stored profile, or null if the input is not a valid AFSR export.
 */
export declare function importCalibrationProfile(json: string): Promise<CalibrationProfile | null>;
