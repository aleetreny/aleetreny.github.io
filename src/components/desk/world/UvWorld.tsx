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
import {
  CARD_GAGS, PHOTO_GAGS,
  type CardGag, type PhotoGag,
} from '../../../lib/world/graffiti';
import type { UiText } from '../../../lib/ui-text';
import { damageOf } from './UvCrew';
import { useUiText } from '../ui-text-context';

type Box = { id: string; x: number; y: number; w: number; h: number; damage: number; rot: number };
type PhotoBox = {
  id: string;
  x: number; y: number; w: number; h: number;
  rot: number;
  cardCx: number; cardCy: number;
};

function numberAttr(value: string | undefined): number {
  const parsed = Number.parseFloat(value ?? '0');
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Position inside an untransformed card. The card's small authored rotation is
 * applied to the finished doodle group, so a moustache rotates with its photo. */
function offsetInside(node: HTMLElement, ancestor: HTMLElement): { x: number; y: number } {
  let x = 0;
  let y = 0;
  let current: HTMLElement | null = node;
  while (current && current !== ancestor) {
    x += current.offsetLeft;
    y += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

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
        rot: at.rot,
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
        rot: numberAttr(node.dataset.rot),
      });
    }
    return found;
  }, [objects, placeRef, swallowed]);

  const photos = useCallback((): PhotoBox[] => {
    const found: PhotoBox[] = [];
    for (const card of document.querySelectorAll<HTMLElement>('.desk__board .polaroid[data-card]')) {
      const slot = card.querySelector<HTMLElement>('.slot--filled');
      if (!slot || slot.offsetWidth < 20 || slot.offsetHeight < 20) continue;
      const inner = offsetInside(slot, card);
      found.push({
        id: card.dataset.card ?? String(found.length),
        x: card.offsetLeft + inner.x,
        y: card.offsetTop + inner.y,
        w: slot.offsetWidth,
        h: slot.offsetHeight,
        rot: numberAttr(card.dataset.rot),
        cardCx: card.offsetLeft + card.offsetWidth / 2,
        cardCy: card.offsetTop + card.offsetHeight / 2,
      });
    }
    return found;
  }, []);

  // One frame late, so the cards have been laid out and their boxes are real.
  useEffect(() => {
    const id = requestAnimationFrame(() => setDecor(chalk(boardSize, boxes(), photos(), t)));
    return () => cancelAnimationFrame(id);
  }, [boardSize, boxes, photos, t]);

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
function chalk(size: { width: number; height: number }, boxes: Box[], photos: PhotoBox[], t: UiText): ReactNode[] {
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
  bits.push(...graffiti(boxes, photos, t));
  return bits;
}

/** Twenty-four little acts of editorial vandalism. They are deliberately
 * ordinary SVG geometry: crisp at any zoom, one paint, and no work after the
 * blacklight has switched on. */
function graffiti(boxes: Box[], photos: PhotoBox[], t: UiText): ReactNode[] {
  const bits: ReactNode[] = [];
  for (const gag of PHOTO_GAGS) {
    const photo = photos[gag.photo];
    if (photo) bits.push(photoGraffiti(gag, photo));
  }

  const cards = new Map<string, Box>();
  for (const box of boxes) {
    if (box.id.startsWith('card:')) cards.set(box.id.slice(5), box);
  }
  for (const gag of CARD_GAGS) {
    const card = cards.get(gag.card);
    if (card) bits.push(cardGraffiti(gag, card, t));
  }
  return bits;
}

function photoGraffiti(gag: PhotoGag, photo: PhotoBox): ReactNode {
  const x = photo.x + photo.w * gag.x;
  const y = photo.y + photo.h * gag.y;
  const scale = (Math.min(photo.w, photo.h) / 150) * gag.scale;
  const transform = `rotate(${photo.rot.toFixed(2)} ${photo.cardCx.toFixed(1)} ${photo.cardCy.toFixed(1)})`
    + ` translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${gag.rotate ?? 0}) scale(${scale.toFixed(3)})`;

  let drawing: ReactNode;
  switch (gag.kind) {
    case 'cross-moustache':
      drawing = (
        <>
          <path d="M-27-11l11 11m0-11L-27 0M16-11L27 0m0-11L16 0" />
          <path className="uvgraffiti__fat" d="M-3 17C-12 7-28 12-30 22C-21 30-8 27 0 20C8 27 21 30 30 22C28 12 12 7 3 17" />
        </>
      );
      break;
    case 'wizard':
      drawing = (
        <>
          <path className="uvgraffiti__fill" d="M-34-18L6-67L29-13Z" />
          <path className="uvgraffiti__fat" d="M-42-13Q-2-24 39-10Q3 1-42-13Z" />
          <path d="M-4-55l5 6 8-1-5 7 3 8-8-4-7 5 1-9-6-6 8-1z" />
          <path className="uvgraffiti__spark" d="M-50-48v15m-8-8h16M38-46v13m-7-7h14" />
        </>
      );
      break;
    case 'alien':
      drawing = (
        <>
          <path d="M-20-20C-32-50-20-65-10-70M20-20C32-50 20-65 10-70" />
          <circle className="uvgraffiti__spark" cx="-10" cy="-70" r="5" />
          <circle className="uvgraffiti__spark" cx="10" cy="-70" r="5" />
          <ellipse cx="0" cy="2" rx="38" ry="45" />
          <path className="uvgraffiti__fat" d="M-22-8q12-14 20 1m4 0q9-15 20 1M-11 24q11 8 22 0" />
          <text y="63">100% HUMANO</text>
        </>
      );
      break;
    case 'halo-horns':
      drawing = (
        <>
          <ellipse className="uvgraffiti__spark" cx="0" cy="-48" rx="31" ry="8" />
          <path className="uvgraffiti__hot" d="M-28-23C-49-38-47-58-35-66C-36-50-22-47-17-35M28-23C49-38 47-58 35-66C36-50 22-47 17-35" />
          <path d="M-11 28q11 9 22 0" />
        </>
      );
      break;
    case 'cat':
      drawing = (
        <>
          <path className="uvgraffiti__fill" d="M-37-20L-32-60L-10-34M37-20L32-60L10-34" />
          <path d="M-7 15l7 7 7-7M0 22v9M-12 31q12 8 24 0M-9 20L-45 10m36 18l-40 4M9 20l36-10M9 28l40 4" />
        </>
      );
      break;
    case 'pirate':
      drawing = (
        <>
          <path className="uvgraffiti__fat" d="M-43-28Q0-62 43-28M-36-30Q0-12 36-30" />
          <circle className="uvgraffiti__fill" cx="-16" cy="0" r="13" />
          <path d="M-48-17L-3 9M16 18q12 4 19-5" />
          <path className="uvgraffiti__spark" d="M39-8q18-14 27 3q-4 17-19 14l-5 13m2-14l11 10" />
        </>
      );
      break;
    case 'crown':
      drawing = (
        <>
          <path className="uvgraffiti__fill" d="M-39-19L-43-58L-18-39L0-68L18-39L43-58L39-19Z" />
          <path className="uvgraffiti__fat" d="M-40-19Q0-10 40-19" />
          <circle className="uvgraffiti__hot" cx="0" cy="-34" r="4" />
          <text y="50">CEO DEL MANGO</text>
        </>
      );
      break;
    case 'ufo':
      drawing = (
        <>
          <path className="uvgraffiti__beam" d="M-30-31L-47 55H47L30-31Z" />
          <ellipse className="uvgraffiti__fill" cx="0" cy="-41" rx="47" ry="13" />
          <path d="M-20-43q20-28 40 0M-34-35q34 13 68 0" />
          <circle className="uvgraffiti__spark" cx="-25" cy="-36" r="3" />
          <circle className="uvgraffiti__spark" cx="0" cy="-31" r="3" />
          <circle className="uvgraffiti__spark" cx="25" cy="-36" r="3" />
        </>
      );
      break;
    case 'pixels':
      drawing = (
        <>
          <path className="uvgraffiti__pixel" d="M-42-15h34v23h-34zM8-15h34v23H8zM-8-8H8v7H-8zM-31 8h9v9h-9zm50 0h9v9h-9z" />
          <path d="M-27 29q27 16 54 0" />
          <text y="56">MODO INCÓGNITO</text>
        </>
      );
      break;
    case 'party':
      drawing = (
        <>
          <path className="uvgraffiti__fill" d="M-29-23L5-73L21-17Z" />
          <path className="uvgraffiti__fat" d="M-32-21q27 10 56 2" />
          <circle className="uvgraffiti__hot" cx="0" cy="13" r="9" />
          <path className="uvgraffiti__spark" d="M-51-33l9 7m-3-20l5-9M44-42l-7 9m17 2l9-5M37 14l13 5M-42 11l-12 7" />
        </>
      );
      break;
    case 'wizard-school':
      drawing = (
        <>
          <circle cx="-19" cy="0" r="17" /><circle cx="19" cy="0" r="17" />
          <path d="M-2 0h4M-4-40l11 9-9 10 12 8" />
          <path className="uvgraffiti__fat" d="M-43-20Q0-57 43-20" />
          <text y="48">9¾ €</text>
        </>
      );
      break;
    case 'vampire':
      drawing = (
        <>
          <path className="uvgraffiti__hot" d="M-17 20l7 20 7-21M3 19l7 21 7-20" />
          <path className="uvgraffiti__fill" d="M-45 48L-23 18L0 45L23 18L45 48L32 72H-32Z" />
          <path d="M-54-27q10-11 20 0q-10-5-20 0m88 0q10-11 20 0q-10-5-20 0" />
          <text y="88">BECARIO DE NOCHE</text>
        </>
      );
      break;
  }

  return (
    <g key={`gag:${gag.id}`} data-uv-gag={gag.id} className={`uvgraffiti uvgraffiti--photo uvgraffiti--${gag.kind}`} transform={transform}>
      {drawing}
    </g>
  );
}

function cardGraffiti(gag: CardGag, card: Box, t: UiText): ReactNode {
  const x = card.x + card.w * gag.x;
  const y = card.y + card.h * gag.y;
  const width = card.w * gag.width;
  const rotate = card.rot + (gag.rotate ?? 0);
  const transform = `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rotate.toFixed(2)})`;
  const copy = t(gag.copyKey);

  let drawing: ReactNode;
  switch (gag.kind) {
    case 'rewrite':
      drawing = (
        <>
          <path d={`M${(-width / 2).toFixed(1)} -7Q0 2 ${(width / 2).toFixed(1)} -5M${(-width / 2).toFixed(1)} 0Q0 -8 ${(width / 2).toFixed(1)} 3`} />
          <text y="22">{copy}</text>
        </>
      );
      break;
    case 'stamp':
      drawing = (
        <>
          <rect className="uvgraffiti__stamp" x={-width / 2} y="-17" width={width} height="34" rx="3" />
          <text y="5">{copy}</text>
        </>
      );
      break;
    case 'arrow':
      drawing = (
        <>
          <path d={`M${(-width / 2).toFixed(1)} 18Q${(-width * 0.1).toFixed(1)} -15 ${(width / 2).toFixed(1)} -4l-13-8m13 8l-11 10`} />
          <text x={-width / 2} y="35" textAnchor="start">{copy}</text>
        </>
      );
      break;
    case 'ring':
      drawing = (
        <>
          <ellipse className="uvgraffiti__ring-copy" cx="0" cy="0" rx={width / 2} ry="21" />
          <path d={`M${(-width * 0.42).toFixed(1)} 8Q0 22 ${(width * 0.42).toFixed(1)} 5`} />
          <text y="40">{copy}</text>
        </>
      );
      break;
  }

  return (
    <g key={`gag:${gag.id}`} data-uv-gag={gag.id} className={`uvgraffiti uvgraffiti--card uvgraffiti--${gag.kind}`} transform={transform}>
      {drawing}
    </g>
  );
}
