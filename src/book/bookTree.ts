import { Page } from './page';
import { HoleFactory, circleHole } from './holes';
import { PageCover } from './pageCover';
import { PageArt } from './pageArt';
import { PageAboutMe } from './pageAboutMe';
import { PageProgramming, programmingTrianglePath } from './pageProgramming';

/**
 * A portal is a hole in a page that leads to another page. The {@link shape}
 * defines where the hole is punched; {@link child} is the page revealed through
 * it (and the subtree you descend into when the hole is clicked).
 */
export interface Portal {
  readonly shape: HoleFactory;
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

export function portal(shape: HoleFactory, child: PageNode): Portal {
  return { shape, child };
}

/** Builds the page tree for the book. Add nested portals to grow it. */
export function createBookTree(): PageNode {
  return node(new PageCover(), [
    portal(circleHole(-0.9, -0.8, 0.55), node(new PageArt())),
    portal(circleHole(0.9, 0.3, 0.55), node(new PageAboutMe())),
    portal(() => programmingTrianglePath(), node(new PageProgramming())),
  ]);
}
