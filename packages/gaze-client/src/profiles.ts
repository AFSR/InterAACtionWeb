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

const LOCALFORAGE_DB = "localforage";
const LOCALFORAGE_STORE = "keyvaluepairs";
const WEBGAZER_KEY = "webgazerGlobalData";

const PROFILES_DB = "afsr-gaze";
const PROFILES_STORE = "profiles";
const PROFILES_VERSION = 1;

export interface CalibrationProfile {
  id: string;
  name: string;
  createdAt: number;
  source: "webgazer" | "tobii";
  /** Opaque WebGazer blob. Null for Tobii profiles (no client-side data). */
  payload: unknown;
}

function openDB(name: string, version: number, upgrade?: (db: IDBDatabase) => void): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version);
    if (upgrade) {
      req.onupgradeneeded = (): void => upgrade(req.result);
    }
    req.onsuccess = (): void => resolve(req.result);
    req.onerror = (): void => reject(req.error ?? new Error("IndexedDB open failed"));
    req.onblocked = (): void => reject(new Error("IndexedDB open blocked by another tab"));
  });
}

function promisify<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = (): void => resolve(req.result);
    req.onerror = (): void => reject(req.error ?? new Error("IndexedDB request failed"));
  });
}

async function openProfilesDB(): Promise<IDBDatabase> {
  return openDB(PROFILES_DB, PROFILES_VERSION, (db) => {
    if (!db.objectStoreNames.contains(PROFILES_STORE)) {
      db.createObjectStore(PROFILES_STORE, { keyPath: "id" });
    }
  });
}

/**
 * Read the current WebGazer blob out of the localforage-managed DB.
 * Returns null if WebGazer never persisted anything (never ran, or
 * saveDataAcrossSessions was off).
 */
async function readWebgazerBlob(): Promise<unknown | null> {
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
    return blob ?? null;
  } catch {
    return null;
  }
}

/**
 * Replace the WebGazer blob with the given payload. Called before
 * `startGazeTracking()` so WebGazer's own bootstrap loads it back.
 */
async function writeWebgazerBlob(blob: unknown): Promise<void> {
  // localforage creates the store lazily. We can't safely create it
  // ourselves via onupgradeneeded without racing with localforage's own
  // schema bump, so we just fail soft if the store is absent.
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
  } catch {
    /* swallow: the user will just have to recalibrate */
  }
}

function newId(): string {
  // 8-char random, enough entropy for a list of a few dozen profiles.
  return (Date.now().toString(36) + Math.random().toString(36).slice(2, 8))
    .slice(0, 14);
}

/** List every profile, newest first. */
export async function listCalibrationProfiles(): Promise<CalibrationProfile[]> {
  try {
    const db = await openProfilesDB();
    const tx = db.transaction(PROFILES_STORE, "readonly");
    const store = tx.objectStore(PROFILES_STORE);
    const all = (await promisify(store.getAll())) as CalibrationProfile[];
    db.close();
    return all.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

/**
 * Snapshot the current WebGazer state under a user-provided name.
 * Returns the new profile, or null if the snapshot was empty (no
 * calibration on record to save).
 */
export async function saveCalibrationProfile(name: string): Promise<CalibrationProfile | null> {
  const payload = await readWebgazerBlob();
  if (payload === null) return null;
  const profile: CalibrationProfile = {
    id: newId(),
    name: name.trim() || "Profil sans nom",
    createdAt: Date.now(),
    source: "webgazer",
    payload,
  };
  try {
    const db = await openProfilesDB();
    const tx = db.transaction(PROFILES_STORE, "readwrite");
    await promisify(tx.objectStore(PROFILES_STORE).put(profile));
    db.close();
    return profile;
  } catch {
    return null;
  }
}

/**
 * Copy the profile's payload back into WebGazer's IndexedDB location.
 * Call BEFORE startGazeTracking(): WebGazer reads the blob during
 * `begin()`.
 */
export async function loadCalibrationProfile(id: string): Promise<boolean> {
  try {
    const db = await openProfilesDB();
    const tx = db.transaction(PROFILES_STORE, "readonly");
    const profile = (await promisify(tx.objectStore(PROFILES_STORE).get(id))) as
      | CalibrationProfile
      | undefined;
    db.close();
    if (!profile) return false;
    await writeWebgazerBlob(profile.payload);
    return true;
  } catch {
    return false;
  }
}

export async function deleteCalibrationProfile(id: string): Promise<void> {
  try {
    const db = await openProfilesDB();
    const tx = db.transaction(PROFILES_STORE, "readwrite");
    await promisify(tx.objectStore(PROFILES_STORE).delete(id));
    db.close();
  } catch {
    /* ignore */
  }
}

/**
 * Serialise a profile to a JSON string suitable for file download. The
 * payload is opaque, so this is a one-to-one dump plus an afsr magic
 * marker so importCalibrationProfile can sanity-check.
 */
export function exportCalibrationProfile(profile: CalibrationProfile): string {
  return JSON.stringify({
    _afsr: "gaze-profile/1",
    ...profile,
  });
}

/**
 * Parse an exported JSON, assign a fresh id, and persist it. Returns
 * the stored profile, or null if the input is not a valid AFSR export.
 */
export async function importCalibrationProfile(json: string): Promise<CalibrationProfile | null> {
  let parsed: unknown;
  try { parsed = JSON.parse(json); } catch { return null; }
  if (!parsed || typeof parsed !== "object") return null;
  const p = parsed as Record<string, unknown>;
  if (p._afsr !== "gaze-profile/1") return null;
  if (typeof p.name !== "string" || typeof p.createdAt !== "number") return null;
  const profile: CalibrationProfile = {
    id: newId(),
    name: p.name,
    createdAt: p.createdAt,
    source: p.source === "tobii" ? "tobii" : "webgazer",
    payload: p.payload,
  };
  try {
    const db = await openProfilesDB();
    const tx = db.transaction(PROFILES_STORE, "readwrite");
    await promisify(tx.objectStore(PROFILES_STORE).put(profile));
    db.close();
    return profile;
  } catch {
    return null;
  }
}
