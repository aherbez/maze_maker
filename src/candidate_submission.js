/**
 * mazeTiny - A representation of the "Tiny Maze" from the assignment document,
 * The representation consists of three parts:
 * - start: An array of three integers representing the x and y position and
 * the direction of the exit
 * - exit: Same encoding as the start, but for the exit location and direction
 * - cells: A 2D array of integers representing the wall state of each cell.
 *
 * In order to avoid redundancy, only the east and south walls are encoded.
 * The encoding is based on having bit 0 represent the east wall,
 * and bit 1 represent the south wall. This gives us four possible states:
 * 0: no east or south wall
 * 1: east wall only
 * 2: south wall only
 * 3: both east and south walls
 *
 * A 2d array is used in order to allow the data to look more like a
 * visual approximation of the maze.
 */
const mazeTinyExample = {
  start: [2, 2, 2],
  exit: [2, 0, 1],
  cells: [
    [0, 2, 2],
    [1, 0, 1],
    [2, 3, 1],
  ],
};
const mazeTinyCompressed = "AwMCAgIAhkYe";

const mazeMedium = {
  start: [0, 3, 3],
  exit: [7, 7, 1],
  cells: [
    [0, 2, 2, 2, 0, 1, 0, 0],
    [1, 0, 1, 0, 3, 2, 3, 1],
    [2, 3, 1, 2, 2, 2, 1, 1],
    [1, 2, 2, 2, 1, 0, 3, 1],
    [1, 0, 2, 1, 1, 1, 1, 1],
    [2, 3, 1, 1, 3, 1, 2, 1],
    [0, 2, 3, 2, 1, 2, 1, 1],
    [2, 2, 2, 2, 2, 2, 3, 2],
  ],
};
const mazeMediumCompressed = "CAgAAwcHh0oQseeplRoXVuV1hpulqgs=";

const mazeTiny = mazeTinyExample;

const NORTH = 0;
const EAST = 1;
const SOUTH = 2;
const WEST = 3;

let mazeParsed = null;
let playerLoc = [0, 0];
let lastTimestamp = 0;
let mazeSolved = false;
let cellWidth = 0;
let cellHeight = 0;
let mazeWidth = 0;
let mazeHeight = 0;

const config = {
  margin: 20,
  wallColor: "#000000",
  mazeColor: "#FFFFFF",
  playerColor: "#FF0000",
  backgroundColor: "#00C0CC",
  wallThickness: 5,
};

class MazeCell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    // each cell is intialized with no exits
    // this makes it easier to use a variety of
    // maze generation algorithms that act by carving paths between cells
    this.exits = [false, false, false, false];
  }

  draw(ctx) {
    ctx.save();
    ctx.strokeStyle = config.wallColor;
    ctx.lineWidth = config.wallThickness;
    ctx.beginPath();
    this.exits.forEach((exit, dir) => {
      if (!exit) {
        switch (dir) {
          case EAST:
            // Draw east wall
            ctx.moveTo(cellWidth, -config.wallThickness / 2);
            ctx.lineTo(cellWidth, cellHeight + config.wallThickness / 2);
            break;
          case SOUTH:
            // Draw south wall
            ctx.moveTo(-config.wallThickness / 2, cellHeight);
            ctx.lineTo(cellWidth + config.wallThickness / 2, cellHeight);
            break;
        }
      }
    });
    ctx.stroke();
    ctx.restore();
  }
}

class Maze {
  constructor(mazeData) {
    this.initFromData(mazeData);
  }

  initCells() {
    this.cells = [];

    // init cells
    for (let y = 0; y < this.cellsY; y++) {
      const row = [];
      for (let x = 0; x < this.cellsX; x++) {
        const newCell = new MazeCell(x, y);
        row.push(newCell);
      }
      this.cells.push(row);
    }
  }

  initFromData(mazeData) {
    this.cellsX = mazeData.cells[0].length;
    this.cellsY = mazeData.cells.length;
    this.initCells();

    // carve paths based on maze data
    for (let y = 0; y < this.cellsY; y++) {
      for (let x = 0; x < this.cellsX; x++) {
        const eastWall = (mazeData.cells[y][x] & 1) > 0;
        const southWall = (mazeData.cells[y][x] & 2) > 0;

        if (!eastWall) {
          this.carvePath(x, y, EAST);
        }
        if (!southWall) {
          this.carvePath(x, y, SOUTH);
        }
      }
    }

    // init start and exit
    this.start = {
      x: mazeData.start[0],
      y: mazeData.start[1],
      dir: mazeData.start[2],
    };
    this.exit = {
      x: mazeData.exit[0],
      y: mazeData.exit[1],
      dir: mazeData.exit[2],
    };

    // carve entrance and exit paths
    this.carvePath(this.start.x, this.start.y, this.start.dir);
    this.carvePath(this.exit.x, this.exit.y, this.exit.dir);
  }

  get startLocation() {
    return [this.start.x, this.start.y];
  }

  getCell(x, y) {
    if (x < 0 || x >= this.cellsX || y < 0 || y >= this.cellsY) {
      return null;
    }
    return this.cells[y][x];
  }

  getNeighbor(cell, dir) {
    switch (dir) {
      case EAST:
        return this.getCell(cell.x + 1, cell.y);
      case SOUTH:
        return this.getCell(cell.x, cell.y + 1);
      case WEST:
        return this.getCell(cell.x - 1, cell.y);
      case NORTH:
        return this.getCell(cell.x, cell.y - 1);
      default:
        return null;
    }
  }

  // Carves a path between a given cell and its
  // neighbor in a given direction.
  // Marks both this cell and the neighbor as
  // having exits in the appropriate directions.
  carvePath(x, y, dir) {
    const cell = this.getCell(x, y);
    if (!cell) {
      return;
    }

    cell.exits[dir] = true;

    const reverseDir = (dir + 2) % 4;
    const neighbor = this.getNeighbor(cell, dir);
    if (neighbor) {
      neighbor.exits[reverseDir] = true;
    }
  }

  /**
   * Overlays a polygon on top of the exterior wall at
   * the given cell in order to indicate the entrance/exit
   * @param {2DRenderingContext} ctx
   * @param {Number} x
   * @param {Number} y
   * @param {Number} direction
   */
  drawExit(ctx, x, y, direction) {
    ctx.save();
    ctx.fillStyle = config.mazeColor;

    // move to center of cell
    ctx.translate((x + 0.5) * cellWidth, (y + 0.5) * cellHeight);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.rotate(direction * (Math.PI / 2));
    ctx.rect(
      -cellWidth / 2 + config.wallThickness / 2,
      -cellHeight / 2 - config.wallThickness / 2 - 2,
      cellWidth - config.wallThickness,
      config.wallThickness + 4,
    );
    ctx.fill();
    ctx.restore();
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = config.mazeColor;
    ctx.strokeStyle = config.wallColor;
    ctx.lineWidth = config.wallThickness;
    ctx.beginPath();
    ctx.rect(0, 0, cellWidth * this.cellsX, cellHeight * this.cellsY);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.save();

    for (let y = 0; y < this.cellsY; y++) {
      for (let x = 0; x < this.cellsX; x++) {
        ctx.save();
        const cell = this.cells[y][x];
        ctx.translate(x * cellWidth, y * cellHeight);
        cell.draw(ctx);
        ctx.restore();
      }
    }

    // draw the exit
    this.drawExit(ctx, this.exit.x, this.exit.y, this.exit.dir);
    this.drawExit(ctx, this.start.x, this.start.y, this.start.dir);
    ctx.restore();
  }
}

const drawPlayer = () => {
  ctx.save();
  ctx.fillStyle = config.playerColor;
  ctx.lineWidth = 0;
  ctx.beginPath();
  const centerX = (playerLoc[0] + 0.5) * cellWidth;
  const centerY = (playerLoc[1] + 0.5) * cellHeight;
  ctx.arc(
    centerX,
    centerY,
    Math.min(cellWidth, cellHeight) / 4,
    0,
    2 * Math.PI,
  );
  ctx.fill();
  ctx.restore();
};

const clearCanvas = () => {
  //Fills the entire canvas with a greenish blue
  ctx.save();
  ctx.fillStyle = config.backgroundColor;
  ctx.beginPath();
  ctx.rect(0, 0, canvasWidth, canvasHeight);
  ctx.fill();
  ctx.restore();
};

const drawEndScreen = () => {
  const lineHeight = 30;

  // fade the maze for better contrast with the end screen overlay
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  ctx.restore();

  // draw background for end screen text
  ctx.save();
  ctx.translate(canvasWidth / 4, canvasHeight / 4);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.rect(0, 0, canvasWidth / 2, canvasHeight / 4);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // draw end screen text
  ctx.save();
  ctx.translate(canvasWidth / 2, canvasHeight / 4 + lineHeight);
  ctx.fillStyle = "#000000";
  ctx.font = "24px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("Congratulations!", 0, 0);
  ctx.fillText("You solved the maze!", 0, lineHeight);
  ctx.fillText("Press 'R' to reset.", 0, lineHeight * 2);
  ctx.restore();
};

const resetGame = (mazeData) => {
  mazeParsed = new Maze(mazeData);
  playerLoc = mazeParsed.startLocation;
  cellWidth = mazeWidth / mazeParsed.cellsX;
  cellHeight = mazeHeight / mazeParsed.cellsY;
  mazeSolved = false;
};

const packData = (mazeData) => {
  // write 8-bit int for cellsX and cellsY
  const bytes = [];
  bytes.push(mazeData.cells[0].length); // cellsX
  bytes.push(mazeData.cells.length); // cellsY

  // write 8-bit int for start and exit locations
  bytes.push(mazeData.start[0]);
  bytes.push(mazeData.start[1]);
  bytes.push(mazeData.exit[0]);
  bytes.push(mazeData.exit[1]);

  const twoBitsPacked = [];
  let bitOffset = 0;
  let currentByte = 0;

  const packTwoBitValue = (value) => {
    const masked = value & 0b11; // Ensure only the last 2 bits are used
    currentByte |= masked << bitOffset;
    bitOffset += 2;

    if (bitOffset >= 8) {
      twoBitsPacked.push(currentByte);
      currentByte = 0;
      bitOffset = 0;
    }
  };

  // pack the direction values for start and exit
  packTwoBitValue(mazeData.start[2]);
  packTwoBitValue(mazeData.exit[2]);

  // pack the cell data
  for (let y = 0; y < mazeData.cells.length; y++) {
    for (let x = 0; x < mazeData.cells[y].length; x++) {
      packTwoBitValue(mazeData.cells[y][x]);
    }
  }

  // if there are remaining bits, push the last byte
  if (bitOffset > 0) {
    twoBitsPacked.push(currentByte);
  }

  bytes.push(...twoBitsPacked);

  const s = String.fromCharCode(...bytes);
  return btoa(s);
};

const unpackData = (compressedData) => {
  const byteString = atob(compressedData);
  const bytes = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    bytes[i] = byteString.charCodeAt(i);
  }

  const data = {};

  // get 8-bit ints
  const eightBitInts = Array.from(bytes.slice(0, 6));

  const cellsX = eightBitInts[0];
  const cellsY = eightBitInts[1];
  const startLoc = [eightBitInts[2], eightBitInts[3]];
  const exitLoc = [eightBitInts[4], eightBitInts[5]];

  const numTwoBitValues = cellsX * cellsY + 2;
  const twoBitStart = 6;

  let currentByte = 0;
  let bitOffset = 0;
  let byteIndex = twoBitStart;

  const twoBitValues = [];

  for (let i = 0; i < numTwoBitValues; i++) {
    if (bitOffset === 0) {
      currentByte = bytes[byteIndex++];
    }

    const val = (currentByte >> bitOffset) & 0x03;
    twoBitValues.push(val);
    bitOffset += 2;
    if (bitOffset >= 8) {
      bitOffset = 0;
    }
  }

  data.start = [...startLoc, twoBitValues[0]];
  data.exit = [...exitLoc, twoBitValues[1]];

  const cells = [];
  for (let y = 0; y < cellsY; y++) {
    const row = [];
    for (let x = 0; x < cellsX; x++) {
      const cellIndex = y * cellsX + x + 2;
      if (cellIndex >= twoBitValues.length) {
        throw new Error("Not enough two-bit values to unpack cells");
      }

      row.push(twoBitValues[cellIndex]);
    }
    cells.push(row);
  }

  data.cells = cells;
  return data;
};

const testPackUnpack = () => {
  console.log("Testing pack and unpack functions...");

  const runTest = (data) => {
    const compressed = packData(data);
    const uncompressed = unpackData(compressed);
    const success = JSON.stringify(data) === JSON.stringify(uncompressed);
    console.log("Original:", data);
    console.log("Uncompressed:", uncompressed);
    console.log("Test passed:", success);
  };
  console.log("Testing with mazeTinyExample:");
  runTest(mazeTinyExample);

  console.log("Testing with mazeMedium:");
  runTest(mazeMedium);
};

/**
 * Draws the maze grid and initial player avatar onto the canvas.
 *
 * @param {Object} mazeData - The representation of the maze; structure depends on your chosen data format.
 * @param {number} width - The pixel width of the canvas.
 * @param {number} height - The pixel height of the canvas.
 */
const drawMaze = function (mazeData, width, height) {
  let params = new URLSearchParams(window.location.search);
  let compressedData = params.get("data");
  let initData = mazeData;
  if (compressedData) {
    try {
      const unpacked = unpackData(compressedData);
      console.log("Unpacked data from URL:", unpacked);
      initData = unpacked;
    } catch (e) {
      console.warn("Failed to unpack data from URL:", e);
    }
  }

  mazeParsed = new Maze(initData);
  playerLoc = mazeParsed.startLocation;

  mazeWidth = width - 2 * config.margin;
  mazeHeight = height - 2 * config.margin;
  cellWidth = mazeWidth / mazeParsed.cellsX;
  cellHeight = mazeHeight / mazeParsed.cellsY;

  const renderMaze = (timestamp) => {
    clearCanvas();

    const delta = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    ctx.save();
    ctx.translate(config.margin, config.margin);
    mazeParsed.draw(ctx);
    drawPlayer();
    ctx.restore();

    if (mazeSolved) {
      drawEndScreen();
    }

    requestAnimationFrame(renderMaze);
  };

  renderMaze(Date.now());
};

const checkMazeSolved = function () {
  if (!mazeParsed) {
    return false;
  }
  return (
    playerLoc[0] === mazeParsed.exit.x && playerLoc[1] === mazeParsed.exit.y
  );
};

/**
 * Handles keyboard arrow key input to move the player within the maze.
 *
 * @param {KeyboardEvent} evt - The keyboard event corresponding to the key pressed.
 */
const onKeyDown = function (evt) {
  if (!mazeParsed) {
    return;
  }

  const currentCell = mazeParsed.getCell(playerLoc[0], playerLoc[1]);

  let moved = false;
  switch (evt.key) {
    case "ArrowUp":
    case "w":
      // maybe move north
      if (!mazeSolved && currentCell && currentCell.exits[NORTH]) {
        playerLoc[1] -= 1;
        moved = true;
      }
      break;
    case "ArrowRight":
    case "d":
      // maybe move east
      if (!mazeSolved && currentCell && currentCell.exits[EAST]) {
        playerLoc[0] += 1;
        moved = true;
      }
      break;
    case "ArrowDown":
    case "s":
      // maybe move south
      if (!mazeSolved && currentCell && currentCell.exits[SOUTH]) {
        playerLoc[1] += 1;
        moved = true;
      }
      break;
    case "ArrowLeft":
    case "a":
      // maybe move west
      if (!mazeSolved && currentCell && currentCell.exits[WEST]) {
        playerLoc[0] -= 1;
        moved = true;
      }
      break;
    case "r":
      // reset player location
      playerLoc = mazeParsed.startLocation;
      mazeSolved = false;
      break;
    case "1":
      // load simple maze
      resetGame(mazeTinyExample);
      break;
    case "2":
      // load medium maze
      resetGame(mazeMedium);
      break;
    default:
      break;
  }
  if (moved) {
    mazeSolved = checkMazeSolved();
  }
};
