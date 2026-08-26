// What the blacklight shows, apart from the people.
//
// Two things: a veil that takes the colour out of the board and leaves it in
// the dark, and the marks somebody left on the slate that ordinary light does
// not pick up — bays, dimensions, and the scaffolding round whatever is broken.
//
// The city, the weather and the crew are not here. They are painted on the
// canvas in UvCrew, because anything that lives inside the board lives inside
// the board's compositing layer, and every animated object on the board
// invalidates that layer — so two thousand nodes of city were being rasterised
// again sixty times a second for a picture that had not changed.
//
// The only thing here that touches the DOM after the first frame is the small,
// slow job of leaning the broken cards over, and that runs twice a second.

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useWorld } from '../../../lib/world/context';
import { useFrame } from '../../../lib/world/frame';
import { OBJECT_SPECS } from '../../../lib/world/kinds';
import { mulberry32 } from '../../../lib/world/rng';
import { BAD } from '../../../lib/world/crew';
import type { UiText } from '../../../lib/ui-text';
import { damageOf } from './UvCrew';
import { useUiText } from '../ui-text-context';

type Box = { id: string; x: number; y: number; w: number; h: number; damage: number };

export function UvWorld({ boardSize }: { boardSize: { width: number; height: number } }) {
  const t = useUiText();
  const { objects, placeRef, swallowed } = useWorld();
  const [decor, setDecor] = useState<ReactNode[]>([]);
  const leaning = useRef<HTMLElement[]>([]);
  const due = useRef(0);

  /** Every box on the board worth drawing over: objects where they are now,
   *  and the cards, whose geometry belongs to the board rather than the world
   *  and so is read off the elements. */
  const boxes = useCallback((): Box[] => {
    const found: Box[] = [];
    for (const object of objects) {
      if (!object.visible || swallowed.includes(object.id)) continue;
      const at = placeRef.current.get(object.id);
      if (!at) continue;
      const spec = OBJECT_SPECS[object.id];
      found.push({
        id: object.id,
        x: at.x, y: at.y,
        w: spec.w * at.scale, h: spec.h * at.scale,
        damage: damageOf(object.id),
      });
    }
    for (const node of document.querySelectorAll<HTMLElement>('.desk__board [data-card]')) {
      const id = node.dataset.card ?? '';
      if (!id || node.offsetWidth < 40) continue;
      found.push({
        id: `card:${id}`,
        x: node.offsetLeft, y: node.offsetTop,
        w: node.offsetWidth, h: node.offsetHeight,
        damage: damageOf(id),
      });
    }
    return found;
  }, [objects, placeRef, swallowed]);

  // One frame late, so the cards have been laid out and their boxes are real.
  useEffect(() => {
    const id = requestAnimationFrame(() => setDecor(chalk(boardSize, boxes(), t)));
    return () => cancelAnimationFrame(id);
  }, [boardSize, boxes, t]);

  /** The worst-damaged cards are leaning, because somebody has them jacked up.
   *  `rotate` is its own property, so this composes with the rotation the board
   *  already gave the card instead of fighting it — and it is re-applied on a
   *  slow clock so a card that re-renders does not straighten up. */
  useEffect(() => {
    const cards = [...document.querySelectorAll<HTMLElement>('.desk__board [data-card]')]
      .filter((node) => damageOf(node.dataset.card ?? '') > BAD);
    leaning.current = cards;
    return () => {
      for (const node of cards) {
        node.style.removeProperty('--uv-tilt');
        node.style.removeProperty('--uv-shift');
        node.classList.remove('is-uv-propped');
      }
    };
  }, []);

  useFrame((dt) => {
    due.current -= dt;
    if (due.current > 0) return;
    due.current = 500;
    for (const node of leaning.current) {
      const seed = damageOf(node.dataset.card ?? '');
      node.style.setProperty('--uv-tilt', `${((seed - 0.8) * 14).toFixed(2)}deg`);
      node.style.setProperty('--uv-shift', `${((seed - 0.8) * 22).toFixed(1)}px`);
      node.classList.add('is-uv-propped');
    }
  }, true);

  return (
    <div className="uvworld" aria-hidden="true">
      <div className="uvveil" />

      <svg
        className="uvmarks"
        viewBox={`0 0 ${boardSize.width} ${boardSize.height}`}
        width={boardSize.width}
        height={boardSize.height}
      >
        {decor}
      </svg>

    </div>
  );
}

/** What the light finds on the slate: the crew's own marks, laid out from where
 *  things actually are. Written once, never animated. */
function chalk(size: { width: number; height: number }, boxes: Box[], t: UiText): ReactNode[] {
  const r = mulberry32(7801);
  const bits: ReactNode[] = [];

  bits.push(<path key="frame" className="uvmarks__frame" d={`M40 40H${size.width - 40}V${size.height - 40}H40Z`} />);
  const ribs: string[] = [];
  for (let i = 1; i < 6; i += 1) ribs.push(`M${Math.round((size.width / 6) * i)} 40V${size.height - 40}`);
  for (let i = 1; i < 4; i += 1) ribs.push(`M40 ${Math.round((size.height / 4) * i)}H${size.width - 40}`);
  bits.push(<path key="ribs" className="uvmarks__rib" d={ribs.join('')} />);

  const shuffled = [...boxes].sort(() => r() - 0.5);
  for (let i = 0; i < shuffled.length; i += 1) {
    const a = shuffled[i];
    const b = shuffled[(i + 1) % shuffled.length];
    const ax = a.x + a.w / 2;
    const ay = a.y + a.h + 12;
    const bx = b.x + b.w / 2;
    const by = b.y + b.h + 12;
    if (b !== a && Math.hypot(bx - ax, by - ay) < 620 && r() < 0.5) {
      bits.push(
        <g key={`dim${a.id}`} className="uvmarks__dim">
          <path d={`M${ax.toFixed(0)} ${ay.toFixed(0)}L${bx.toFixed(0)} ${by.toFixed(0)}M${ax.toFixed(0)} ${(ay - 5).toFixed(0)}v10M${bx.toFixed(0)} ${(by - 5).toFixed(0)}v10`} />
          <text x={((ax + bx) / 2).toFixed(0)} y={((ay + by) / 2 - 4).toFixed(0)}>
            {Math.round(Math.hypot(bx - ax, by - ay))}
          </text>
        </g>,
      );
    }
    if (r() < 0.22) {
      bits.push(<circle key={`mug${a.id}`} className="uvmarks__ring" cx={(a.x + a.w * (0.2 + r() * 0.6)).toFixed(0)} cy={(a.y + a.h + 26 + r() * 30).toFixed(0)} r={(9 + r() * 4).toFixed(1)} />);
    }
  }

  // A numbered bay under everything, with what stands in it written under that.
  for (let i = 0; i < boxes.length; i += 1) {
    const box = boxes[i];
    const cx = box.x + box.w / 2;
    const base = box.y + box.h + 16;
    const name = box.id.startsWith('card:') ? '' : box.id.toUpperCase();
    bits.push(
      <text key={`bay${box.id}`} className="uvmarks__bay" x={cx.toFixed(0)} y={base.toFixed(0)}>
        {t('world.uv.bay', { n: String(i + 1).padStart(2, '0') })}
      </text>,
    );
    if (name) {
      bits.push(
        <text key={`st${box.id}`} className="uvmarks__stencil" x={cx.toFixed(0)} y={(base + 13).toFixed(0)}>{name}</text>,
      );
    }

    // The broken ones get taken apart and put back together.
    if (box.damage > BAD) {
      const inset = 6;
      bits.push(
        <g key={`fix${box.id}`} className="uvmarks__works">
          {/* A crack across it. */}
          <path
            className="uvmarks__crack"
            d={`M${(box.x + box.w * 0.1).toFixed(0)} ${(box.y + box.h * 0.32).toFixed(0)}`
              + `l${(box.w * 0.22).toFixed(0)} ${(box.h * 0.12).toFixed(0)}`
              + `l${(box.w * -0.08).toFixed(0)} ${(box.h * 0.2).toFixed(0)}`
              + `l${(box.w * 0.3).toFixed(0)} ${(box.h * 0.1).toFixed(0)}`
              + `l${(box.w * -0.06).toFixed(0)} ${(box.h * 0.16).toFixed(0)}`}
          />
          {/* Scaffolding round it, and a prop under the low corner. */}
          <path
            className="uvmarks__scaffold"
            d={`M${box.x - inset} ${box.y - inset}h${box.w + inset * 2}v${box.h + inset * 2}h${-(box.w + inset * 2)}Z`
              + `M${box.x - inset} ${(box.y + box.h * 0.34).toFixed(0)}h${box.w + inset * 2}`
              + `M${box.x - inset} ${(box.y + box.h * 0.68).toFixed(0)}h${box.w + inset * 2}`
              + `M${(box.x + box.w * 0.34).toFixed(0)} ${box.y - inset}v${box.h + inset * 2}`
              + `M${(box.x + box.w * 0.7).toFixed(0)} ${box.y - inset}v${box.h + inset * 2}`}
          />
          <path
            className="uvmarks__prop"
            d={`M${box.x - inset} ${box.y + box.h + inset}l-16 22m16-22l4 24`}
          />
          {/* And the tape that says do not lean on it. */}
          <path className="uvmarks__tape" d={`M${box.x - 14} ${(box.y + box.h * 0.5).toFixed(0)}h${box.w + 28}`} />
          <text className="uvmarks__warn" x={cx.toFixed(0)} y={(box.y - inset - 6).toFixed(0)}>{t('world.uv.works')}</text>
        </g>,
      );
    }
  }

  bits.push(<text key="sign" className="uvmarks__sign" x={size.width - 96} y={size.height - 62}>A·T</text>);
  bits.push(<text key="since" className="uvmarks__since" x={size.width - 96} y={size.height - 50}>{t('world.uv.maint')}</text>);
  return bits;
}
