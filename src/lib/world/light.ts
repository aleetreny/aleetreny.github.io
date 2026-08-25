// Where the light in the room is.
//
// Two things on this desk care about a light source, and they must not
// disagree about where it is: the plant on the shelf leans toward it, and the
// chloroplasts on the microscope slide either gather under it or run from it,
// depending on how hard it is shining. So there is one light, written here and
// read from there.
//
// By default the light *is* the pointer, at an ordinary indoor strength.
// Anything that hands the visitor something brighter — the slide's own lamp
// dial today, a torch the board could grow tomorrow — raises the strength
// while it is held and puts it back when it is let go. That is the whole seam:
// a second object wanting to be lit reads `light()`, and a second object
// wanting to *do* the lighting calls `shine()`.

/** An ordinary room. Enough for a plant to find, not enough to hurt anything. */
export const AMBIENT = 0.34;

type Light = {
  /** Client coordinates: the light is on the screen, not on the board. */
  x: number;
  y: number;
  /** When it last moved. Zero means the pointer has never been seen, and
   *  nothing should assume it is lit. */
  at: number;
  strength: number;
};

const state: Light = { x: 0, y: 0, at: 0, strength: AMBIENT };
let holders = 0;
let listening = false;

function follow(event: PointerEvent) {
  state.x = event.clientX;
  state.y = event.clientY;
  state.at = performance.now();
}

/** Start watching the pointer, and stop again when the last reader goes. The
 *  listener costs three assignments a move, but a board with nothing on it
 *  that cares about light should not be running one at all. */
export function watchLight(): () => void {
  holders += 1;
  if (!listening) {
    window.addEventListener('pointermove', follow, { passive: true });
    listening = true;
  }
  return () => {
    holders -= 1;
    if (holders <= 0 && listening) {
      window.removeEventListener('pointermove', follow);
      listening = false;
      holders = 0;
    }
  };
}

/** The light, right now. Read it in a frame; never in a render. */
export function light(): Readonly<Light> {
  return state;
}

/** Turn the light up or down. Whoever raises it owns putting it back. */
export function shine(strength: number): void {
  state.strength = Math.max(0, Math.min(1, strength));
}
