import { DwellEngine, hitElement } from "./dwell";
import { allGames, findGame, GameModule } from "./registry";

export class Hub {
  private root: HTMLElement;
  private engine: DwellEngine;
  private currentGame: GameModule | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
    this.engine = new DwellEngine({ defaultDwellMs: 900 });
  }

  async start(): Promise<void> {
    await this.engine.start();
    this.renderTiles();
  }

  private renderTiles(): void {
    this.engine.unregisterAll();
    this.root.innerHTML = "";
    this.root.className = "hub";

    const header = document.createElement("header");
    header.className = "hub-header";
    header.innerHTML = `
      <h1>GazePlay</h1>
      <p>Choisissez un jeu en regardant sa vignette.</p>
      <a class="back" href="/">← Portail</a>
    `;
    this.root.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "game-grid";

    for (const game of allGames()) {
      const tile = this.buildTile(game);
      grid.appendChild(tile);
      this.engine.register({
        id: `game:${game.meta.id}`,
        hit: hitElement(tile),
        onEnter: () => tile.classList.add("hover"),
        onLeave: () => tile.classList.remove("hover"),
        onHit: () => this.open(game.meta.id),
      });
    }

    this.root.appendChild(grid);
  }

  private buildTile(g: GameModule): HTMLElement {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "game-tile";
    tile.setAttribute("aria-label", `Lancer le jeu ${g.meta.title}`);
    tile.addEventListener("click", () => this.open(g.meta.id));
    tile.innerHTML = `
      <div class="game-emoji" aria-hidden="true">${g.meta.emoji}</div>
      <h2>${g.meta.title}</h2>
      <p>${g.meta.description}</p>
    `;
    return tile;
  }

  open(id: string): void {
    const game = findGame(id);
    if (!game) return;
    this.currentGame = game;
    this.engine.unregisterAll();
    this.root.innerHTML = "";
    this.root.className = "game-stage";
    const gameRoot = document.createElement("div");
    gameRoot.className = "game-root";
    this.root.appendChild(gameRoot);

    const exit = document.createElement("button");
    exit.type = "button";
    exit.className = "game-exit";
    exit.textContent = "← Retour aux jeux";
    exit.addEventListener("click", () => this.back());
    this.engine.register({
      id: "exit",
      hit: hitElement(exit),
      onEnter: () => exit.classList.add("hover"),
      onLeave: () => exit.classList.remove("hover"),
      onHit: () => this.back(),
    });
    this.root.appendChild(exit);

    game.mount(gameRoot, this.engine, () => this.back());
  }

  back(): void {
    if (this.currentGame) {
      try { this.currentGame.unmount(); } catch { /* ignore */ }
      this.currentGame = null;
    }
    this.renderTiles();
  }
}
