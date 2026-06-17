import * as THREE from 'three';
import { scaleHoleCoord, scaleHoleSize } from './page';
import { getTextFont } from './font';

/**
 * The geometry a {@link Hole} contributes to a page.
 *
 * - `paths` are see-through cutouts punched straight through the page.
 * - `counters` are solid islands filled back in *inside* those cutouts, so the
 *   insides of letters such as A/o/B survive instead of falling out.
 *
 * Keeping both together lets arbitrarily complex holes (text, composites…) flow
 * through the book layout as a single value.
 */
export interface HoleGeometry {
  paths: THREE.Path[];
  counters: THREE.Shape[];
}

export function emptyHoleGeometry(): HoleGeometry {
  return { paths: [], counters: [] };
}

/** Merges several hole geometries into one. */
export function mergeHoleGeometry(parts: HoleGeometry[]): HoleGeometry {
  const out = emptyHoleGeometry();
  for (const part of parts) {
    out.paths.push(...part.paths);
    out.counters.push(...part.counters);
  }
  return out;
}

/**
 * A hole in a page, modelled as an object so holes can be collected in arrays,
 * composed together, and grown into richer shapes (text rings, etc.).
 *
 * {@link build} is re-evaluated every time a page rebuilds its geometry, so a
 * hole always tracks the current viewport-dependent page scale. Sharing one
 * instance across every page that must render a portal guarantees the cutouts
 * line up and you can see straight through the stack.
 */
export abstract class Hole {
  abstract build(): HoleGeometry;
}

/** Bezier sampling per glyph contour; higher is smoother but heavier. */
const GLYPH_CURVE_DIVISIONS = 6;

type Transform = (p: THREE.Vector2) => THREE.Vector2;

function contourToPath(points: THREE.Vector2[], transform: Transform): THREE.Path {
  const path = new THREE.Path();
  points.forEach((p, i) => {
    const t = transform(p);
    i === 0 ? path.moveTo(t.x, t.y) : path.lineTo(t.x, t.y);
  });
  path.closePath();
  return path;
}

function contourToShape(points: THREE.Vector2[], transform: Transform): THREE.Shape {
  const shape = new THREE.Shape();
  points.forEach((p, i) => {
    const t = transform(p);
    i === 0 ? shape.moveTo(t.x, t.y) : shape.lineTo(t.x, t.y);
  });
  shape.closePath();
  return shape;
}

type Glyph = {
  /** Outer outline of the glyph, punched as a see-through hole. */
  outline: THREE.Vector2[];
  /** Inner contours (letter counters), filled back in. */
  counters: THREE.Vector2[][];
  /** Horizontal centre of the glyph along the baseline. */
  centerX: number;
};

/**
 * Lays `text` out along a baseline starting at x = 0 and returns one entry per
 * glyph, plus the total advance width so callers can re-place the glyphs.
 */
function layoutGlyphs(font: any, text: string, size: number): { glyphs: Glyph[]; width: number } {
  const shapes = font.generateShapes(text, size) as THREE.Shape[];
  let width = 0;
  const glyphs = shapes.map((glyph) => {
    const { shape, holes } = glyph.extractPoints(GLYPH_CURVE_DIVISIONS);
    let minX = Infinity;
    let maxX = -Infinity;
    for (const p of shape) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
    }
    width = Math.max(width, maxX);
    return { outline: shape, counters: holes, centerX: (minX + maxX) / 2 };
  });
  return { glyphs, width };
}

export class CircleHole extends Hole {
  constructor(
    private readonly cx: number,
    private readonly cy: number,
    private readonly radius: number,
  ) {
    super();
  }

  build(): HoleGeometry {
    const [x, y] = scaleHoleCoord(this.cx, this.cy);
    const path = new THREE.Path();
    path.absarc(x, y, scaleHoleSize(this.radius), 0, Math.PI * 2, true);
    return { paths: [path], counters: [] };
  }
}

/** Equilateral triangle, apex pointing up. */
export class TriangleHole extends Hole {
  constructor(
    private readonly cx: number,
    private readonly cy: number,
    private readonly size: number,
  ) {
    super();
  }

  build(): HoleGeometry {
    const [x, y] = scaleHoleCoord(this.cx, this.cy);
    const scaled = scaleHoleSize(this.size);
    const height = (scaled * Math.sqrt(3)) / 2;
    const path = new THREE.Path();
    path.moveTo(x, y + height / 2);
    path.lineTo(x - scaled / 2, y - height / 2);
    path.lineTo(x + scaled / 2, y - height / 2);
    path.closePath();
    return { paths: [path], counters: [] };
  }
}

export class SquareHole extends Hole {
  constructor(
    private readonly cx: number,
    private readonly cy: number,
    private readonly size: number,
  ) {
    super();
  }

  build(): HoleGeometry {
    const [x, y] = scaleHoleCoord(this.cx, this.cy);
    const half = scaleHoleSize(this.size) / 2;
    const path = new THREE.Path();
    path.moveTo(x - half, y - half);
    path.lineTo(x - half, y + half);
    path.lineTo(x + half, y + half);
    path.lineTo(x + half, y - half);
    path.closePath();
    return { paths: [path], counters: [] };
  }
}

/**
 * One line of text punched through the page along a horizontal baseline.
 *
 * The baseline and cap height are resolved lazily through `layout`, evaluated at
 * build time, so the text follows the current page size. Returned coordinates
 * are page-local world units.
 */
export class TextHole extends Hole {
  constructor(
    private readonly text: string,
    private readonly layout: () => { size: number; baselineX: number; baselineY: number },
  ) {
    super();
  }

  build(): HoleGeometry {
    const font = getTextFont();
    if (!font) return emptyHoleGeometry();

    const { size, baselineX, baselineY } = this.layout();
    const { glyphs } = layoutGlyphs(font, this.text, size);
    const out = emptyHoleGeometry();
    const move: Transform = (p) => new THREE.Vector2(p.x + baselineX, p.y + baselineY);

    for (const glyph of glyphs) {
      out.paths.push(contourToPath(glyph.outline, move));
      for (const counter of glyph.counters) {
        out.counters.push(contourToShape(counter, move));
      }
    }
    return out;
  }
}

export interface CircularTextOptions {
  /** Circle centre and radius, in reference (hole) coordinates. */
  cx: number;
  cy: number;
  radius: number;
  /** Cap height of the lettering, in reference units. */
  fontSize: number;
  /** Gap between the circle edge and the text baseline, in reference units. */
  gap?: number;
  /** Angle (radians) the middle of the text sits at; defaults to the top. */
  centerAngle?: number;
  /** Total angle (radians) the text spans around the circle. */
  arcSpan?: number;
}

/**
 * Text bent around the outside of a circle, reading left-to-right across the arc
 * centred on {@link CircularTextOptions.centerAngle}. Pairs naturally with a
 * {@link CircleHole} of the same centre/radius inside a {@link CompositeHole}.
 */
export class CircularTextHole extends Hole {
  private readonly gap: number;
  private readonly centerAngle: number;
  private readonly arcSpan: number;

  constructor(
    private readonly text: string,
    private readonly options: CircularTextOptions,
  ) {
    super();
    this.gap = options.gap ?? 0.12;
    this.centerAngle = options.centerAngle ?? Math.PI / 2;
    this.arcSpan = options.arcSpan ?? Math.PI * 0.6;
  }

  build(): HoleGeometry {
    const font = getTextFont();
    if (!font) return emptyHoleGeometry();

    const [x, y] = scaleHoleCoord(this.options.cx, this.options.cy);
    const baselineR = scaleHoleSize(this.options.radius) + scaleHoleSize(this.gap);
    const fontSize = scaleHoleSize(this.options.fontSize);

    const { glyphs, width } = layoutGlyphs(font, this.text, fontSize);
    const out = emptyHoleGeometry();

    for (const glyph of glyphs) {
      const fraction = width > 0 ? glyph.centerX / width : 0.5;
      const theta = this.centerAngle + (0.5 - fraction) * this.arcSpan;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      const baseX = x + baselineR * cos;
      const baseY = y + baselineR * sin;

      // Local +x runs along the reading direction (tangent), local +y points
      // radially outward, so letters stand upright on the arc without mirroring.
      const place: Transform = (p) => {
        const lx = p.x - glyph.centerX;
        const ly = p.y;
        return new THREE.Vector2(
          baseX + lx * sin + ly * cos,
          baseY - lx * cos + ly * sin,
        );
      };

      out.paths.push(contourToPath(glyph.outline, place));
      for (const counter of glyph.counters) {
        out.counters.push(contourToShape(counter, place));
      }
    }
    return out;
  }
}

/** Combines several holes into one, e.g. a circle wrapped in ring text. */
export class CompositeHole extends Hole {
  private readonly holes: Hole[];

  constructor(...holes: Hole[]) {
    super();
    this.holes = holes;
  }

  build(): HoleGeometry {
    return mergeHoleGeometry(this.holes.map((hole) => hole.build()));
  }
}
