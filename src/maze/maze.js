import { config } from "../config.js";
import { NORTH, EAST, SOUTH, WEST } from "../constants.js";

export const MazeEvents = {
  MazeDataUpdated: "mazeDataUpdated",
  MazeSizeUpdated: "mazeSizeUpdated",
};

export class MazeCell {
  constructor(x, y, cellWidth, cellHeight) {
    this.x = x;
    this.y = y;
    this.cellWidth = cellWidth;
    this.cellHeight = cellHeight;
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
            ctx.moveTo(this.cellWidth, -config.wallThickness / 2);
            ctx.lineTo(
              this.cellWidth,
              this.cellHeight + config.wallThickness / 2,
            );
            break;
          case SOUTH:
            // Draw south wall
            ctx.moveTo(-config.wallThickness / 2, this.cellHeight);
            ctx.lineTo(
              this.cellWidth + config.wallThickness / 2,
              this.cellHeight,
            );
            break;
        }
      }
    });
    ctx.stroke();
    ctx.restore();
  }
}

export class Maze {
  constructor(mazeData) {
    this.initFromData(mazeData);
  }

  initCells() {
    this.cells = [];

    // init cells
    for (let y = 0; y < this.cellsY; y++) {
      const row = [];
      for (let x = 0; x < this.cellsX; x++) {
        const newCell = new MazeCell(x, y, this.cellWidth, this.cellHeight);
        row.push(newCell);
      }
      this.cells.push(row);
    }
  }

  setSize(cellsX, cellsY) {
    this.cellsX = cellsX;
    this.cellsY = cellsY;

    this.cellWidth = (config.canvasWidth - config.margin * 2) / this.cellsX;
    this.cellHeight = (config.canvasHeight - config.margin * 2) / this.cellsY;

    this.start = { x: 0, y: 0, dir: WEST };
    this.exit = { x: this.cellsX - 1, y: this.cellsY - 1, dir: EAST };

    this.initCells();
  }

  initFromData(mazeData) {
    this.cellsX = mazeData.cells[0].length;
    this.cellsY = mazeData.cells.length;

    this.cellWidth = (config.canvasWidth - config.margin * 2) / this.cellsX;
    this.cellHeight = (config.canvasHeight - config.margin * 2) / this.cellsY;

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

  get exitLocation() {
    return [this.exit.x, this.exit.y];
  }

  get mazeData() {
    const data = {};
    data.start = [this.start.x, this.start.y, this.start.dir];
    data.exit = [this.exit.x, this.exit.y, this.exit.dir];
    data.cells = this.cells.map((row) =>
      row.map((cell) => {
        let cellValue = 0;
        if (!cell.exits[EAST]) {
          cellValue |= 1;
        }
        if (!cell.exits[SOUTH]) {
          cellValue |= 2;
        }
        return cellValue;
      }),
    );
    return data;
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

  addWall(x, y, dir) {
    const cell = this.getCell(x, y);
    if (!cell) {
      return;
    }
    cell.exits[dir] = false;
    const reverseDir = (dir + 2) % 4;
    const neighbor = this.getNeighbor(cell, dir);
    if (neighbor) {
      neighbor.exits[reverseDir] = false;
    }
  }

  toggleWall(x, y, dir) {
    const cell = this.getCell(x, y);
    if (!cell) {
      return;
    }
    const hasWall = !cell.exits[dir];
    if (hasWall) {
      this.carvePath(x, y, dir);
    } else {
      this.addWall(x, y, dir);
    }

    // emit data updated event
    const event = new CustomEvent(MazeEvents.MazeDataUpdated, {
      detail: { mazeData: this.mazeData },
    });
    window.dispatchEvent(event);
  }

  handleWallClick(x, y) {
    const mazeX = x - (this.cellWidth - 20);
    const mazeY = y - (this.cellHeight - 20);

    let cellX = Math.floor(mazeX / this.cellWidth);
    let cellY = Math.floor(mazeY / this.cellHeight);

    const deltaX = Math.abs(mazeX - cellX * this.cellWidth);
    const deltaY = Math.abs(mazeY - cellY * this.cellHeight);

    if (deltaX < 40 && deltaY < 40) {
      console.log("Clicked on a corner, ambiguous intent");
    } else if (deltaX > 40 && deltaY > 40) {
      console.log("Clicked inside cell, not on a wall");
    } else {
      if (deltaX < deltaY) {
        cellY = Math.floor((y - config.margin) / this.cellHeight);
        this.toggleWall(cellX, cellY, EAST);
      } else {
        cellX = Math.floor((x - config.margin) / this.cellWidth);
        this.toggleWall(cellX, cellY, SOUTH);
      }
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
    ctx.translate((x + 0.5) * this.cellWidth, (y + 0.5) * this.cellHeight);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.rotate(direction * (Math.PI / 2));
    ctx.rect(
      -this.cellWidth / 2 + config.wallThickness / 2,
      -this.cellHeight / 2 - config.wallThickness / 2 - 2,
      this.cellWidth - config.wallThickness,
      config.wallThickness + 4,
    );
    ctx.fill();
    ctx.restore();
  }

  drawGrid(ctx) {
    ctx.save();
    ctx.strokeStyle = config.gridColor;
    ctx.lineWidth = 1;

    for (let x = 0; x <= this.cellsX; x++) {
      ctx.beginPath();
      ctx.moveTo(x * this.cellWidth, 0);
      ctx.lineTo(x * this.cellWidth, this.cellsY * this.cellHeight);
      ctx.stroke();
    }

    for (let y = 0; y <= this.cellsY; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * this.cellHeight);
      ctx.lineTo(this.cellsX * this.cellWidth, y * this.cellHeight);
      ctx.stroke();
    }
    ctx.restore();
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = config.mazeColor;
    ctx.strokeStyle = config.wallColor;
    ctx.lineWidth = config.wallThickness;
    ctx.beginPath();
    ctx.rect(0, 0, this.cellWidth * this.cellsX, this.cellHeight * this.cellsY);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    this.drawGrid(ctx);

    ctx.save();

    for (let y = 0; y < this.cellsY; y++) {
      for (let x = 0; x < this.cellsX; x++) {
        ctx.save();
        const cell = this.cells[y][x];
        ctx.translate(x * this.cellWidth, y * this.cellHeight);
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
