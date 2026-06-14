export function drawWaves(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  baseColor: string,
): void {
  const amplitude = 28;
  const wavelength = 120;
  const r = parseInt(baseColor.slice(1, 3), 16);
  const g = parseInt(baseColor.slice(3, 5), 16);
  const b = parseInt(baseColor.slice(5, 7), 16);
  const waveColor = `rgba(${Math.min(255, r + 40)}, ${Math.max(0, g - 20)}, ${Math.max(0, b - 30)}, 0.6)`;

  ctx.strokeStyle = waveColor;
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';

  const rows = Math.ceil(height / 80) + 1;
  for (let row = 0; row < rows; row++) {
    const baseY = row * 80 + 40;
    ctx.beginPath();
    for (let x = 0; x <= width; x += 4) {
      const y = baseY + Math.sin((x / wavelength) * Math.PI * 2) * amplitude;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}
