import { initCanvas } from "./canvas.js";
import { Controls } from "./controls/controls.js";
import { Output } from "./controls/output.js";
import { config } from "./config.js";
import { Maze } from "./maze/maze.js";
import { MazeEvents } from "./maze/maze.js";
import { unpackData } from "./maze/maze_data.js";

const { canvas, ctx } = initCanvas(
  "mazeCanvas",
  config.canvasWidth,
  config.canvasHeight,
);

const mazeTinyExample = {
  start: [2, 2, 2],
  exit: [2, 0, 1],
  cells: [
    [0, 2, 2],
    [1, 0, 1],
    [2, 3, 1],
  ],
};

let maze = null;
let controls = null;
let output = null;

const init = () => {
  let mazeData = mazeTinyExample;

  let params = new URLSearchParams(window.location.search);
  let compressedData = params.get("data");
  if (compressedData) {
    try {
      const unpacked = unpackData(compressedData);
      console.log("Unpacked data from URL:", unpacked);
      mazeData = unpacked;
    } catch (e) {
      console.warn("Failed to unpack data from URL:", e);
    }
  }

  maze = new Maze(mazeData, config);

  controls = new Controls("inputContainer", {
    cellsX: maze.cellsX,
    cellsY: maze.cellsY,
  });
  output = new Output("outputContainer");
  output.updateMazeData(maze.mazeData);

  addListeners();

  const renderMaze = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(config.margin, config.margin);
    maze.draw(ctx);
    ctx.restore();

    requestAnimationFrame(renderMaze);
  };
  renderMaze();
};

const addListeners = () => {
  window.addEventListener(MazeEvents.MazeDataUpdated, (event) => {
    console.log("Maze data updated:", event.detail.mazeData);
    output.updateMazeData(event.detail.mazeData);
  });

  window.addEventListener(MazeEvents.MazeSizeUpdated, (event) => {
    console.log("Maze size updated:", event.detail);
    maze.setSize(event.detail.cellsX, event.detail.cellsY);
    output.updateMazeData(maze.mazeData);
  });

  canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    console.log(`Canvas clicked at: (${x}, ${y})`);

    let mazeX = x - config.margin;
    let mazeY = y - config.margin;

    maze.handleWallClick(mazeX, mazeY);
  });
};

init();
