export function drawSquares(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  baseColor: string,
): void {
  const size = 56;
  const gap = 16;
  const r = parseInt(baseColor.slice(1, 3), 16);
  const g = parseInt(baseColor.slice(3, 5), 16);
  const b = parseInt(baseColor.slice(5, 7), 16);
  const squareColor = `rgba(${Math.min(255, r + 50)}, ${Math.max(0, g - 30)}, ${Math.min(255, b + 40)}, 0.65)`;

  ctx.fillStyle = squareColor;
  const step = size + gap;
  for (let y = gap; y < height; y += step) {
    for (let x = gap; x < width; x += step) {
      const offset = (Math.floor(y / step) % 2) * (step / 2);
      ctx.fillRect(x + offset, y, size, size);
    }
  }
}
