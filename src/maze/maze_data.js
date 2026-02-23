export const packData = (mazeData) => {
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

export const unpackData = (compressedData) => {
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
