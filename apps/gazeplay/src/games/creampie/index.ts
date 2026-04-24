import { DwellEngine, hitCircle } from "../../core/dwell";
import { GameModule } from "../../core/registry";

const TARGET_COUNT = 12;
const TARGET_RADIUS = 60;
const GAME_DURATION_MS = 45_000;

interface TargetState {
  id: string;
  el: HTMLDivElement;
  x: number;
  y: number;
}

class CreamPieGame {
  private root!: HTMLElement;
  private engine!: DwellEngine;
  private onExit!: () => void;
  private targets: TargetState[] = [];
  private remaining = 0;
  private score = 0;
  private timerEl!: HTMLDivElement;
  private scoreEl!: HTMLDivElement;
  private endsAt = 0;
  private raf = 0;
  private stopped = false;

  mount(root: HTMLElement, engine: DwellEngine, onExit: () => void): void {
    this.root = root;
    this.engine = engine;
    this.onExit = onExit;
    this.stopped = false;
    this.score = 0;

    root.innerHTML = `
      <div class="game-hud">
        <div class="hud-score">Score : <span id="cpScore">0</span></div>
        <div class="hud-timer">Temps : <span id="cpTimer">45</span>s</div>
      </div>
      <div class="game-playfield" id="cpField"></div>
    `;

    this.scoreEl = root.querySelector<HTMLDivElement>("#cpScore")!;
    this.timerEl = root.querySelector<HTMLDivElement>("#cpTimer")!;
    const field = root.querySelector<HTMLDivElement>("#cpField")!;

    this.spawnTargets(field);
    this.endsAt = performance.now() + GAME_DURATION_MS;
    this.tick();
  }

  private spawnTargets(field: HTMLElement): void {
    const rect = field.getBoundingClientRect();
    for (let i = 0; i < TARGET_COUNT; i++) {
      const x = rect.left + 80 + Math.random() * Math.max(0, rect.width - 160);
      const y = rect.top + 80 + Math.random() * Math.max(0, rect.height - 160);
      const el = document.createElement("div");
      el.className = "cp-target";
      el.setAttribute("aria-hidden", "true");
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      field.appendChild(el);

      const target: TargetState = { id: `cp-${i}`, el, x, y };
      this.targets.push(target);
      this.remaining++;

      this.engine.register({
        id: target.id,
        hit: hitCircle(() => target.x, () => target.y, () => TARGET_RADIUS),
        onEnter: () => target.el.classList.add("hover"),
        onLeave: () => target.el.classList.remove("hover"),
        onHit: () => this.onHit(target),
      });
    }
  }

  private onHit(t: TargetState): void {
    if (!t.el.isConnected) return;
    this.engine.unregister(t.id);
    t.el.classList.add("splat");
    this.score++;
    this.scoreEl.textContent = String(this.score);
    setTimeout(() => t.el.remove(), 400);
    this.remaining--;
    if (this.remaining === 0) this.endGame(true);
  }

  private tick = (): void => {
    if (this.stopped) return;
    const left = Math.max(0, this.endsAt - performance.now());
    this.timerEl.textContent = String(Math.ceil(left / 1000));
    if (left <= 0) {
      this.endGame(false);
      return;
    }
    this.raf = requestAnimationFrame(this.tick);
  };

  private endGame(allHit: boolean): void {
    this.stopped = true;
    cancelAnimationFrame(this.raf);
    const verdict = allHit ? "Bravo, toutes les cibles !" : "Temps écoulé.";
    this.root.innerHTML = `
      <div class="game-result">
        <h2>${verdict}</h2>
        <p>Score final : <strong>${this.score}</strong> / ${TARGET_COUNT}</p>
      </div>
    `;
    setTimeout(() => this.onExit(), 2500);
  }

  unmount(): void {
    this.stopped = true;
    cancelAnimationFrame(this.raf);
    for (const t of this.targets) this.engine.unregister(t.id);
    this.targets = [];
    this.remaining = 0;
  }
}

const gameInstance = new CreamPieGame();

export const creamPieGame: GameModule = {
  meta: {
    id: "creampie",
    title: "Tartes à la crème",
    description: "Regarde les cibles pour les viser. Atteins-les toutes en 45 secondes.",
    emoji: "🥧",
    tags: ["reflexes", "debutant"],
  },
  mount: (root, engine, onExit) => gameInstance.mount(root, engine, onExit),
  unmount: () => gameInstance.unmount(),
};
