/**
 * Dwell engine — translates continuous gaze coordinates (or mouse
 * pointer fallback) into "target hit" events after the cursor has
 * stayed inside a hit-tested region for DWELL_MS.
 *
 * Games only worry about registering regions and receiving onEnter /
 * onHit / onLeave callbacks. The engine handles smoothing, filtering,
 * progress visualisation and the wiring to @afsr/gaze-client.
 */

export interface GazeSample {
  x: number;
  y: number;
  timestamp: number;
}

export interface HitRegion {
  id: string;
  /** Bounding box test (viewport coords). Or custom hit function. */
  hit: (x: number, y: number) => boolean;
  /** Called the frame the region starts being fixated. */
  onEnter?: (s: GazeSample) => void;
  /** Called when dwell completes. */
  onHit: (s: GazeSample) => void;
  /** Called when gaze leaves before completion. */
  onLeave?: (s: GazeSample) => void;
  /** Per-region dwell time override. Defaults to engine.defaultDwellMs. */
  dwellMs?: number;
}

export interface DwellEngineOptions {
  defaultDwellMs?: number;
  smoothing?: number;
  jumpPx?: number;
  suppressAfterJumpMs?: number;
  /** Draw a cursor + progress ring. Defaults to true. */
  showCursor?: boolean;
  /**
   * When set, engine uses synthetic mouse coordinates as a fallback
   * before any gaze session connects. Useful for development on desktop
   * without a webcam.
   */
  mouseFallback?: boolean;
}

declare global {
  interface Window {
    AFSRGaze?: {
      startGazeTracking(opts: {
        publicPath?: string;
        force?: "tobii" | "webgazer";
        onGaze?: (p: { x: number; y: number; timestamp: number }) => void;
        onStatus?: (s: string) => void;
        onError?: (e: Error) => void;
      }): Promise<{ stop(): void }>;
    };
  }
}

const DEFAULTS = {
  defaultDwellMs: 900,
  smoothing: 0.25,
  jumpPx: 400,
  suppressAfterJumpMs: 200,
  showCursor: true,
  mouseFallback: true,
};

export class DwellEngine {
  private opts: Required<DwellEngineOptions>;
  private session: { stop(): void } | null = null;
  private regions = new Map<string, HitRegion>();
  private currentId: string | null = null;
  private dwellStart = 0;
  private suppressUntil = 0;
  private smoothedX: number | null = null;
  private smoothedY: number | null = null;
  private cursor: HTMLDivElement | null = null;
  private ring: HTMLDivElement | null = null;
  private rafToken = 0;
  private running = false;

  constructor(opts: DwellEngineOptions = {}) {
    this.opts = { ...DEFAULTS, ...opts };
  }

  register(region: HitRegion): void {
    this.regions.set(region.id, region);
  }

  unregister(id: string): void {
    if (this.currentId === id) this.reset();
    this.regions.delete(id);
  }

  unregisterAll(): void {
    this.reset();
    this.regions.clear();
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    if (this.opts.showCursor) this.mountCursor();

    if (this.opts.mouseFallback) {
      window.addEventListener("pointermove", this.onPointer);
    }

    if (window.AFSRGaze) {
      try {
        this.session = await window.AFSRGaze.startGazeTracking({
          publicPath: "/gaze-client",
          onGaze: (p) => this.onSample(p),
        });
      } catch (e) {
        console.warn("[dwell] gaze tracking unavailable, staying on mouse fallback:", e);
      }
    }

    this.rafToken = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafToken);
    window.removeEventListener("pointermove", this.onPointer);
    if (this.session) {
      try { this.session.stop(); } catch { /* ignore */ }
      this.session = null;
    }
    if (this.cursor) {
      this.cursor.remove();
      this.cursor = null;
      this.ring = null;
    }
  }

  private onPointer = (e: PointerEvent): void => {
    // Only used until gaze takes over; mouse samples are high-quality
    // so no smoothing needed, but feed the same pipeline.
    this.onSample({ x: e.clientX, y: e.clientY, timestamp: performance.now() });
  };

  private onSample(s: { x: number; y: number; timestamp: number }): void {
    const now = performance.now();
    if (this.smoothedX !== null) {
      const dx = s.x - this.smoothedX;
      const dy = s.y - (this.smoothedY ?? 0);
      if (dx * dx + dy * dy > this.opts.jumpPx * this.opts.jumpPx) {
        this.suppressUntil = now + this.opts.suppressAfterJumpMs;
        return;
      }
    }
    if (now < this.suppressUntil) return;

    if (this.smoothedX === null) {
      this.smoothedX = s.x;
      this.smoothedY = s.y;
    } else {
      const k = this.opts.smoothing;
      this.smoothedX = this.smoothedX * (1 - k) + s.x * k;
      this.smoothedY = (this.smoothedY ?? s.y) * (1 - k) + s.y * k;
    }
  }

  private tick = (): void => {
    if (!this.running) return;
    this.rafToken = requestAnimationFrame(this.tick);

    const x = this.smoothedX;
    const y = this.smoothedY;
    if (x === null || y === null) return;

    if (this.cursor) {
      this.cursor.style.left = `${x}px`;
      this.cursor.style.top = `${y}px`;
      this.cursor.style.display = "block";
    }

    // Hit-test in insertion order. First match wins.
    let hit: HitRegion | null = null;
    for (const r of this.regions.values()) {
      if (r.hit(x, y)) { hit = r; break; }
    }

    const now = performance.now();

    if (!hit) {
      if (this.currentId) {
        const prev = this.regions.get(this.currentId);
        if (prev?.onLeave) prev.onLeave({ x, y, timestamp: now });
      }
      this.reset();
      return;
    }

    if (hit.id !== this.currentId) {
      this.currentId = hit.id;
      this.dwellStart = now;
      if (hit.onEnter) hit.onEnter({ x, y, timestamp: now });
      this.updateRing(0);
      return;
    }

    const dwellMs = hit.dwellMs ?? this.opts.defaultDwellMs;
    const progress = Math.min(1, (now - this.dwellStart) / dwellMs);
    this.updateRing(progress);

    if (progress >= 1) {
      const snapshot = hit;
      this.reset();
      snapshot.onHit({ x, y, timestamp: now });
      // Debounce: require the user to look elsewhere before re-firing
      // on the same region.
      this.dwellStart = now + 250;
    }
  };

  private reset(): void {
    this.currentId = null;
    this.dwellStart = 0;
    this.updateRing(0);
  }

  private mountCursor(): void {
    const cursor = document.createElement("div");
    cursor.setAttribute("aria-hidden", "true");
    Object.assign(cursor.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "44px",
      height: "44px",
      borderRadius: "50%",
      border: "3px solid rgba(255,255,255,0.7)",
      background: "radial-gradient(circle, rgba(116,169,236,0.45) 0%, rgba(116,169,236,0) 70%)",
      transform: "translate(-50%,-50%)",
      pointerEvents: "none",
      zIndex: "2147482999",
      display: "none",
    });

    const ring = document.createElement("div");
    Object.assign(ring.style, {
      position: "absolute",
      inset: "-8px",
      borderRadius: "50%",
      border: "4px solid transparent",
      borderTopColor: "#74a9ec",
      transform: "rotate(0deg)",
      opacity: "0",
      transition: "opacity 150ms linear",
    });
    cursor.appendChild(ring);

    document.body.appendChild(cursor);
    this.cursor = cursor;
    this.ring = ring;
  }

  private updateRing(progress: number): void {
    if (!this.ring) return;
    this.ring.style.opacity = progress > 0 ? "1" : "0";
    this.ring.style.transform = `rotate(${progress * 360}deg)`;
  }
}

/** Convenience helper: rectangular hit-test for a DOM element. */
export function hitElement(el: HTMLElement): HitRegion["hit"] {
  return (x, y) => {
    const r = el.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  };
}

/** Hit-test on a circle (cx, cy, radius) — useful for moving targets. */
export function hitCircle(cx: () => number, cy: () => number, radius: () => number): HitRegion["hit"] {
  return (x, y) => {
    const dx = x - cx();
    const dy = y - cy();
    return dx * dx + dy * dy <= radius() * radius();
  };
}
