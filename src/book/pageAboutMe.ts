import * as THREE from 'three';
import {
  FRONT_FACE_Z,
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
  group: THREE.Group;
  position: THREE.Vector3;
  radius: number;
};

type SatelliteOrbit = {
  group: THREE.Group;
  parent: THREE.Group;
  phase: number;
  speedScale: number;
  radius: number;
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

/**
 * Resume ink sits just above the textured front face. Pages in the stack are
 * only 0.01 apart, so pushing decorations far in +Z makes them bleed through
 * pages in front (e.g. the cover).
 */
const RESUME_BASE_Z = FRONT_FACE_Z + 0.006;
const RESUME_LABEL_LIFT = 0.001;
const PAPER_WHITE = '#f7f1e7';
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
  center: THREE.Vector3,
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
  return new THREE.Vector3(x + lateral, y, center.z);
}

function layoutResumeParticlePositions(
  entries: ResumeEntry[],
  center: THREE.Vector3,
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

function spinePosition(index: number, total: number, center: THREE.Vector3, width: number, height: number) {
  const t = total <= 1 ? 0.5 : index / (total - 1);
  const verticalSpan = height * 0.78;
  return new THREE.Vector3(
    center.x + Math.sin(t * Math.PI) * width * 0.18 - width * 0.08,
    center.y + verticalSpan * 0.5 * (1 - 2 * t),
    center.z - 0.004,
  );
}

function hermitePoint(p1: THREE.Vector3, p2: THREE.Vector3, m1: THREE.Vector3, m2: THREE.Vector3, t: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  return new THREE.Vector3(
    p1.x * h00 + m1.x * h10 + p2.x * h01 + m2.x * h11,
    p1.y * h00 + m1.y * h10 + p2.y * h01 + m2.y * h11,
    p1.z * h00 + m1.z * h10 + p2.z * h01 + m2.z * h11,
  );
}

function decorativePathPoints(
  entries: ResumeEntry[],
  center: THREE.Vector3,
  width: number,
  height: number,
) {
  const anchors = entries.map((_, index) => spinePosition(index, entries.length, center, width, height));
  const points: THREE.Vector3[] = [];
  if (anchors.length < 2) return points;

  for (let i = 0; i < anchors.length - 1; i++) {
    const p1 = anchors[i];
    const p2 = anchors[i + 1];
    const prev = anchors[Math.max(0, i - 1)];
    const next = anchors[Math.min(anchors.length - 1, i + 1)];
    const nextNext = anchors[Math.min(anchors.length - 1, i + 2)];
    const tangentIn = new THREE.Vector3().subVectors(next, prev).multiplyScalar(0.5);
    const tangentOut = new THREE.Vector3().subVectors(nextNext, p1).multiplyScalar(0.5);
    for (let sample = 0; sample < 24; sample++) {
      points.push(hermitePoint(p1, p2, tangentIn, tangentOut, sample / 24));
    }
  }
  points.push(anchors[anchors.length - 1].clone());
  return points;
}

function createDecorativeDashedPath(entries: ResumeEntry[], center: THREE.Vector3, width: number, height: number) {
  const points = decorativePathPoints(entries, center, width, height);
  const vertices: number[] = [];
  const dashLength = height * 0.012;
  const gapLength = height * 0.008;
  let drawRemaining = dashLength;
  let gapRemaining = 0;

  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1].clone();
    const to = points[i];
    const delta = new THREE.Vector3().subVectors(to, from);
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
        vertices.push(start.x, start.y, start.z, end.x, end.y, end.z);
        walked += step;
        drawRemaining -= step;
        if (drawRemaining <= 1e-6) gapRemaining = gapLength;
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  const material = new THREE.LineBasicMaterial({
    color: PATH_COLOR,
    transparent: true,
    opacity: 0.35,
  });
  const line = new THREE.LineSegments(geometry, material);
  line.name = 'resumeDecorativeDashedPath';
  return line;
}

function createTextureCanvas(size: number) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Unable to create About Me canvas context');
  return { canvas, ctx };
}

function createCanvasTexture(canvas: HTMLCanvasElement) {
  const texture = configureBitmapTexture(new THREE.CanvasTexture(canvas));
  texture.needsUpdate = true;
  return texture;
}

function drawStudentMortarboard(ctx: CanvasRenderingContext2D, size: number, accentColor: number) {
  const unit = size * 0.22;
  const cx = size * 0.53;
  const cy = size * 0.34;
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

function drawWavyCircle(ctx: CanvasRenderingContext2D, entry: ResumeEntry, size: number) {
  const center = size / 2;
  const radius = size * 0.2;
  const waveCount = 34 * entry.importance * 2.2;
  const amplitude = size * 0.055;
  const phase = deterministicPhase(entry);
  ctx.beginPath();
  for (let i = 0; i <= 120; i++) {
    const angle = (i / 120) * Math.PI * 2;
    const waveRadius = radius + Math.sin(angle * waveCount + phase) * amplitude;
    const x = center + Math.cos(angle) * waveRadius;
    const y = center + Math.sin(angle) * waveRadius;
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

function createCirclePlane(entry: ResumeEntry, radius: number, accentColor: number) {
  const size = 256;
  const { canvas, ctx } = createTextureCanvas(size);
  ctx.clearRect(0, 0, size, size);

  if (entry.company === 'Tangible Interaction') {
    ctx.fillStyle = '#f0eee8';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.32, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = accentCssColor(accentColor);
  ctx.fillStyle = PAPER_WHITE;
  ctx.lineWidth = entry.importance < 0.5 ? size * 0.009 : size * 0.012;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (entry.type === 'art') {
    drawWavyCircle(ctx, entry, size);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.31, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (entry.type === 'study') drawStudentMortarboard(ctx, size, accentColor);

  const texture = createCanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    toneMapped: false,
    depthTest: true,
    depthWrite: false,
  });
  const geometry = new THREE.PlaneGeometry(radius * 3.4, radius * 3.4);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = `resumeCircle:${entry.company}`;
  return mesh;
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

function createTextPlane(
  lines: string[],
  width: number,
  height: number,
  fontSize: number,
  align: CanvasTextAlign,
  accentColor: number,
) {
  const scale = 180;
  const canvasWidth = Math.max(1, Math.round(width * scale));
  const canvasHeight = Math.max(1, Math.round(height * scale));
  const { canvas, ctx } = createTextureCanvas(Math.max(canvasWidth, canvasHeight));
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = 'rgba(247, 241, 231, 0.58)';
  roundedRect(ctx, 0, 0, canvasWidth, canvasHeight, Math.min(canvasWidth, canvasHeight) * 0.12);
  ctx.fill();
  ctx.fillStyle = accentCssColor(accentColor);
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  const x = align === 'left' ? canvasWidth * 0.08 : align === 'right' ? canvasWidth * 0.92 : canvasWidth / 2;
  lines.forEach((line, index) => {
    ctx.font = `${index === 0 ? fontSize : fontSize * 0.7}px Georgia, serif`;
    ctx.globalAlpha = index === 0 ? 0.92 : 0.68;
    ctx.fillText(line, x, canvasHeight * (0.36 + index * 0.31), canvasWidth * 0.84);
  });

  const texture = createCanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    toneMapped: false,
    depthTest: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  return mesh;
}

function createCalloutLine(from: THREE.Vector3, to: THREE.Vector3, accentColor: number) {
  const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
  const material = new THREE.LineBasicMaterial({
    color: accentColor,
    transparent: true,
    opacity: 0.5,
  });
  const line = new THREE.Line(geometry, material);
  line.name = 'resumeLowImportanceCallout';
  return line;
}

function createResumeEntryGroup(
  entry: ResumeEntry,
  position: THREE.Vector3,
  pageWidth: number,
  accentColor: number,
) {
  const radius = importanceToRadius(entry.importance);
  const group = new THREE.Group();
  group.name = `resumeEntry:${entry.company}`;
  group.position.copy(position);
  group.add(createCirclePlane(entry, radius, accentColor));

  if (entry.importance >= 0.5) {
    const labelWidth = Math.min(pageWidth * 0.22, 0.78);
    const label = createTextPlane(
      [shortLabel(entry), subtitle(entry)],
      labelWidth,
      0.18,
      18,
      'center',
      accentColor,
    );
    label.position.set(0, -radius * 1.65 - 0.12, RESUME_LABEL_LIFT);
    group.add(label);
  } else {
    const side = position.x > 0 ? -1 : 1;
    const angle = entry.calloutAngle ?? Math.atan2(-1.35, side * 4.65);
    const direction = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
    const lineStart = direction.clone().multiplyScalar(radius * 1.05);
    const lineEnd = direction.clone().multiplyScalar(radius + 0.33);
    group.add(createCalloutLine(lineStart, lineEnd, accentColor));
    const label = createTextPlane(
      [shortLabel(entry), entry.years || entry.title],
      0.5,
      0.13,
      14,
      side > 0 ? 'left' : 'right',
      accentColor,
    );
    label.position.copy(lineEnd).add(new THREE.Vector3(side * 0.28, 0, RESUME_LABEL_LIFT));
    group.add(label);
  }

  return { entry, group, position, radius };
}

function disposeObject(object: THREE.Object3D) {
  if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.LineSegments) {
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      material.map?.dispose();
      material.dispose();
    }
  }
}

export class PageAboutMe extends Page {
  private backgroundTexture: THREE.Texture | null = null;
  private texturedFace: THREE.Mesh | null = null;
  private resumeGroup: THREE.Group | null = null;
  private readonly satelliteOrbits: SatelliteOrbit[] = [];
  private satelliteOrbitAngle = 0;

  constructor() {
    super(0xd4b896, 'About Me');
    this.rebuildDecorations();

    new THREE.TextureLoader().load(
      backgroundUrl,
      (texture) => {
        this.backgroundTexture = texture;
        this.rebuildDecorations();
      },
      undefined,
      (error) => {
        console.error('Failed to load About Me page background:', error);
      },
    );
  }

  protected rebuildDecorations() {
    if (this.texturedFace) {
      this.mesh.remove(this.texturedFace);
      this.texturedFace.geometry.dispose();
      const material = this.texturedFace.material as THREE.MeshBasicMaterial;
      material.map = null;
      material.dispose();
      this.texturedFace = null;
    }

    this.clearResumeGroup();

    if (this.backgroundTexture) {
      this.texturedFace = createTexturedFrontFace(this.backgroundTexture, this.holes, this.counters);
      this.mesh.add(this.texturedFace);
    }

    this.resumeGroup = this.createResumeGroup();
    this.mesh.add(this.resumeGroup);
  }

  update(delta: number) {
    super.update(delta);
    this.satelliteOrbitAngle += delta * SATELLITE_ORBIT_SPEED;

    for (const orbit of this.satelliteOrbits) {
      const angle = this.satelliteOrbitAngle * orbit.speedScale + orbit.phase;
      orbit.group.position.set(
        orbit.parent.position.x + Math.cos(angle) * orbit.radius,
        orbit.parent.position.y + Math.sin(angle - 0.6) * orbit.radius * 0.34,
        orbit.parent.position.z,
      );
    }
  }

  dispose() {
    this.clearResumeGroup();
    super.dispose();
  }

  private clearResumeGroup() {
    this.satelliteOrbits.length = 0;
    if (!this.resumeGroup) return;
    this.mesh.remove(this.resumeGroup);
    this.resumeGroup.traverse(disposeObject);
    this.resumeGroup.clear();
    this.resumeGroup = null;
  }

  private createResumeGroup() {
    const page = getPageDimensions();
    const width = page.width * 0.86;
    const height = page.height * 0.9;
    const center = new THREE.Vector3(-page.width * 0.04, -page.height * 0.02, RESUME_BASE_Z);
    const chronological = chronologicalEntries();
    const mainEntries = stackEntries(chronological);
    const positions = layoutResumeParticlePositions(mainEntries, center, width, height);
    const group = new THREE.Group();
    const records: ResumeRecord[] = [];

    group.name = 'aboutMeResumeParticles';
    group.add(createDecorativeDashedPath(mainEntries, center, width, height));

    let colorIndex = 0;
    mainEntries.forEach((entry, index) => {
      const record = createResumeEntryGroup(entry, positions[index], width, accentColorAt(colorIndex++));
      records.push(record);
      group.add(record.group);
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
        const parentRecord = parent ? records.find((record) => record.entry === parent) : null;
        if (!parentRecord) return;

        const phase = (index / satellites.length) * Math.PI * 2;
        const radius = Math.max(parentRecord.radius * 2.3, height * 0.06);
        const initial = new THREE.Vector3(
          parentRecord.group.position.x + Math.cos(phase) * radius,
          parentRecord.group.position.y + Math.sin(phase * 1.3) * radius * 0.34,
          parentRecord.group.position.z,
        );
        const record = createResumeEntryGroup(entry, initial, width, accentColorAt(colorIndex++));
        const speedScale = 0.65 + (index % 3) * 0.24;
        group.add(record.group);
        this.satelliteOrbits.push({
          group: record.group,
          parent: parentRecord.group,
          phase,
          speedScale,
          radius,
        });
      });
    }

    return group;
  }
}
