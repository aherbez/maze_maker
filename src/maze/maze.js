export class MazeCell {
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
