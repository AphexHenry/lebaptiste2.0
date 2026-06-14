# Le Baptiste — 3D Hole Book

A personal website shaped like a book with cut-out holes revealing patterned pages behind. Built with Vite, TypeScript, and Three.js.

## Quick start

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## How it works

- **Cover page** — blue with dots, three holes labeled Art, Programming, About Me
- **Inner pages** — each section has its own color and pattern (stripes, squares, waves)
- **Stacked holes** — upper pages have cut-outs so each hole reveals the correct page beneath
- **Page-turn motor** — clicking a hole animates a 3D page turn to reveal that section

## Project structure

```
src/
  config/pages.ts       # Page definitions (colors, patterns, holes)
  types/book.ts         # Shared types and constants
  textures/             # Canvas texture factory + pattern drawers
  book/
    Book.ts             # Scene orchestrator
    BookPage.ts         # Single page mesh with spine pivot
    PageTurnMotor.ts    # Turn animation engine
    HoleInteraction.ts  # Raycast hole clicks
```

## Adding a new section

1. **Add a pattern** (optional) in `src/textures/patterns/` and register it in `PageTextureFactory.ts`.

2. **Add a page entry** in `src/config/pages.ts`:

```ts
{
  id: 'music',
  color: '#38B2AC',
  pattern: 'waves', // or a new pattern name
},
```

3. **Add a hole on the cover** pointing to the new page:

```ts
{
  id: 'music',
  label: 'Music',
  x: 0.5,       // horizontal position (0–1)
  y: 0.75,      // vertical position from bottom (0–1)
  radius: 0.1,  // hole size relative to page width
  targetPageId: 'music',
},
```

4. **Order matters** — pages are stacked back-to-front in array order. The cover stays first; new sections go before it in the stack (after existing inner pages).

Hole positions on inner pages are computed automatically: each page cuts holes for all sections deeper in the stack.

## Customization

| Constant | File | Purpose |
|----------|------|---------|
| `TEXTURE_WIDTH/HEIGHT` | `src/types/book.ts` | Texture resolution (lower = lighter GPU memory) |
| `TURN_ANGLE` | `src/types/book.ts` | How far pages rotate when turned |
| `PAGE_HEIGHT` | `src/book/Book.ts` | World-space page size |
| Turn duration | `PageTurnMotor.ts` | Animation speed (`DEFAULT_DURATION`) |

## Future extensions

- Reverse page turns / back navigation
- HTML content on revealed pages
- URL routing per section (`/art`, `/programming`, …)
- Page curl shaders

These can hook into `Book.navigateTo()` and `pages.ts` when needed.
