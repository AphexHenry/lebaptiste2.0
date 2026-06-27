import * as THREE from 'three';
import {
  Page,
  configureBitmapTexture,
  createTexturedFrontFace,
  getPageDimensions,
} from './page';
import backgroundUrl from '../../assets/backgroundOrangeAquarel.jpg';

type ResumeEntryType = 'study' | 'pro' | 'art';

type ResumeEntry = {
  company: string;
  title: string;
  displayShort?: string;
  years: string;
  place: string;
  importance: number;
  type: ResumeEntryType;
  yearStart: number;
  sortOrder?: number;
  xOffset?: number;
  calloutAngle?: number;
  satteliteOf?: string;
};

type ResumeRecord = {
  entry: ResumeEntry;
  position: THREE.Vector2;
  radius: number;
  accentColor: number;
};

type SatelliteOrbit = {
  entry: ResumeEntry;
  parent: ResumeRecord;
  phase: number;
  speedScale: number;
  radius: number;
  accentColor: number;
};

type PageLayout = {
  pageWidth: number;
  pageHeight: number;
  contentWidth: number;
  contentHeight: number;
  center: THREE.Vector2;
  mainRecords: ResumeRecord[];
  satelliteOrbits: SatelliteOrbit[];
};

const RESUME_ENTRIES: ResumeEntry[] = [
  {
    company: 'IRCAM',
    title: "Master's degree - Science of Music",
    displayShort: 'IRCAM',
    years: '2008-2009',
    place: 'Paris, France',
    importance: 1.1,
    type: 'study',
    yearStart: 2008,
    sortOrder: 0,
  },
  {
    company: 'Dancing Dots',
    displayShort: 'Dancing Dots - Audio Dev',
    title: 'Video Game Audio',
    years: '2008',
    place: 'Paris, France',
    importance: 0.45,
    type: 'pro',
    yearStart: 2008,
    sortOrder: 1,
    xOffset: 0.5,
    calloutAngle: -0.8,
  },
  {
    company: 'IRCAM',
    title: 'Sound Processing Intern',
    displayShort: 'IRCAM Internship',
    years: '2009',
    place: 'Paris, France',
    importance: 0.4,
    type: 'pro',
    yearStart: 2009,
    xOffset: -0.2,
  },
  {
    company: "Lulu's Exploration",
    title: 'Experimental Video Game',
    displayShort: "Lulu's Unreal Exploration",
    years: '2009-2013',
    place: 'France - Canada',
    importance: 0.6,
    type: 'art',
    yearStart: 2010,
    xOffset: -0.26,
  },
  {
    company: 'Konami',
    displayShort: 'Konami - Audio Dev',
    title: 'Developer / Sound Designer',
    years: '2010',
    place: 'Paris, France - On-site',
    importance: 1,
    type: 'pro',
    yearStart: 2010,
    xOffset: 0.16,
  },
  {
    company: 'Le Cube',
    title: 'Interactive Installation Dev',
    displayShort: 'Le Cube',
    years: '2011',
    place: 'Issy-les-Moulineaux, France',
    importance: 0.4,
    type: 'pro',
    yearStart: 2011,
    xOffset: 0.8,
    calloutAngle: -2,
  },
  {
    company: 'Tangible Interaction',
    displayShort: 'Tangible Interaction',
    title: 'Engineer',
    years: '2012-2015',
    place: 'Vancouver',
    importance: 1.4,
    type: 'pro',
    yearStart: 2012,
    xOffset: -0.4,
  },
  {
    company: 'Social Mosa',
    displayShort: 'Social Mosa',
    title: 'Instagram Visualizer for Events',
    years: '2012-2015',
    place: 'Vancouver',
    importance: 0.3,
    type: 'pro',
    yearStart: 2012,
    xOffset: -0.4,
    satteliteOf: 'Tangible Interaction',
  },
  {
    company: 'Halo',
    displayShort: 'Halo',
    title: 'Light Installation',
    years: '2012-2015',
    place: 'Vancouver',
    importance: 0.3,
    type: 'pro',
    yearStart: 2012,
    xOffset: -0.4,
    satteliteOf: 'Tangible Interaction',
  },
  {
    company: 'Cortex',
    displayShort: 'Cortex',
    title: 'Light Control Software',
    years: '2012-2015',
    place: 'Vancouver',
    importance: 0.3,
    type: 'pro',
    yearStart: 2012,
    xOffset: -0.4,
    satteliteOf: 'Tangible Interaction',
  },
  {
    company: 'Graffiti Wall',
    displayShort: 'Graffiti Wall',
    title: 'Digital Graffiti Wall',
    years: '2012-2015',
    place: 'Vancouver',
    importance: 0.3,
    type: 'pro',
    yearStart: 2012,
    xOffset: -0.4,
    satteliteOf: 'Tangible Interaction',
  },
  {
    company: 'Visitor',
    displayShort: 'Visitor',
    title: 'Light Sculpture',
    years: '2012-2015',
    place: 'Vancouver',
    importance: 0.3,
    type: 'pro',
    yearStart: 2015,
    xOffset: -0.4,
    satteliteOf: 'Tangible Interaction',
  },
  {
    company: 'Musical Box',
    title: 'Workshop Series',
    years: '2016',
    place: 'Bucharest, Romania',
    importance: 0.45,
    type: 'art',
    yearStart: 2016,
    xOffset: -0.3,
    calloutAngle: -2,
  },
  {
    company: 'Onde de Choc',
    title: 'Dance Performance',
    displayShort: 'Onde de Choc',
    years: '2013',
    place: 'Yukon Art Centre',
    importance: 0.4,
    type: 'art',
    yearStart: 2013,
    xOffset: -0.2,
  },
  {
    company: 'Cocoons - Fete des Lumieres',
    title: 'Light and Sound Interactive Installation',
    displayShort: 'Cocoons',
    years: '2015',
    place: 'Lyon, France',
    importance: 0.7,
    type: 'art',
    yearStart: 2015,
    xOffset: -0.4,
  },
  {
    company: 'Projection Interieure Projection',
    title: 'Interactive Video Installation',
    years: '',
    place: '',
    importance: 0.45,
    type: 'art',
    yearStart: 2014,
    xOffset: 0.2,
  },
  {
    company: 'Womb',
    title: '360 Interactive Video',
    years: '2015',
    place: '',
    importance: 0.4,
    type: 'art',
    yearStart: 2016,
    xOffset: 0.6,
    calloutAngle: -0.4,
  },
  {
    company: 'Triber',
    title: 'Mobile Developer',
    years: '2015',
    place: 'Greater Paris Metropolitan Region',
    importance: 0.45,
    type: 'pro',
    yearStart: 2015,
    xOffset: 0.4,
    calloutAngle: 0.4,
  },
  {
    company: 'Шагни через границу',
    title: 'Comics Exhibition - Bishkek',
    years: '2019',
    place: 'Bishkek, Kyrgyzstan',
    importance: 0.45,
    type: 'art',
    yearStart: 2019,
    xOffset: 0.9,
    calloutAngle: -0.4,
  },
  {
    company: 'McGill University',
    title: 'Orchview / Orchplay',
    years: '2018-2025',
    place: 'Montreal - Remote',
    importance: 1.3,
    type: 'pro',
    yearStart: 2016,
    xOffset: -0.1,
  },
  {
    company: 'Orchplay',
    title: 'Educational Musical Software',
    years: '2018-2025',
    place: 'Montreal - Remote',
    importance: 0.3,
    type: 'pro',
    yearStart: 2016,
    xOffset: -0.1,
    satteliteOf: 'McGill University',
  },
  {
    company: 'Orchview',
    title: 'Research Tool for Music Theory',
    years: '2018-2025',
    place: 'Montreal - Remote',
    importance: 0.3,
    type: 'pro',
    yearStart: 2018,
    xOffset: -0.1,
    satteliteOf: 'McGill University',
  },
  {
    company: 'Badly Drawn',
    title: 'Founder',
    years: 'Jan 2025 - Present',
    place: 'Paris, France',
    importance: 1.1,
    type: 'pro',
    yearStart: 2025,
    xOffset: -0.1,
  },
];

const RESUME_LAYOUT_CENTER = { x: -0.04, y: -0.02 };
const PAPER_WHITE = '#f7f1e7';
/** Pixel height of the page canvas; width follows page aspect ratio. */
const PAGE_CANVAS_HEIGHT = 2048;
/** 16 accents tuned for contrast on warm beige: crisp blues/teals, coral, jewel tones. */
const RESUME_ACCENT_COLORS = [
  0x2563eb, 0x0891b2, 0x14b8a6, 0x0f766e, 0x4338ca, 0x7c3aed, 0xa855f7, 0xd946ef,
  0xdb2777, 0xe11d48, 0xf43f5e, 0xf97316, 0xd97706, 0x65a30d, 0x16a34a, 0x15803d,
] as const;
const PATH_COLOR = 0x8b7a6f;
const SATELLITE_ORBIT_SPEED = 0.38;
const GOLDEN_ANGLE = 2.39996322972865332;

function chronologicalEntries() {
  return RESUME_ENTRIES.slice().sort((a, b) => {
    if (a.yearStart !== b.yearStart) return a.yearStart - b.yearStart;
    const orderA = a.sortOrder ?? 0;
    const orderB = b.sortOrder ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    return `${a.type}${shortLabel(a)}`.localeCompare(`${b.type}${shortLabel(b)}`);
  });
}

function satelliteParentName(entry: ResumeEntry) {
  return entry.satteliteOf ?? '';
}

function findSatelliteParent(entry: ResumeEntry, entries: ResumeEntry[]) {
  const parentName = satelliteParentName(entry);
  if (!parentName) return null;
  return entries.find((candidate) => candidate !== entry && candidate.company === parentName) ?? null;
}

function stackEntries(entries: ResumeEntry[]) {
  return entries.filter((entry) => !findSatelliteParent(entry, entries));
}

function importanceToRadius(importance: number) {
  return THREE.MathUtils.lerp(0.055, 0.17, THREE.MathUtils.clamp(importance / 1.4, 0, 1));
}

function accentColorAt(index: number) {
  return RESUME_ACCENT_COLORS[index % RESUME_ACCENT_COLORS.length];
}

function accentCssColor(color: number) {
  return `#${color.toString(16).padStart(6, '0')}`;
}

function shortLabel(entry: ResumeEntry) {
  if (entry.displayShort) return entry.displayShort;
  const label = entry.company || entry.title || 'Resume';
  return label.length > 32 ? `${label.slice(0, 29)}...` : label;
}

function subtitle(entry: ResumeEntry) {
  const parts = [entry.title, entry.years].filter(Boolean);
  return parts.join(' - ');
}

function pathPosition(
  index: number,
  total: number,
  center: THREE.Vector2,
  width: number,
  height: number,
  entry: ResumeEntry,
) {
  const t = total <= 1 ? 0.5 : index / (total - 1);
  const verticalSpan = height * 0.78;
  const curveAmp = width * 0.2;
  const offset = (entry.xOffset ?? 0) * width * 0.11;
  const x = center.x + Math.sin(t * Math.PI) * curveAmp - width * 0.09 + offset;
  const y = center.y + verticalSpan * 0.5 * (1 - 2 * t);
  const lateral = Math.sin(index * GOLDEN_ANGLE) * width * 0.025;
  return new THREE.Vector2(x + lateral, y);
}

function layoutResumeParticlePositions(
  entries: ResumeEntry[],
  center: THREE.Vector2,
  width: number,
  height: number,
) {
  const positions = entries.map((entry, index) =>
    pathPosition(index, entries.length, center, width, height, entry),
  );
  const anchors = positions.map((position) => position.clone());
  const radii = entries.map((entry) => importanceToRadius(entry.importance));
  const iterations = Math.min(20, 8 + Math.floor(entries.length * 0.9));

  for (let iter = 0; iter < iterations; iter++) {
    const deltas = positions.map(() => new THREE.Vector2());
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dx = positions[j].x - positions[i].x;
        const dy = positions[j].y - positions[i].y;
        const distSq = dx * dx + dy * dy;
        const minDist = (radii[i] + radii[j]) * 1.85;
        if (distSq > 1e-8 && distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq);
          const overlap = ((minDist - dist) / dist) * 0.48;
          deltas[i].x -= dx * overlap;
          deltas[j].x += dx * overlap;
        }
      }
    }

    for (let i = 0; i < positions.length; i++) {
      deltas[i].x += (anchors[i].x - positions[i].x) * 0.18;
      deltas[i].y += (anchors[i].y - positions[i].y) * 0.18;
      positions[i].x += deltas[i].x;
      positions[i].y += deltas[i].y;
    }
  }

  return positions;
}

function spinePosition(index: number, total: number, center: THREE.Vector2, width: number, height: number) {
  const t = total <= 1 ? 0.5 : index / (total - 1);
  const verticalSpan = height * 0.78;
  return new THREE.Vector2(
    center.x + Math.sin(t * Math.PI) * width * 0.18 - width * 0.08,
    center.y + verticalSpan * 0.5 * (1 - 2 * t),
  );
}

function decorativePathPoints(
  entries: ResumeEntry[],
  center: THREE.Vector2,
  width: number,
  height: number,
) {
  const anchors = entries.map((_, index) => spinePosition(index, entries.length, center, width, height));
  const points: THREE.Vector2[] = [];
  if (anchors.length < 2) return points;

  for (let i = 0; i < anchors.length - 1; i++) {
    const p1 = anchors[i];
    const p2 = anchors[i + 1];
    const prev = anchors[Math.max(0, i - 1)];
    const next = anchors[Math.min(anchors.length - 1, i + 1)];
    const nextNext = anchors[Math.min(anchors.length - 1, i + 2)];
    const tangentIn = new THREE.Vector2().subVectors(next, prev).multiplyScalar(0.5);
    const tangentOut = new THREE.Vector2().subVectors(nextNext, p1).multiplyScalar(0.5);
    for (let sample = 0; sample < 24; sample++) {
      const t = sample / 24;
      const t2 = t * t;
      const t3 = t2 * t;
      const h00 = 2 * t3 - 3 * t2 + 1;
      const h10 = t3 - 2 * t2 + t;
      const h01 = -2 * t3 + 3 * t2;
      const h11 = t3 - t2;
      points.push(
        new THREE.Vector2(
          p1.x * h00 + tangentIn.x * h10 + p2.x * h01 + tangentOut.x * h11,
          p1.y * h00 + tangentIn.y * h10 + p2.y * h01 + tangentOut.y * h11,
        ),
      );
    }
  }
  points.push(anchors[anchors.length - 1].clone());
  return points;
}

type CanvasMapper = {
  pageToCanvas(x: number, y: number): { x: number; y: number };
  pageLengthToCanvas(length: number): number;
};

function createCanvasMapper(pageWidth: number, pageHeight: number, canvasWidth: number, canvasHeight: number): CanvasMapper {
  return {
    pageToCanvas(x, y) {
      return {
        x: ((x + pageWidth / 2) / pageWidth) * canvasWidth,
        y: ((pageHeight / 2 - y) / pageHeight) * canvasHeight,
      };
    },
    pageLengthToCanvas(length) {
      return (length / pageHeight) * canvasHeight;
    },
  };
}

function canvasSizeForPage(pageWidth: number, pageHeight: number) {
  const height = PAGE_CANVAS_HEIGHT;
  const width = Math.max(1, Math.round(height * (pageWidth / pageHeight)));
  return { width, height };
}

function drawDecorativeDashedPath(
  ctx: CanvasRenderingContext2D,
  entries: ResumeEntry[],
  center: THREE.Vector2,
  width: number,
  height: number,
  map: CanvasMapper,
) {
  const points = decorativePathPoints(entries, center, width, height);
  const dashLength = map.pageLengthToCanvas(height * 0.012);
  const gapLength = map.pageLengthToCanvas(height * 0.008);
  let drawRemaining = dashLength;
  let gapRemaining = 0;

  ctx.strokeStyle = accentCssColor(PATH_COLOR);
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = map.pageLengthToCanvas(height * 0.0025);
  ctx.lineCap = 'round';

  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1];
    const to = points[i];
    const delta = new THREE.Vector2().subVectors(to, from);
    const length = delta.length();
    if (length < 1e-6) continue;
    const unit = delta.multiplyScalar(1 / length);
    let walked = 0;
    while (walked < length) {
      const remaining = length - walked;
      if (gapRemaining > 0) {
        const step = Math.min(gapRemaining, remaining);
        walked += step;
        gapRemaining -= step;
        if (gapRemaining <= 1e-6) drawRemaining = dashLength;
      } else {
        const step = Math.min(drawRemaining, remaining);
        const start = from.clone().addScaledVector(unit, walked);
        const end = from.clone().addScaledVector(unit, walked + step);
        const p0 = map.pageToCanvas(start.x, start.y);
        const p1 = map.pageToCanvas(end.x, end.y);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
        walked += step;
        drawRemaining -= step;
        if (drawRemaining <= 1e-6) gapRemaining = gapLength;
      }
    }
  }
  ctx.globalAlpha = 1;
}

function drawStudentMortarboard(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  accentColor: number,
) {
  const unit = size * 0.22;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-2.5);
  ctx.strokeStyle = accentCssColor(accentColor);
  ctx.lineWidth = size * 0.012;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -unit * 0.55);
  ctx.lineTo(unit * 0.55, 0);
  ctx.lineTo(0, unit * 0.55);
  ctx.lineTo(-unit * 0.55, 0);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(unit * 0.55, 0);
  ctx.lineTo(unit * 0.53, unit * 0.55);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(unit * 0.53, unit * 0.63, unit * 0.07, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawWavyCirclePath(ctx: CanvasRenderingContext2D, entry: ResumeEntry, cx: number, cy: number, radius: number) {
  const waveCount = 34 * entry.importance * 2.2;
  const amplitude = radius * 0.28;
  const phase = deterministicPhase(entry);
  ctx.beginPath();
  for (let i = 0; i <= 120; i++) {
    const angle = (i / 120) * Math.PI * 2;
    const waveRadius = radius + Math.sin(angle * waveCount + phase) * amplitude;
    const x = cx + Math.cos(angle) * waveRadius;
    const y = cy + Math.sin(angle) * waveRadius;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function deterministicPhase(entry: ResumeEntry) {
  let hash = (entry.yearStart * 2654435761) >>> 0;
  const label = shortLabel(entry);
  for (let i = 0; i < label.length; i++) {
    hash = (hash * 33 + label.charCodeAt(i)) >>> 0;
  }
  return ((hash % 6283) / 6283) * Math.PI * 2;
}

function drawResumeCircle(
  ctx: CanvasRenderingContext2D,
  entry: ResumeEntry,
  position: THREE.Vector2,
  radius: number,
  accentColor: number,
  map: CanvasMapper,
) {
  const { x: cx, y: cy } = map.pageToCanvas(position.x, position.y);
  const drawRadius = map.pageLengthToCanvas(radius * 1.05);
  const spriteSize = drawRadius * 3.25;

  if (entry.company === 'Tangible Interaction') {
    ctx.fillStyle = '#f0eee8';
    ctx.beginPath();
    ctx.arc(cx, cy, drawRadius * 1.02, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = accentCssColor(accentColor);
  ctx.fillStyle = PAPER_WHITE;
  ctx.lineWidth = entry.importance < 0.5 ? drawRadius * 0.06 : drawRadius * 0.08;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (entry.type === 'art') {
    drawWavyCirclePath(ctx, entry, cx, cy, drawRadius);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy, drawRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (entry.type === 'study') {
    drawStudentMortarboard(ctx, cx, cy, spriteSize, accentColor);
  }
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawTextLabel(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  centerX: number,
  centerY: number,
  worldWidth: number,
  worldHeight: number,
  fontSize: number,
  align: CanvasTextAlign,
  accentColor: number,
  map: CanvasMapper,
) {
  const widthPx = map.pageLengthToCanvas(worldWidth);
  const heightPx = map.pageLengthToCanvas(worldHeight);
  const left = centerX - widthPx / 2;
  const top = centerY - heightPx / 2;
  /** Matches the 180px-per-world-unit scale used by the old per-label canvases. */
  const pixelsPerUnit = map.pageLengthToCanvas(1) / 180;

  ctx.fillStyle = 'rgba(247, 241, 231, 0.58)';
  roundedRect(ctx, left, top, widthPx, heightPx, Math.min(widthPx, heightPx) * 0.12);
  ctx.fill();

  ctx.fillStyle = accentCssColor(accentColor);
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  const textX =
    align === 'left' ? left + widthPx * 0.08 : align === 'right' ? left + widthPx * 0.92 : centerX;

  lines.forEach((line, index) => {
    ctx.font = `${(index === 0 ? fontSize : fontSize * 0.7) * pixelsPerUnit}px Georgia, serif`;
    ctx.globalAlpha = index === 0 ? 0.92 : 0.68;
    ctx.fillText(line, textX, top + heightPx * (0.36 + index * 0.31), widthPx * 0.84);
  });
  ctx.globalAlpha = 1;
}

function drawResumeEntry(
  ctx: CanvasRenderingContext2D,
  entry: ResumeEntry,
  position: THREE.Vector2,
  pageWidth: number,
  accentColor: number,
  map: CanvasMapper,
) {
  const radius = importanceToRadius(entry.importance);
  drawResumeCircle(ctx, entry, position, radius, accentColor, map);

  if (entry.importance >= 0.5) {
    const labelWidth = Math.min(pageWidth * 0.22, 0.78);
    const labelCenter = map.pageToCanvas(position.x, position.y - radius * 1.65 - 0.12);
    drawTextLabel(
      ctx,
      [shortLabel(entry), subtitle(entry)],
      labelCenter.x,
      labelCenter.y,
      labelWidth,
      0.18,
      18,
      'center',
      accentColor,
      map,
    );
    return;
  }

  const side = position.x > 0 ? -1 : 1;
  const angle = entry.calloutAngle ?? Math.atan2(-1.35, side * 4.65);
  const direction = new THREE.Vector2(Math.cos(angle), Math.sin(angle));
  const lineStart = position.clone().addScaledVector(direction, radius * 1.05);
  const lineEnd = position.clone().addScaledVector(direction, radius + 0.33);
  const p0 = map.pageToCanvas(lineStart.x, lineStart.y);
  const p1 = map.pageToCanvas(lineEnd.x, lineEnd.y);

  ctx.strokeStyle = accentCssColor(accentColor);
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = map.pageLengthToCanvas(0.004);
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.stroke();
  ctx.globalAlpha = 1;

  const labelCenter = map.pageToCanvas(lineEnd.x + side * 0.28, lineEnd.y);
  drawTextLabel(
    ctx,
    [shortLabel(entry), entry.years || entry.title],
    labelCenter.x,
    labelCenter.y,
    0.5,
    0.13,
    14,
    side > 0 ? 'left' : 'right',
    accentColor,
    map,
  );
}

function satellitePosition(orbit: SatelliteOrbit, orbitAngle: number) {
  const angle = orbitAngle * orbit.speedScale + orbit.phase;
  return new THREE.Vector2(
    orbit.parent.position.x + Math.cos(angle) * orbit.radius,
    orbit.parent.position.y + Math.sin(angle - 0.6) * orbit.radius * 0.34,
  );
}

function buildPageLayout(): PageLayout {
  const page = getPageDimensions();
  const contentWidth = page.width * 0.86;
  const contentHeight = page.height * 0.9;
  const center = new THREE.Vector2(
    page.width * RESUME_LAYOUT_CENTER.x,
    page.height * RESUME_LAYOUT_CENTER.y,
  );
  const chronological = chronologicalEntries();
  const mainEntries = stackEntries(chronological);
  const positions = layoutResumeParticlePositions(mainEntries, center, contentWidth, contentHeight);
  const mainRecords: ResumeRecord[] = [];
  const satelliteOrbits: SatelliteOrbit[] = [];

  let colorIndex = 0;
  mainEntries.forEach((entry, index) => {
    mainRecords.push({
      entry,
      position: positions[index],
      radius: importanceToRadius(entry.importance),
      accentColor: accentColorAt(colorIndex++),
    });
  });

  const satelliteGroups = new Map<string, ResumeEntry[]>();
  for (const entry of chronological) {
    const parent = findSatelliteParent(entry, chronological);
    if (!parent) continue;
    const parentName = satelliteParentName(entry);
    satelliteGroups.set(parentName, [...(satelliteGroups.get(parentName) ?? []), entry]);
  }

  for (const satellites of satelliteGroups.values()) {
    satellites.forEach((entry, index) => {
      const parent = findSatelliteParent(entry, chronological);
      const parentRecord = parent ? mainRecords.find((record) => record.entry === parent) : null;
      if (!parentRecord) return;

      const phase = (index / satellites.length) * Math.PI * 2;
      const radius = Math.max(parentRecord.radius * 2.3, contentHeight * 0.06);
      satelliteOrbits.push({
        entry,
        parent: parentRecord,
        phase,
        speedScale: 0.65 + (index % 3) * 0.24,
        radius,
        accentColor: accentColorAt(colorIndex++),
      });
    });
  }

  return {
    pageWidth: page.width,
    pageHeight: page.height,
    contentWidth,
    contentHeight,
    center,
    mainRecords,
    satelliteOrbits,
  };
}

function drawPageToCanvas(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  layout: PageLayout,
  backgroundImage: HTMLImageElement | null,
  orbitAngle: number,
) {
  const { pageWidth, pageHeight, contentWidth, contentHeight, center, mainRecords, satelliteOrbits } = layout;
  const map = createCanvasMapper(pageWidth, pageHeight, canvasWidth, canvasHeight);

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  if (backgroundImage) {
    ctx.drawImage(backgroundImage, 0, 0, canvasWidth, canvasHeight);
  } else {
    ctx.fillStyle = '#d4b896';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  drawDecorativeDashedPath(ctx, mainRecords.map((record) => record.entry), center, contentWidth, contentHeight, map);

  for (const record of mainRecords) {
    drawResumeEntry(ctx, record.entry, record.position, contentWidth, record.accentColor, map);
  }

  for (const orbit of satelliteOrbits) {
    const position = satellitePosition(orbit, orbitAngle);
    drawResumeEntry(ctx, orbit.entry, position, contentWidth, orbit.accentColor, map);
  }
}

export class PageAboutMe extends Page {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private pageTexture: THREE.CanvasTexture;
  private texturedFace: THREE.Mesh | null = null;
  private backgroundImage: HTMLImageElement | null = null;
  private layout: PageLayout | null = null;
  private satelliteOrbitAngle = 0;

  constructor() {
    super(0xd4b896, 'About Me');

    const page = getPageDimensions();
    const { width, height } = canvasSizeForPage(page.width, page.height);
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Unable to create About Me canvas context');
    this.ctx = ctx;
    this.pageTexture = configureBitmapTexture(new THREE.CanvasTexture(this.canvas));

    this.layout = buildPageLayout();
    this.rebuildDecorations();

    const image = new Image();
    image.onload = () => {
      this.backgroundImage = image;
      this.redrawCanvas();
      this.refreshTexturedFace();
    };
    image.onerror = (error) => {
      console.error('Failed to load About Me page background:', error);
    };
    image.src = backgroundUrl;
  }

  protected rebuildDecorations() {
    const page = getPageDimensions();
    const { width, height } = canvasSizeForPage(page.width, page.height);
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.pageTexture.dispose();
      this.pageTexture = configureBitmapTexture(new THREE.CanvasTexture(this.canvas));
    }

    this.layout = buildPageLayout();
    this.redrawCanvas();
    this.refreshTexturedFace();
  }

  update(delta: number) {
    if (this.readerVisible && !document.hidden && this.layout) {
      this.satelliteOrbitAngle += delta * SATELLITE_ORBIT_SPEED;
      this.redrawCanvas();
      this.pageTexture.needsUpdate = true;
    }
    super.update(delta);
  }

  dispose() {
    this.disposeTexturedFace();
    this.pageTexture.dispose();
    super.dispose();
  }

  private redrawCanvas() {
    if (!this.layout) return;
    drawPageToCanvas(
      this.ctx,
      this.canvas.width,
      this.canvas.height,
      this.layout,
      this.backgroundImage,
      this.satelliteOrbitAngle,
    );
  }

  private refreshTexturedFace() {
    this.disposeTexturedFace();
    this.texturedFace = createTexturedFrontFace(this.pageTexture, this.holes, this.counters);
    this.mesh.add(this.texturedFace);
  }

  private disposeTexturedFace() {
    if (!this.texturedFace) return;
    this.mesh.remove(this.texturedFace);
    this.texturedFace.geometry.dispose();
    const material = this.texturedFace.material as THREE.MeshBasicMaterial;
    material.map = null;
    material.dispose();
    this.texturedFace = null;
  }
}
