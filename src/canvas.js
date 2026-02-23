/**
 * Sets up the canvas element and returns the context.
 * @param {string} id - The canvas element ID
 * @param {number} width - Canvas width in pixels
 * @param {number} height - Canvas height in pixels
 * @returns {{ canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D }}
 */
export function initCanvas(id, width, height) {
  const canvas = document.getElementById(id);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  return { canvas, ctx };
}
