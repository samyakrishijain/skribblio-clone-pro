/**
 * High-performance Queue-based BFS Flood Fill for HTML5 Canvas
 */
export function floodFill(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColorHex: string
) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  // Convert fill color hex to RGBA
  const fillRgba = hexToRgba(fillColorHex);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = new Uint32Array(imgData.data.buffer);

  const x0 = Math.floor(startX);
  const y0 = Math.floor(startY);

  if (x0 < 0 || x0 >= width || y0 < 0 || y0 >= height) return;

  const targetColor = data[y0 * width + x0];
  const fillColor32 =
    (fillRgba[3] << 24) |
    (fillRgba[2] << 16) |
    (fillRgba[1] << 8) |
    fillRgba[0];

  // If already the same color, no-op
  if (targetColor === fillColor32) return;

  // Linear queue for fast BFS without recursion stack overflow
  const queue: number[] = [x0, y0];
  let head = 0;

  const visited = new Uint8Array(width * height);
  visited[y0 * width + x0] = 1;

  while (head < queue.length) {
    const x = queue[head++];
    const y = queue[head++];

    const idx = y * width + x;
    data[idx] = fillColor32;

    // Check 4 neighbors
    const neighbors = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1]
    ];

    for (let i = 0; i < 4; i++) {
      const nx = neighbors[i][0];
      const ny = neighbors[i][1];

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = ny * width + nx;
        if (!visited[nIdx] && colorMatch(data[nIdx], targetColor, 32)) {
          visited[nIdx] = 1;
          queue.push(nx, ny);
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

function colorMatch(c1: number, c2: number, tolerance: number): boolean {
  if (c1 === c2) return true;

  const r1 = c1 & 0xff;
  const g1 = (c1 >> 8) & 0xff;
  const b1 = (c1 >> 16) & 0xff;
  const a1 = (c1 >> 24) & 0xff;

  const r2 = c2 & 0xff;
  const g2 = (c2 >> 8) & 0xff;
  const b2 = (c2 >> 16) & 0xff;
  const a2 = (c2 >> 24) & 0xff;

  return (
    Math.abs(r1 - r2) <= tolerance &&
    Math.abs(g1 - g2) <= tolerance &&
    Math.abs(b1 - b2) <= tolerance &&
    Math.abs(a1 - a2) <= tolerance
  );
}

function hexToRgba(hex: string): [number, number, number, number] {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255, 255];
}
