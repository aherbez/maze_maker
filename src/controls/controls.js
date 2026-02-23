export class Controls {
  constructor(id) {
    this.element = document.getElementById(id);
    this.element.style.border = "1px solid black";

    const header = document.createElement("h2");
    header.textContent = "Controls";
    this.element.appendChild(header);
  }
}
