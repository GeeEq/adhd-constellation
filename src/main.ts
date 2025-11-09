import "./style.css";
import { SceneManager } from "./scene/SceneManager";

const canvas = document.getElementById("three-canvas") as HTMLCanvasElement;
const scene = new SceneManager(canvas);

// UI overlay
const panel = document.getElementById("panel")!;
const panelTitle = document.getElementById("panelTitle")!;
const closePanel = document.getElementById("closePanel")!;
scene.onSelect = (orb) => {
  panelTitle.innerText = orb.label;
  panel.classList.remove("hidden");
};

closePanel.addEventListener("click", () => {
  panel.classList.add("hidden");
});
