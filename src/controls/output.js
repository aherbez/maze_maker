export class Output {
  constructor(id) {
    this.element = document.getElementById(id);

    this.outputJson = document.createElement("pre");
    this.outputJson.style.border = "1px solid black";
    this.outputJson.style.padding = "10px";
    this.outputJson.style.backgroundColor = "#f0f0f0";
    this.element.appendChild(this.outputJson);

    this.outputCompressed = document.createElement("pre");
    this.outputCompressed.style.border = "1px solid black";
    this.outputCompressed.style.padding = "10px";
    this.outputCompressed.style.backgroundColor = "#f0f0f0";
    this.element.appendChild(this.outputCompressed);
  }
}
