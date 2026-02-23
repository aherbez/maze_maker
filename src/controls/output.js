import { packData } from "../maze/maze_data";
import { MazeEvents } from "../maze/maze";

export class Output {
  constructor(id) {
    this.element = document.getElementById(id);

    this.addLabel("Maze Data (Compressed)");
    this.outputCompressed = document.createElement("pre");
    this.outputCompressed.style.border = "1px solid black";
    this.outputCompressed.style.padding = "10px";
    this.outputCompressed.style.backgroundColor = "#f0f0f0";
    this.element.appendChild(this.outputCompressed);

    this.addLabel("Maze Data (JSON)");
    this.outputJson = document.createElement("pre");
    this.outputJson.style.border = "1px solid black";
    this.outputJson.style.maxHeight = "80vh";
    this.outputJson.style.overflowY = "auto";
    this.outputJson.style.padding = "10px";
    this.outputJson.style.backgroundColor = "#f0f0f0";
    this.element.appendChild(this.outputJson);
  }

  addLabel(text) {
    const label = document.createElement("h2");
    label.textContent = text;
    this.element.appendChild(label);
  }

  updateMazeData(mazeData) {
    this.outputJson.textContent = JSON.stringify(mazeData, null, 2);
    this.outputCompressed.textContent = packData(mazeData);
  }
}
