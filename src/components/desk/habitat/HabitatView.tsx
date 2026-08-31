// The window onto the habitat.
//
// Cold instrument on the outside, warm life within. Everything that frames the
// world — the header, the cotas, the record, the room card — stays in the board's
// own ink, bone and signal amber, monospaced and unrounded. What is being framed
// is somewhere people live.
//
// The view reads a snapshot and nothing else. It has no idea whether that snapshot
// came from an engine on a schedule somewhere or from the authored Genesis state,
// which is the point: the simulation can move without the frontend noticing.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { HabitatSection } from './HabitatSection';
import { RoomCanvas } from './RoomCanvas';
import { Dossier } from './Dossier';
import { Weave } from './Weave';
import { ROOM_BY_ID, type RoomId } from '../../../lib/habitat/rooms';
import { RESIDENT_BY_ID, type ResidentId } from '../../../lib/habitat/residents';
import { genesisSnapshot, type PersonState } from '../../../lib/habitat/snapshot';

const WATCH = ['', 'I', 'II', 'III', 'IV'] as const;

function clock(minute: number): string {
  const h = Math.floor(minute / 60).toString().padStart(2, '0');
  const m = (minute % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function HabitatView({ onClose }: { onClose: () => void }) {
  const snapshot = useMemo(() => genesisSnapshot(), []);
  const [selected, setSelected] = useState<RoomId | null>(null);
  const [hovered, setHovered] = useState<PersonState | null>(null);
  const [opened, setOpened] = useState<ResidentId | null>(null);
  const [weave, setWeave] = useState(false);

  const close = useCallback(() => {
    if (opened) setOpened(null);
    else if (weave) setWeave(false);
    else if (selected) {
      setSelected(null);
      setHovered(null);
    } else onClose();
  }, [onClose, opened, selected, weave]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [close]);

  const room = selected ? ROOM_BY_ID[selected] : null;
  const state = selected ? snapshot.rooms.find((r) => r.id === selected) : null;

  return (
    <div className="hab" role="dialog" aria-modal="true" aria-label="The habitat">
      <header className="hab__head">
        <span className="hab__title">THE HABITAT</span>
        <span className="hab__stat"><b>DAY</b> {snapshot.day}</span>
        <span className="hab__stat"><b>WATCH</b> {WATCH[snapshot.watch]}</span>
        <span className="hab__stat"><b>REACTOR</b> {snapshot.power.toFixed(2)}</span>
        <span className="hab__stat"><b>ALIVE</b> {snapshot.people.length}</span>
        <button
          type="button"
          className={weave ? 'hab__toggle is-on' : 'hab__toggle'}
          onClick={() => { setWeave((w) => !w); setSelected(null); }}
          aria-pressed={weave}
        >
          the weave
        </button>
        <button type="button" className="hab__close" onClick={onClose}>
          close · esc
        </button>
      </header>

      <div className={weave ? "hab__body hab__body--wide" : "hab__body"}>
        <div className="hab__stage">
          {weave ? (
            <Weave onOpen={setOpened} />
          ) : selected ? (
            <>
              <button type="button" className="hab__back" onClick={close}>
                ← the whole habitat
              </button>
              <RoomCanvas
                room={selected}
                snapshot={snapshot}
                hovered={hovered}
                onHover={setHovered}
                onPick={(p) => setOpened(p.id)}
              />
            </>
          ) : (
            <HabitatSection
              snapshot={snapshot}
              selected={selected}
              onSelect={(id) => setSelected(id)}
            />
          )}
        </div>

        {weave ? null : (
        <aside className="hab__rail">
          <h2 className="hab__railhead">THE RECORD · DAY {snapshot.day}</h2>
          <ol className="hab__record">
            {snapshot.record.map((e) => (
              <li key={`${e.minute}-${e.room}`} className="hab__entry">
                <span className="hab__when">{clock(e.minute)}</span>
                <span className="hab__where">{ROOM_BY_ID[e.room].name}</span>
                <p className="hab__what">{e.text}</p>
              </li>
            ))}
          </ol>
        </aside>
        )}
      </div>

      {room && state ? (
        <section className="hab__card">
          <header className="hab__cardhead">
            <span className="hab__cardname">{room.name}</span>
            <span className="hab__cardmeta">
              {room.side === 'hull' ? 'HULL · INHERITED' : 'ROCK · CUT BY HAND'}
              {' · '}
              {state.occupants.length} INSIDE
            </span>
          </header>
          <p className="hab__cardtext">{room.description}</p>
          {room.note ? <p className="hab__cardnote">{room.note}</p> : null}
          {state.occupants.length ? (
            <ul className="hab__who">
              {state.occupants.map((id) => {
                const person = RESIDENT_BY_ID[id];
                const doing = snapshot.people.find((p) => p.id === id)?.doing;
                return (
                  <li key={id} className="hab__person">
                    <button
                      type="button"
                      className="hab__personbtn"
                      onClick={() => setOpened(id)}
                    >
                      <span className="hab__initial">{id}</span>
                      <span className="hab__personname">{person.name}</span>
                    </button>
                    <span className="hab__doing">{doing}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="hab__empty">Nobody is in here.</p>
          )}
        </section>
      ) : null}

      {opened ? (
        <Dossier
          id={opened}
          snapshot={snapshot}
          onClose={() => setOpened(null)}
          onOpen={setOpened}
        />
      ) : null}
    </div>
  );
}
