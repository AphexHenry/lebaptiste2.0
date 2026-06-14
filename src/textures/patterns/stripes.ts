export function drawStripes(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  baseColor: string,
): void {
  const stripeWidth = 36;
  const r = parseInt(baseColor.slice(1, 3), 16);
  const g = parseInt(baseColor.slice(3, 5), 16);
  const b = parseInt(baseColor.slice(5, 7), 16);
  const stripeColor = `rgba(${Math.min(255, r + 30)}, ${Math.min(255, g + 20)}, ${Math.max(0, b - 20)}, 0.7)`;

  ctx.fillStyle = stripeColor;
  for (let x = -height; x < width + height; x += stripeWidth * 2) {
    ctx.save();
    ctx.translate(x, 0);
    ctx.rotate(Math.PI / 6);
    ctx.fillRect(0, -height, stripeWidth, height * 3);
    ctx.restore();
  }
}
