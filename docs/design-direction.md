# Visual direction: the working board

## Goal

Keep the memorable idea of a pinboard without looking like a childish collection
of sticky notes. The identity is a living working board: dossiers, technical
sheets, coordinates, stamps and study materials. A contrast of ink, bone, rust
and signal amber replaces pastels; edges, cuts and hard shadows replace capsules
and soft corners.

The public interface and `?owner=1` are two states of the same place. The public
explores the board; the owner works inside it.

## Principles, as implemented

1. **Grown-up hierarchy.** A high-contrast display face for headlines and a
   monospace for board data.
2. **Less rounding.** Straight surfaces, visible borders and offset shadows.
   Corner radius is a theme setting and defaults to zero.
3. **Its own palette.** Ink, bone paper, rust and signal amber; no pastel cards.
4. **A board with a system.** A finite slate on a wall, a texture pattern, corner
   studs and a fixed jump index turn an infinite canvas into a navigable place.
5. **Asymmetric composition.** Cards distributed across columns with small
   rotations and controlled density.
6. **Depth over slogans.** Every drawer row can carry a period, a place and a
   short signal, and opens a full dossier with evidence.
7. **Coherent expansion.** A dossier is the same material at full size: a
   registry header, numbered blocks, the same paper.
8. **An integrated editor.** Login, inventory, panels, blocks, versions and
   confirmations share the texture, type, palette and geometry of the portfolio.
9. **Functional motion.** Pan, zoom, pinch, keyboard, the guided tour and section
   focus from the index; the animation is navigation, not decoration.
10. **Visible accessibility.** A high-contrast amber focus ring, dialogs with
    `aria-modal`, `Escape` everywhere, alternatives to drag and drop, and a real
    reduced-motion path.
11. **Minimal dependencies.** The wall, the slate, the grain, the studs and the
    dust flash are all CSS gradients. No local image and no remote font is
    required for the board to work.

## Content and privacy

The catalogue was derived from a public LinkedIn profile and the public
repositories of `aleetreny`. Private repositories are neither described nor
linked. No private Notion content was copied. Every public claim must keep a
verifiable public source or be reviewed explicitly by the owner.

## Rules for extending the system

- a new list needs a drawer card, a board position and a stable group id;
- a featured entry should offer context or evidence, not just a list of
  technologies;
- do not introduce diffuse shadows, bright gradients, large radii or capsules
  unless a function justifies it;
- the editor must gain any new metadata the frontend makes visible;
- always check the whole canvas, an expanded dossier and `?owner=1` on both
  desktop and mobile.
