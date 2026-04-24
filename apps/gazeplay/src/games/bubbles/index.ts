import { DwellEngine, hitCircle } from "../../core/dwell";
import { GameModule } from "../../core/registry";

const SPAWN_INTERVAL_MS = 1400;
const GAME_DURATION_MS = 60_000;
const BUBBLE_RADIUS = 50;
const BUBBLE_SPEED = 70; // px / sec, upward
const BUBBLE_COLORS = ["#5ec5ff", "#ffb74d", "#e57373", "#81c784", "#ba68c8", "#ffd54f"];

interface Bubble {
  id: string;
  el: HTMLDivElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

class BubblesGame {
  private root!: HTMLElement;
  private engine!: DwellEngine;
  private onExit!: () => void;
  private field!: HTMLDivElement;
  private bubbles: Bubble[] = [];
  private score = 0;
  private scoreEl!: HTMLDivElement;
  private timerEl!: HTMLDivElement;
  private endsAt = 0;
  private lastTick = 0;
  private nextSpawn = 0;
  private stopped = false;
  private raf = 0;
  private nextId = 0;

  mount(root: HTMLElement, engine: DwellEngine, onExit: () => void): void {
    this.root = root;
    this.engine = engine;
    this.onExit = onExit;
    this.stopped = false;
    this.score = 0;

    root.innerHTML = `
      <div class="game-hud">
        <div class="hud-score">Bulles éclatées : <span id="bbScore">0</span></div>
        <div class="hud-timer">Temps : <span id="bbTimer">60</span>s</div>
      </div>
      <div class="game-playfield" id="bbField"></div>
    `;

    this.scoreEl = root.querySelector<HTMLDivElement>("#bbScore")!;
    this.timerEl = root.querySelector<HTMLDivElement>("#bbTimer")!;
    this.field = root.querySelector<HTMLDivElement>("#bbField")!;

    this.endsAt = performance.now() + GAME_DURATION_MS;
    this.lastTick = performance.now();
    this.nextSpawn = this.lastTick + 500;
    this.tick();
  }

  private spawn(): void {
    const rect = this.field.getBoundingClientRect();
    if (rect.width < 2 * BUBBLE_RADIUS) return;
    const id = `bb-${this.nextId++}`;
    const x = rect.left + BUBBLE_RADIUS + Math.random() * (rect.width - 2 * BUBBLE_RADIUS);
    const y = rect.bottom + BUBBLE_RADIUS;
    const color = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
    const el = document.createElement("div");
    el.className = "bb-bubble";
    el.style.background = `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6) 0%, ${color} 60%, ${color} 100%)`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.width = el.style.height = `${2 * BUBBLE_RADIUS}px`;
    this.field.appendChild(el);

    const bubble: Bubble = {
      id,
      el,
      x,
      y,
      vx: (Math.random() - 0.5) * 30,
      vy: -BUBBLE_SPEED - Math.random() * 20,
    };
    this.bubbles.push(bubble);
    this.engine.register({
      id,
      hit: hitCircle(() => bubble.x, () => bubble.y, () => BUBBLE_RADIUS),
      dwellMs: 600,
      onHit: () => this.pop(bubble),
    });
  }

  private pop(b: Bubble): void {
    if (!b.el.isConnected) return;
    this.engine.unregister(b.id);
    b.el.classList.add("pop");
    this.bubbles = this.bubbles.filter((x) => x !== b);
    this.score++;
    this.scoreEl.textContent = String(this.score);
    setTimeout(() => b.el.remove(), 300);
  }

  private tick = (): void => {
    if (this.stopped) return;
    const now = performance.now();
    const dt = (now - this.lastTick) / 1000;
    this.lastTick = now;

    if (now >= this.nextSpawn) {
      this.spawn();
      this.nextSpawn = now + SPAWN_INTERVAL_MS - Math.min(SPAWN_INTERVAL_MS - 400, (this.score * 40));
    }

    // Advance bubbles; let any that drift off the top expire silently.
    for (const b of [...this.bubbles]) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.el.style.left = `${b.x}px`;
      b.el.style.top = `${b.y}px`;
      if (b.y < -BUBBLE_RADIUS) {
        this.engine.unregister(b.id);
        b.el.remove();
        this.bubbles = this.bubbles.filter((x) => x !== b);
      }
    }

    const left = Math.max(0, this.endsAt - now);
    this.timerEl.textContent = String(Math.ceil(left / 1000));
    if (left <= 0) {
      this.endGame();
      return;
    }
    this.raf = requestAnimationFrame(this.tick);
  };

  private endGame(): void {
    this.stopped = true;
    cancelAnimationFrame(this.raf);
    this.root.innerHTML = `
      <div class="game-result">
        <h2>Fin de partie</h2>
        <p>Bulles éclatées : <strong>${this.score}</strong></p>
      </div>
    `;
    setTimeout(() => this.onExit(), 2500);
  }

  unmount(): void {
    this.stopped = true;
    cancelAnimationFrame(this.raf);
    for (const b of this.bubbles) {
      this.engine.unregister(b.id);
      b.el.remove();
    }
    this.bubbles = [];
  }
}

const gameInstance = new BubblesGame();

export const bubblesGame: GameModule = {
  meta: {
    id: "bubbles",
    title: "Bulles colorées",
    description: "Fais éclater les bulles qui montent en les regardant.",
    emoji: "🫧",
    tags: ["reflexes", "enfants"],
  },
  mount: (root, engine, onExit) => gameInstance.mount(root, engine, onExit),
  unmount: () => gameInstance.unmount(),
};
