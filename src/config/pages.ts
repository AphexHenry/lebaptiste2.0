import type { PageConfig } from '../types/book';

export const pages: PageConfig[] = [
  {
    id: 'cover',
    color: '#2B6CB0',
    pattern: 'dots',
    holes: [
      {
        id: 'art',
        label: 'Art',
        x: 0.35,
        y: 0.55,
        radius: 0.12,
        targetPageId: 'art',
      },
      {
        id: 'programming',
        label: 'Programming',
        x: 0.65,
        y: 0.55,
        radius: 0.12,
        targetPageId: 'programming',
      },
      {
        id: 'about',
        label: 'About Me',
        x: 0.5,
        y: 0.32,
        radius: 0.12,
        targetPageId: 'about',
      },
    ],
  },
  {
    id: 'art',
    color: '#F6E05E',
    pattern: 'stripes',
  },
  {
    id: 'programming',
    color: '#805AD5',
    pattern: 'squares',
  },
  {
    id: 'about',
    color: '#ED8936',
    pattern: 'waves',
  },
];

export function getPageIndex(pageId: string): number {
  const index = pages.findIndex((p) => p.id === pageId);
  if (index === -1) throw new Error(`Unknown page id: ${pageId}`);
  return index;
}
