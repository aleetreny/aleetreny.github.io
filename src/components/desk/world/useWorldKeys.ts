// The keys the whole board listens for.
//
// Two of them, and neither is advertised:
//
//   42     typed anywhere that is not a text box
//   esc    puts down whatever you are holding, and turns the gravity back on
//
// The 42 listener is deliberately dumb: it keeps the last two printable keys
// and checks them. A sequence matcher would also fire on "1042", which is not
// what somebody typing the answer meant.

import { useEffect } from 'react';
import { useWorld } from '../../../lib/world/context';

function typing(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

export function useWorldKeys(): void {
  const { fireAnswer, hold, tool, zeroG, setZeroG } = useWorld();

  useEffect(() => {
    let last = '';
    let at = 0;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (tool) hold(null);
        else if (zeroG) setZeroG(false);
        return;
      }
      if (typing(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
      const now = performance.now();
      if (event.key === '2' && last === '4' && now - at < 1200) {
        fireAnswer();
        last = '';
        return;
      }
      last = event.key;
      at = now;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fireAnswer, hold, setZeroG, tool, zeroG]);
}
