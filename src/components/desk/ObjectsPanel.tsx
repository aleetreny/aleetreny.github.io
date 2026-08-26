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
import { useUiText } from './ui-text-context';

type ObjectsPanelProps = {
  objects: DeskObject[];
  paintMode: PaintMode;
  onChange: (next: DeskObject[]) => void;
  onPaintMode: (mode: PaintMode) => void;
  activeLanguage: string;
  onClose: () => void;
};

type Tab = 'objects' | 'notes' | 'garden' | 'curiosity' | 'vote';

export function ObjectsPanel({ objects, paintMode, onChange, onPaintMode, activeLanguage, onClose }: ObjectsPanelProps) {
  const t = useUiText();
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
      <div className="panel panel--objects" role="dialog" aria-modal="true" aria-label={t('objectspanel.aria')}>
        <div className="panel__eyebrow">{t('objectspanel.eyebrow')}</div>
        <div className="panel__title">{t('objectspanel.title')}</div>
        <p className="panel__hint">{t('objectspanel.hint')} <code>board.objects</code>.</p>

        <div className="objtabs">
          {(['objects', 'notes', 'garden', 'curiosity', 'vote'] as const).map((name) => (
            <button key={name} type="button" className={tab === name ? 'is-on' : ''} onClick={() => setTab(name)}>{t(`objectspanel.tab.${name}`)}</button>
          ))}
        </div>

        {tab === 'objects' ? (
          <>
            <div className="panel__section">{t('objectspanel.paint')}</div>
            <div className="field-row">
              <label htmlFor="paint-mode">{t('objectspanel.paintDuration')}</label>
              <select id="paint-mode" value={paintMode} onChange={(event) => onPaintMode(event.target.value as PaintMode)}>
                <option value="none">{t('objectspanel.paint.none')}</option>
                <option value="session">{t('objectspanel.paint.session')}</option>
                <option value="global">{t('objectspanel.paint.global')}</option>
              </select>
            </div>
            <div className="panel__actions panel__actions--tight">
              <button className="tbtn" type="button" onClick={world.clearSplats}>{t('objectspanel.wash')}</button>
              <button className="tbtn" type="button" onClick={world.restoreWorld}>{t('objectspanel.resetWorld')}</button>
              <button className="tbtn" type="button" onClick={world.clearPhotos}>{t('objectspanel.clearPhotos')}</button>
            </div>

            <div className="panel__section">{t('objectspanel.onTable')}</div>
            <div className="panel__actions panel__actions--tight">
              <button className="tbtn tbtn--on" type="button" onClick={takePositions}>{t('objectspanel.takePositions')}</button>
              <button className="tbtn" type="button" onClick={() => onChange(DEFAULT_OBJECT_LAYOUT)}>{t('objectspanel.putBack')}</button>
              <button className="tbtn" type="button" onClick={() => onChange(objects.map((o) => ({ ...o, visible: true })))}>{t('objectspanel.showAll')}</button>
              <button className="tbtn" type="button" onClick={() => onChange(objects.map((o) => ({ ...o, visible: false })))}>{t('objectspanel.hideAll')}</button>
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
                        aria-label={t('objectspanel.visible', { name: t(`objectspanel.object.${kind}`) })}
                      />
                      <b>{t(`objectspanel.object.${kind}`)}</b>
                    </label>
                    <span className="objrow__traits">{spec.traits.map((trait) => t(`objectspanel.trait.${trait}`)).join(' · ')}</span>
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

        {tab === 'notes' ? <NotesTab activeLanguage={activeLanguage} /> : null}
        {tab === 'garden' ? <GardenTab /> : null}
        {tab === 'curiosity' ? <CuriosityTab activeLanguage={activeLanguage} /> : null}
        {tab === 'vote' ? <VoteTab /> : null}

        <div className="panel__actions">
          <button className="tbtn tbtn--on" type="button" onClick={onClose}>{t('objectspanel.done')}</button>
        </div>
      </div>
    </div>
  );
}

function Backing() {
  const t = useUiText();
  return (
    <p className="panel__note panel__note--quiet">
      {t(currentBacking() === 'remote' ? 'objectspanel.backing.remote' : 'objectspanel.backing.local')}
    </p>
  );
}

function NotesTab({ activeLanguage }: { activeLanguage: string }) {
  const t = useUiText();
  const [notes, setNotes] = useState<VisitorNote[]>([]);
  useEffect(() => { void listNotes().then(setNotes).catch(() => undefined); }, []);
  return (
    <>
      <div className="panel__section">{t('objectspanel.notesCount', { count: notes.length })}</div>
      <Backing />
      <div className="modlist">
        {notes.map((note) => (
          <div className={`modrow${note.hidden ? ' is-hidden' : ''}`} key={note.id}>
            <div className="modrow__meta">
              <span>{new Date(note.at).toLocaleDateString(activeLanguage)}</span>
              {note.lang ? <em>{note.lang}</em> : null}
              <code>{note.visitor ? shortId(note.visitor) : '—'}</code>
            </div>
            <p className="modrow__body">{note.body}</p>
            <div className="modrow__acts">
              <button type="button" onClick={() => { void setNoteHidden(note.id, !note.hidden); setNotes((list) => list.map((n) => (n.id === note.id ? { ...n, hidden: !n.hidden } : n))); }}>
                {t(note.hidden ? 'objectspanel.unhide' : 'objectspanel.hide')}
              </button>
              <button type="button" className="is-del" onClick={() => { void removeNote(note.id); setNotes((list) => list.filter((n) => n.id !== note.id)); }}>{t('objectspanel.delete')}</button>
            </div>
          </div>
        ))}
        {notes.length === 0 ? <p className="panel__note">{t('objectspanel.nothingYet')}</p> : null}
      </div>
    </>
  );
}

function GardenTab() {
  const t = useUiText();
  const [plants, setPlants] = useState<OwnerPlant[]>([]);
  useEffect(() => { void listPlants().then(setPlants).catch(() => undefined); }, []);
  return (
    <>
      <div className="panel__section">{t('objectspanel.growing', { count: plants.filter((p) => !p.removed).length })}</div>
      <Backing />
      <div className="modlist">
        {plants.map((plant) => (
          <div className={`modrow modrow--tight${plant.removed ? ' is-hidden' : ''}`} key={plant.id}>
            <div className="modrow__meta">
              <b>{t(`objectspanel.species.${speciesOf(plant.species).id}`)}</b>
              <span>{t('objectspanel.plantedAgo', { when: ago(plant.plantedAt) })}</span>
              <span>{t('objectspanel.wateredAgo', { when: ago(plant.wateredAt), count: plant.waterings })}</span>
              <code>{shortId(plant.visitor)}</code>
            </div>
            <div className="modrow__acts">
              <button type="button" className="is-del" onClick={() => { void removePlant(plant.id); setPlants((list) => list.map((p) => (p.id === plant.id ? { ...p, removed: true } : p))); }}>{t('objectspanel.pullUp')}</button>
            </div>
          </div>
        ))}
        {plants.length === 0 ? <p className="panel__note">{t('objectspanel.noPlants')}</p> : null}
      </div>
    </>
  );
}

function CuriosityTab({ activeLanguage }: { activeLanguage: string }) {
  const t = useUiText();
  const [questions, setQuestions] = useState<CuriosityQuestion[]>([]);
  const [answers, setAnswers] = useState<CuriosityAnswer[]>([]);
  const [draftEs, setDraftEs] = useState('');
  const [draftEn, setDraftEn] = useState('');

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
      for (const key of [activeLanguage, 'es', 'en']) if (typeof map[key] === 'string') return map[key] as string;
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
      <div className="panel__section">{t('objectspanel.questionsCount', { count: questions.length })}</div>
      <Backing />
      <div className="modlist">
        {questions.map((question) => (
          <div className={`modrow modrow--tight${question.active ? '' : ' is-hidden'}`} key={question.id}>
            <p className="modrow__body">{promptOf(question)}</p>
            <div className="modrow__acts">
              <button type="button" onClick={() => { void saveQuestion({ ...question, active: !question.active }); reload(); }}>
                {t(question.active ? 'objectspanel.retire' : 'objectspanel.bringBack')}
              </button>
              <button type="button" className="is-del" onClick={() => { void removeQuestion(question.id); reload(); }}>{t('objectspanel.delete')}</button>
            </div>
          </div>
        ))}
      </div>
      <div className="field-row field-row--stacked">
        <input
          type="text"
          value={draftEs}
          placeholder={t('objectspanel.questionEs')}
          aria-label={t('objectspanel.questionEs')}
          onChange={(event) => setDraftEs(event.target.value)}
        />
        <input
          type="text"
          value={draftEn}
          placeholder={t('objectspanel.questionEn')}
          aria-label={t('objectspanel.questionEn')}
          onChange={(event) => setDraftEn(event.target.value)}
        />
        <button
          className="tbtn"
          type="button"
          disabled={!draftEs.trim() || !draftEn.trim()}
          onClick={() => {
            void saveQuestion({ prompt: { es: draftEs.trim(), en: draftEn.trim() }, active: true, position: questions.length });
            setDraftEs('');
            setDraftEn('');
            reload();
          }}
        >{t('objectspanel.add')}</button>
      </div>

      <div className="panel__section">{t('objectspanel.answersCount', { count: answers.length })}</div>
      <div className="panel__actions panel__actions--tight">
        <button className="tbtn" type="button" onClick={exportAll} disabled={answers.length === 0}>{t('objectspanel.export')}</button>
      </div>
      <div className="modlist">
        {answers.map((answer) => (
          <div className="modrow" key={answer.id}>
            <div className="modrow__meta">
              <span>{new Date(answer.at).toLocaleDateString(activeLanguage)}</span>
              {answer.lang ? <em>{answer.lang}</em> : null}
              <code>{answer.visitor ? shortId(answer.visitor) : '—'}</code>
            </div>
            <p className="modrow__q">{promptOf(questions.find((q) => q.id === answer.questionId) ?? { id: '', prompt: '', active: true, position: 0 })}</p>
            <p className="modrow__body">{answer.body}</p>
            <div className="modrow__acts">
              <button type="button" className="is-del" onClick={() => { void removeAnswer(answer.id); setAnswers((list) => list.filter((a) => a.id !== answer.id)); }}>{t('objectspanel.delete')}</button>
            </div>
          </div>
        ))}
        {answers.length === 0 ? <p className="panel__note">{t('objectspanel.nothingYet')}</p> : null}
      </div>
    </>
  );
}

function VoteTab() {
  const t = useUiText();
  const [tally, setTally] = useState<VoteTally | null>(null);
  useEffect(() => { void voteTally().then(setTally).catch(() => undefined); }, []);
  const total = tally ? tally.cooperate + tally.betray : 0;
  return (
    <>
      <div className="panel__section">{t('objectspanel.decisionsCount', { count: total })}</div>
      <Backing />
      {total > 0 && tally ? (
        <>
          <div className="votebars">
            <div><b>{t('objectspanel.cooperate')}</b><i style={{ width: `${(tally.cooperate / total) * 100}%` }} /><span>{tally.cooperate}</span></div>
            <div><b>{t('objectspanel.betray')}</b><i style={{ width: `${(tally.betray / total) * 100}%` }} /><span>{tally.betray}</span></div>
          </div>
          <p className="panel__note">{t('objectspanel.cooperatedPercent', { percent: Math.round((tally.cooperate / total) * 100) })}</p>
        </>
      ) : <p className="panel__note">{t('objectspanel.noDecisions')}</p>}
      <div className="panel__actions panel__actions--tight">
        <button className="tbtn" type="button" onClick={() => { void resetVotes().then(() => setTally({ cooperate: 0, betray: 0 })); }}>{t('objectspanel.resetExperiment')}</button>
      </div>
    </>
  );
}
