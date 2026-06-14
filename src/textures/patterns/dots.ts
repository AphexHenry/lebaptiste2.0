export function drawDots(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  baseColor: string,
): void {
  const spacing = 48;
  const radius = 10;
  const r = parseInt(baseColor.slice(1, 3), 16);
  const g = parseInt(baseColor.slice(3, 5), 16);
  const b = parseInt(baseColor.slice(5, 7), 16);
  const dotColor = `rgba(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)}, 0.55)`;

  ctx.fillStyle = dotColor;
  for (let y = spacing / 2; y < height; y += spacing) {
    for (let x = spacing / 2; x < width; x += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
