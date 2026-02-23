import { packData, unpackData } from "./maze_data.js";

const mazeTiny = {
  start: [2, 2, 2],
  exit: [2, 0, 1],
  cells: [
    [0, 2, 2],
    [1, 0, 1],
    [2, 3, 1],
  ],
};

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

const randTwoBit = () => Math.floor(Math.random() * 4);

// Helper to build a mazeData object
const makeMaze = (cellsX, cellsY, startDir, exitDir) => ({
  start: [0, 0, startDir],
  exit: [cellsX - 1, cellsY - 1, exitDir],
  cells: Array.from({ length: cellsY }, () =>
    Array.from({ length: cellsX }, () => randTwoBit()),
  ),
});

// Round-trip helper
const roundTrip = (maze) => unpackData(packData(maze));

describe("packData / unpackData round-trip", () => {
  test("1x1 grid", () => {
    const maze = { start: [0, 0, 1], exit: [0, 0, 2], cells: [[3]] };
    expect(roundTrip(maze)).toEqual(maze);
  });

  test("2x2 grid", () => {
    const maze = makeMaze(2, 2, 3, 1);
    expect(roundTrip(maze)).toEqual(maze);
  });

  test("3x3 grid — 11 two-bit values, spans 3 packed bytes", () => {
    const maze = makeMaze(3, 3, 0, 0);
    expect(roundTrip(maze)).toEqual(maze);
  });

  test("4x4 grid — 18 two-bit values, exact multiple of 4", () => {
    const maze = makeMaze(4, 4, 0, 0);
    expect(roundTrip(maze)).toEqual(maze);
  });

  test("non-square grid (5x3)", () => {
    const maze = makeMaze(5, 3, 0, 0);
    expect(roundTrip(maze)).toEqual(maze);
  });

  test("non-square grid (3x5)", () => {
    const maze = makeMaze(3, 5, 0, 0);
    expect(roundTrip(maze)).toEqual(maze);
  });

  test("large grid (20x20)", () => {
    const maze = makeMaze(20, 20, 0, 0);
    expect(roundTrip(maze)).toEqual(maze);
  });

  test("mazeTiny", () => {
    expect(roundTrip(mazeTiny)).toEqual(mazeTiny);
  });

  test("mazeMedium", () => {
    expect(roundTrip(mazeMedium)).toEqual(mazeMedium);
  });
});

describe("cell values — all 2-bit values (0–3)", () => {
  test.each([0, 1, 2, 3])("cell value %i survives round-trip", (val) => {
    const maze = makeMaze(2, 2, val, val);
    expect(roundTrip(maze)).toEqual(maze);
  });

  test("mixed cell values in a 4x4 grid", () => {
    const maze = {
      start: [0, 0, 0],
      exit: [3, 3, 1],
      cells: [
        [0, 1, 2, 3],
        [3, 2, 1, 0],
        [1, 3, 0, 2],
        [2, 0, 3, 1],
      ],
    };
    expect(roundTrip(maze)).toEqual(maze);
  });
});

describe("start / exit directions — all 2-bit values (0–3)", () => {
  test.each([
    [0, 0],
    [1, 0],
    [0, 1],
    [3, 2],
    [2, 3],
    [3, 3],
  ])("startDir=%i exitDir=%i", (startDir, exitDir) => {
    const maze = makeMaze(2, 2, 0, startDir, exitDir);
    expect(roundTrip(maze)).toEqual(maze);
  });
});

describe("start / exit positions", () => {
  test("start and exit in non-default positions", () => {
    const maze = {
      start: [3, 1, 2],
      exit: [0, 4, 3],
      cells: Array.from({ length: 5 }, () => Array(4).fill(1)),
    };
    expect(roundTrip(maze)).toEqual(maze);
  });

  test("max byte value positions (255, 255)", () => {
    // positions are written as raw bytes so 255 is the boundary
    const maze = {
      start: [255, 255, 0],
      exit: [255, 255, 0],
      cells: [[0]],
    };
    expect(roundTrip(maze)).toEqual(maze);
  });
});

describe("grid dimensions preserved", () => {
  test("cellsX and cellsY are restored correctly", () => {
    const maze = makeMaze(7, 4);
    const result = roundTrip(maze);
    expect(result.cells.length).toBe(4); // cellsY
    expect(result.cells[0].length).toBe(7); // cellsX
  });
});

describe("output format", () => {
  test("packData returns a base64 string", () => {
    const maze = makeMaze(2, 2);
    const packed = packData(maze);
    expect(typeof packed).toBe("string");
    expect(packed).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });

  test("different mazes produce different packed strings", () => {
    const a = makeMaze(2, 2, 0);
    const b = makeMaze(2, 2, 3);
    expect(packData(a)).not.toBe(packData(b));
  });
});
