// The owner's control over the things on the desk.
//
// Four jobs, and they are all in one panel because they are all one question —
// what is out on the table:
//
//  - every object: out or away, where, how big, which way up;
//  - the paint: how long it lives, and a way to wash it all off;
//  - what visitors have left: notes, answers, the plot, the vote;
//  - the questions the machine asks, which are content and are edited here.
//
// No second CMS. This is a panel in the editor that already exists.

import { useCallback, useEffect, useState } from 'react';
import { OBJECT_KINDS, OBJECT_SPECS, type DeskObject, type ObjectKind } from '../../lib/world/kinds';
import { DEFAULT_OBJECT_LAYOUT } from '../../lib/world/kinds';
import type { PaintMode } from '../../lib/world/context';
import { useWorld } from '../../lib/world/context';
import { shortId } from '../../lib/world/visitor';
import { ago, speciesOf } from '../../lib/world/garden';
import {
  currentBacking, listAnswers, listNotes, listPlants, listQuestions, removeAnswer, removeNote,
  removePlant, removeQuestion, resetVotes, saveQuestion, setNoteHidden, voteTally,
  type CuriosityAnswer, type CuriosityQuestion, type OwnerPlant, type VisitorNote, type VoteTally,
} from '../../lib/world/remote';

type ObjectsPanelProps = {
  objects: DeskObject[];
  paintMode: PaintMode;
  onChange: (next: DeskObject[]) => void;
  onPaintMode: (mode: PaintMode) => void;
  onClose: () => void;
};

type Tab = 'objects' | 'notes' | 'garden' | 'curiosity' | 'vote';

export function ObjectsPanel({ objects, paintMode, onChange, onPaintMode, onClose }: ObjectsPanelProps) {
  const world = useWorld();
  const [tab, setTab] = useState<Tab>('objects');

  const patch = useCallback((id: ObjectKind, next: Partial<DeskObject>) => {
    onChange(objects.map((object) => (object.id === id ? { ...object, ...next } : object)));
  }, [objects, onChange]);

  /** Take the positions the objects are actually sitting in and make them the
   *  authored ones. This is how an owner arranges the desk: by dragging. */
  const takePositions = useCallback(() => {
    onChange(objects.map((object) => {
      const at = world.placeRef.current.get(object.id);
      return at ? { ...object, x: Math.round(at.x), y: Math.round(at.y), rot: Math.round(at.rot * 10) / 10, scale: at.scale } : object;
    }));
  }, [objects, onChange, world.placeRef]);

  return (
    <div className="overlay" role="presentation">
      <div className="overlay__scrim" onClick={onClose} />
      <div className="panel panel--objects" role="dialog" aria-modal="true" aria-label="The things on the desk">
        <div className="panel__eyebrow">the desk</div>
        <div className="panel__title">Objects &amp; what visitors left</div>
        <p className="panel__hint">
          Drag anything into place on the board, then press <em>take positions</em>. Everything here is stored in
          <code> board.objects</code>, beside the theme.
        </p>

        <div className="objtabs">
          {(['objects', 'notes', 'garden', 'curiosity', 'vote'] as const).map((name) => (
            <button key={name} type="button" className={tab === name ? 'is-on' : ''} onClick={() => setTab(name)}>{name}</button>
          ))}
        </div>

        {tab === 'objects' ? (
          <>
            <div className="panel__section">paint</div>
            <div className="field-row">
              <label htmlFor="paint-mode">How long a splat lasts</label>
              <select id="paint-mode" value={paintMode} onChange={(event) => onPaintMode(event.target.value as PaintMode)}>
                <option value="none">not kept</option>
                <option value="session">this visit</option>
                <option value="global">this browser, for good</option>
              </select>
            </div>
            <div className="panel__actions panel__actions--tight">
              <button className="tbtn" type="button" onClick={world.clearSplats}>wash the board</button>
              <button className="tbtn" type="button" onClick={world.restoreWorld}>reset the world</button>
              <button className="tbtn" type="button" onClick={world.clearPhotos}>clear photos</button>
            </div>

            <div className="panel__section">out on the table</div>
            <div className="panel__actions panel__actions--tight">
              <button className="tbtn tbtn--on" type="button" onClick={takePositions}>take positions</button>
              <button className="tbtn" type="button" onClick={() => onChange(DEFAULT_OBJECT_LAYOUT)}>put it all back</button>
              <button className="tbtn" type="button" onClick={() => onChange(objects.map((o) => ({ ...o, visible: true })))}>show all</button>
              <button className="tbtn" type="button" onClick={() => onChange(objects.map((o) => ({ ...o, visible: false })))}>hide all</button>
            </div>

            <div className="objlist">
              {OBJECT_KINDS.map((kind) => {
                const object = objects.find((o) => o.id === kind);
                if (!object) return null;
                const spec = OBJECT_SPECS[kind];
                return (
                  <div className={`objrow${object.visible ? '' : ' is-off'}`} key={kind}>
                    <label className="objrow__on">
                      <input
                        type="checkbox"
                        checked={object.visible}
                        onChange={(event) => patch(kind, { visible: event.target.checked })}
                        aria-label={`${kind} visible`}
                      />
                      <b>{kind}</b>
                    </label>
                    <span className="objrow__traits">{spec.traits.join(' · ')}</span>
                    <span className="objrow__nums">
                      <label>x<input type="number" value={Math.round(object.x)} onChange={(e) => patch(kind, { x: Number(e.target.value) })} /></label>
                      <label>y<input type="number" value={Math.round(object.y)} onChange={(e) => patch(kind, { y: Number(e.target.value) })} /></label>
                      <label>↻<input type="number" value={object.rot} step={0.5} onChange={(e) => patch(kind, { rot: Number(e.target.value) })} /></label>
                      <label>×<input type="number" value={object.scale} step={0.05} min={0.4} max={2.4} onChange={(e) => patch(kind, { scale: Number(e.target.value) })} /></label>
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        ) : null}

        {tab === 'notes' ? <NotesTab /> : null}
        {tab === 'garden' ? <GardenTab /> : null}
        {tab === 'curiosity' ? <CuriosityTab /> : null}
        {tab === 'vote' ? <VoteTab /> : null}

        <div className="panel__actions">
          <button className="tbtn tbtn--on" type="button" onClick={onClose}>done</button>
        </div>
      </div>
    </div>
  );
}

function Backing() {
  return (
    <p className="panel__note panel__note--quiet">
      {currentBacking() === 'remote'
        ? 'Reading the database.'
        : 'No database configured, so this is what this browser has collected.'}
    </p>
  );
}

function NotesTab() {
  const [notes, setNotes] = useState<VisitorNote[]>([]);
  useEffect(() => { void listNotes().then(setNotes).catch(() => undefined); }, []);
  return (
    <>
      <div className="panel__section">notes left on the pad · {notes.length}</div>
      <Backing />
      <div className="modlist">
        {notes.map((note) => (
          <div className={`modrow${note.hidden ? ' is-hidden' : ''}`} key={note.id}>
            <div className="modrow__meta">
              <span>{new Date(note.at).toLocaleDateString()}</span>
              {note.lang ? <em>{note.lang}</em> : null}
              <code>{note.visitor ? shortId(note.visitor) : '—'}</code>
            </div>
            <p className="modrow__body">{note.body}</p>
            <div className="modrow__acts">
              <button type="button" onClick={() => { void setNoteHidden(note.id, !note.hidden); setNotes((list) => list.map((n) => (n.id === note.id ? { ...n, hidden: !n.hidden } : n))); }}>
                {note.hidden ? 'unhide' : 'hide'}
              </button>
              <button type="button" className="is-del" onClick={() => { void removeNote(note.id); setNotes((list) => list.filter((n) => n.id !== note.id)); }}>delete</button>
            </div>
          </div>
        ))}
        {notes.length === 0 ? <p className="panel__note">Nothing yet.</p> : null}
      </div>
    </>
  );
}

function GardenTab() {
  const [plants, setPlants] = useState<OwnerPlant[]>([]);
  useEffect(() => { void listPlants().then(setPlants).catch(() => undefined); }, []);
  return (
    <>
      <div className="panel__section">the plot · {plants.filter((p) => !p.removed).length} growing</div>
      <Backing />
      <div className="modlist">
        {plants.map((plant) => (
          <div className={`modrow modrow--tight${plant.removed ? ' is-hidden' : ''}`} key={plant.id}>
            <div className="modrow__meta">
              <b>{speciesOf(plant.species).label.en}</b>
              <span>planted {ago(plant.plantedAt)} ago</span>
              <span>watered {ago(plant.wateredAt)} ago · {plant.waterings}×</span>
              <code>{shortId(plant.visitor)}</code>
            </div>
            <div className="modrow__acts">
              <button type="button" className="is-del" onClick={() => { void removePlant(plant.id); setPlants((list) => list.map((p) => (p.id === plant.id ? { ...p, removed: true } : p))); }}>pull it up</button>
            </div>
          </div>
        ))}
        {plants.length === 0 ? <p className="panel__note">Nobody has planted anything yet.</p> : null}
      </div>
    </>
  );
}

function CuriosityTab() {
  const [questions, setQuestions] = useState<CuriosityQuestion[]>([]);
  const [answers, setAnswers] = useState<CuriosityAnswer[]>([]);
  const [draft, setDraft] = useState('');

  const reload = useCallback(() => {
    void listQuestions(true).then(setQuestions).catch(() => undefined);
    void listAnswers().then(setAnswers).catch(() => undefined);
  }, []);
  useEffect(reload, [reload]);

  const promptOf = (question: CuriosityQuestion) => {
    const prompt = question.prompt;
    if (typeof prompt === 'string') return prompt;
    if (prompt && typeof prompt === 'object') {
      const map = prompt as Record<string, unknown>;
      for (const key of ['en', 'es']) if (typeof map[key] === 'string') return map[key] as string;
    }
    return '';
  };

  const exportAll = () => {
    const rows = answers.map((a) => ({
      question: promptOf(questions.find((q) => q.id === a.questionId) ?? { id: '', prompt: a.questionId, active: true, position: 0 }),
      answer: a.body,
      lang: a.lang,
      at: a.at,
    }));
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'curiosity-answers.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="panel__section">questions · {questions.length}</div>
      <Backing />
      <div className="modlist">
        {questions.map((question) => (
          <div className={`modrow modrow--tight${question.active ? '' : ' is-hidden'}`} key={question.id}>
            <p className="modrow__body">{promptOf(question)}</p>
            <div className="modrow__acts">
              <button type="button" onClick={() => { void saveQuestion({ ...question, active: !question.active }); reload(); }}>
                {question.active ? 'retire' : 'bring back'}
              </button>
              <button type="button" className="is-del" onClick={() => { void removeQuestion(question.id); reload(); }}>delete</button>
            </div>
          </div>
        ))}
      </div>
      <div className="field-row">
        <input
          type="text"
          value={draft}
          placeholder="A question with no settled answer"
          onChange={(event) => setDraft(event.target.value)}
        />
        <button
          className="tbtn"
          type="button"
          disabled={!draft.trim()}
          onClick={() => { void saveQuestion({ prompt: { en: draft, es: draft }, active: true, position: questions.length }); setDraft(''); reload(); }}
        >add</button>
      </div>

      <div className="panel__section">answers · {answers.length}</div>
      <div className="panel__actions panel__actions--tight">
        <button className="tbtn" type="button" onClick={exportAll} disabled={answers.length === 0}>export</button>
      </div>
      <div className="modlist">
        {answers.map((answer) => (
          <div className="modrow" key={answer.id}>
            <div className="modrow__meta">
              <span>{new Date(answer.at).toLocaleDateString()}</span>
              {answer.lang ? <em>{answer.lang}</em> : null}
              <code>{answer.visitor ? shortId(answer.visitor) : '—'}</code>
            </div>
            <p className="modrow__q">{promptOf(questions.find((q) => q.id === answer.questionId) ?? { id: '', prompt: '', active: true, position: 0 })}</p>
            <p className="modrow__body">{answer.body}</p>
            <div className="modrow__acts">
              <button type="button" className="is-del" onClick={() => { void removeAnswer(answer.id); setAnswers((list) => list.filter((a) => a.id !== answer.id)); }}>delete</button>
            </div>
          </div>
        ))}
        {answers.length === 0 ? <p className="panel__note">Nothing yet.</p> : null}
      </div>
    </>
  );
}

function VoteTab() {
  const [tally, setTally] = useState<VoteTally | null>(null);
  useEffect(() => { void voteTally().then(setTally).catch(() => undefined); }, []);
  const total = tally ? tally.cooperate + tally.betray : 0;
  return (
    <>
      <div className="panel__section">the one decision · {total}</div>
      <Backing />
      {total > 0 && tally ? (
        <>
          <div className="votebars">
            <div><b>COOPERATE</b><i style={{ width: `${(tally.cooperate / total) * 100}%` }} /><span>{tally.cooperate}</span></div>
            <div><b>BETRAY</b><i style={{ width: `${(tally.betray / total) * 100}%` }} /><span>{tally.betray}</span></div>
          </div>
          <p className="panel__note">{Math.round((tally.cooperate / total) * 100)}% cooperated.</p>
        </>
      ) : <p className="panel__note">Nobody has decided anything yet.</p>}
      <div className="panel__actions panel__actions--tight">
        <button className="tbtn" type="button" onClick={() => { void resetVotes().then(() => setTally({ cooperate: 0, betray: 0 })); }}>reset the experiment</button>
      </div>
    </>
  );
}
