import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
// Swap this import for any other typeface.json to change the punched-text font.
// Three.js ships several under `three/examples/fonts`, and the `facetype.js`
// converter (https://gero3.github.io/facetype.js/) turns any .ttf/.otf into it.
import titleFontUrl from 'three/examples/fonts/helvetiker_bold.typeface.json?url';

/**
 * Shared typeface used by every text-based {@link Hole}.
 *
 * Loading the font is asynchronous, but holes are built synchronously whenever a
 * page rebuilds its geometry. Holes therefore call {@link getTextFont} and emit
 * nothing while it is still null; interested parties register via
 * {@link onFontReady} to re-run their layout once glyphs become available.
 */
let font: any = null;
const readyCallbacks: Array<() => void> = [];

new FontLoader().load(titleFontUrl, (loaded: any) => {
  font = loaded;
  for (const cb of readyCallbacks) cb();
  readyCallbacks.length = 0;
});

/** The loaded typeface, or null until the async load finishes. */
export function getTextFont(): any {
  return font;
}

/** Runs `cb` once the font is ready (immediately if it already is). */
export function onFontReady(cb: () => void): void {
  if (font) cb();
  else readyCallbacks.push(cb);
}
