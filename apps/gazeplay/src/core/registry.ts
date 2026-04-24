import { DwellEngine } from "./dwell";

export interface GameMeta {
  id: string;
  title: string;
  description: string;
  /** Emoji or short symbol used while real thumbnails are not yet imported. */
  emoji: string;
  /** Tags for future filtering (e.g. "reflexes", "memory"). */
  tags: string[];
}

export interface GameModule {
  meta: GameMeta;
  mount: (root: HTMLElement, engine: DwellEngine, onExit: () => void) => void;
  unmount: () => void;
}

const games: GameModule[] = [];

export function registerGame(m: GameModule): void {
  games.push(m);
}

export function allGames(): GameModule[] {
  return [...games];
}

export function findGame(id: string): GameModule | null {
  return games.find((g) => g.meta.id === id) ?? null;
}
