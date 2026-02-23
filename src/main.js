import { initCanvas } from "./canvas.js";
import { Controls } from "./controls/controls.js";
import { Output } from "./controls/output.js";

const config = {
  canvasWidth: 700,
  canvasHeight: 700,
  wallThickness: 4,
};

const { canvas, ctx } = initCanvas(
  "mazeCanvas",
  config.canvasWidth,
  config.canvasHeight,
);

const controls = new Controls("inputContainer");
const output = new Output("outputContainer");

console.log("Canvas initialized:", canvas, ctx);

const cellSize = 40;

for (let x = 0; x <= canvas.width; x += cellSize) {
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, canvas.height);
  ctx.stroke();
}

for (let y = 0; y <= canvas.height; y += cellSize) {
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(canvas.width, y);
  ctx.stroke();
}
