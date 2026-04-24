import { registerGame } from "./core/registry";
import { Hub } from "./core/hub";
import { creamPieGame } from "./games/creampie";
import { bubblesGame } from "./games/bubbles";
import "./style.css";

registerGame(creamPieGame);
registerGame(bubblesGame);

const root = document.getElementById("app");
if (!root) {
  document.body.innerHTML = "<p>GazePlay : élément #app introuvable.</p>";
  throw new Error("Missing #app");
}

const hub = new Hub(root);
hub.start().catch((e) => {
  console.error("[gazeplay] hub failed:", e);
  root.innerHTML = `<p>Impossible de démarrer GazePlay : ${String(e.message || e)}</p>`;
});
