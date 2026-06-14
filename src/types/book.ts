export type PatternType = 'dots' | 'stripes' | 'squares' | 'waves';

export interface HoleConfig {
  id: string;
  label: string;
  /** Normalized X position (0–1, left to right) */
  x: number;
  /** Normalized Y position (0–1, bottom to top) */
  y: number;
  /** Normalized radius relative to page width */
  radius: number;
  targetPageId: string;
}

export interface PageConfig {
  id: string;
  color: string;
  pattern: PatternType;
  holes?: HoleConfig[];
}

export const TEXTURE_WIDTH = 1024;
export const TEXTURE_HEIGHT = 1448;
export const PAGE_ASPECT = TEXTURE_WIDTH / TEXTURE_HEIGHT;
export const PAGE_STACK_OFFSET = 0.02;
export const TURN_ANGLE = -Math.PI * 0.95;
