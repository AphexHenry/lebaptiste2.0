import { Page } from './page';
import { Hole, TextCircleHole, TriangleHole } from './holes';
import { PageCover } from './pageCover';
import { PageArt } from './pageArt';
import { PageAboutMe } from './pageAboutMe';
import { PageProgramming, PROGRAMMING_TRIANGLE } from './pageProgramming';

/**
 * A portal is a hole in a page that leads to another page. The {@link hole}
 * defines where (and how) the hole is punched; {@link child} is the page
 * revealed through it (and the subtree you descend into when it is clicked).
 */
export interface Portal {
  readonly hole: Hole;
  readonly child: PageNode;
}

/**
 * A node in the book tree: a single page plus the portals leading deeper.
 *
 * The book is laid out as a linear stack, but navigation is a tree. Holes that
 * make the stack "see-through" are derived automatically from this structure
 * (see {@link Book}), so a node only has to declare where its own holes lead.
 */
export interface PageNode {
  readonly page: Page;
  readonly portals: Portal[];
}

export function node(page: Page, portals: Portal[] = []): PageNode {
  return { page, portals };
}

export function portal(hole: Hole, child: PageNode): Portal {
  return { hole, child };
}

/** Centre/radius of the circular portal that reveals the Art page. */
const ART_CIRCLE = { cx: -0.9, cy: -0.8, radius: 0.55 };

/** Centre/radius of the circular portal that reveals the About Me page. */
const ABOUT_CIRCLE = { cx: 0.9, cy: 0.3, radius: 0.55 };

/** Builds the page tree for the book. Add nested portals to grow it. */
export function createBookTree(): PageNode {
  return node(new PageCover(), [
    portal(
      new TextCircleHole('Art', { ...ART_CIRCLE, fontSize: 0.22, gap: 0.1 }),
      node(new PageArt()),
    ),
    portal(
      new TextCircleHole('About Me', { ...ABOUT_CIRCLE, fontSize: 0.18, gap: 0.1, arcSpan: Math.PI * 0.55 }),
      node(new PageAboutMe()),
    ),
    portal(
      new TriangleHole(
        PROGRAMMING_TRIANGLE.cx,
        PROGRAMMING_TRIANGLE.cy,
        PROGRAMMING_TRIANGLE.size,
        PROGRAMMING_TRIANGLE.rotation,
      ),
      node(new PageProgramming()),
    ),
  ]);
}
