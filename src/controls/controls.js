import { MazeEvents } from "../maze/maze.js";

export class Controls {
  constructor(id, initialSettings = {}) {
    this.element = document.getElementById(id);
    this.element.style.border = "1px solid black";
    this.element.style.padding = "10px";

    const header = document.createElement("h2");
    header.textContent = "Settings";
    this.element.appendChild(header);

    this.cellsX = initialSettings.cellsX || 10;
    this.cellsY = initialSettings.cellsY || 10;

    this.addNumberInput("Cells X", this.cellsX, (value) => {
      this.cellsX = value;
    });
    this.addNumberInput("Cells Y", this.cellsY, (value) => {
      this.cellsY = value;
    });
    this.addButton("Update Size", () => {
      const event = new CustomEvent(MazeEvents.MazeSizeUpdated, {
        detail: { cellsX: this.cellsX, cellsY: this.cellsY },
      });
      window.dispatchEvent(event);
    });
  }

  addButton(label, onClick) {
    const button = document.createElement("button");
    button.textContent = label;
    button.style.display = "block";
    button.style.marginTop = "10px";
    button.addEventListener("click", onClick);
    this.element.appendChild(button);
  }

  addNumberInput(labelText, defaultValue, onChange) {
    const label = document.createElement("label");
    label.textContent = labelText;
    label.style.display = "block";
    label.style.marginBottom = "5px";

    const input = document.createElement("input");
    input.type = "number";
    input.value = defaultValue;
    input.style.width = "100%";
    input.style.padding = "5px";
    input.style.boxSizing = "border-box";

    input.addEventListener("change", () => {
      const value = parseInt(input.value, 10);
      if (!isNaN(value)) {
        onChange(value);
      }
    });

    label.appendChild(input);
    this.element.appendChild(label);
  }
}
