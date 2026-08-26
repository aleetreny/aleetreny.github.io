// A machine that dispenses questions nobody has settled.
//
// Pull the handle and a strip of paper comes out of the slot with one question
// on it. There is no answer under it, no link to anything of mine, and no score.
// You can write on the strip and put it back in, and then you can have another.

import { useCallback, useEffect, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { addAnswer, listQuestions, type CuriosityQuestion } from '../../../lib/world/remote';
import { underLimit } from '../../../lib/world/visitor';
import { useUiText } from '../ui-text-context';

function promptText(prompt: unknown, lang: string): string {
  if (typeof prompt === 'string') return prompt;
  if (prompt && typeof prompt === 'object') {
    const map = prompt as Record<string, unknown>;
    const own = map[lang];
    if (typeof own === 'string') return own;
    for (const value of Object.values(map)) if (typeof value === 'string') return value;
  }
  return '';
}

export function CuriosityMachine() {
  const t = useUiText();
  const { reduced } = useWorld();
  const [questions, setQuestions] = useState<CuriosityQuestion[]>([]);
  const [index, setIndex] = useState(-1);
  const [answer, setAnswer] = useState('');
  const [state, setState] = useState<'idle' | 'sent' | 'full'>('idle');
  const [pulling, setPulling] = useState(false);
  const lang = typeof document !== 'undefined' ? (document.documentElement.lang || 'en') : 'en';

  useEffect(() => {
    void listQuestions().then((list) => setQuestions(list.filter((q) => q.active))).catch(() => undefined);
  }, []);

  const pull = useCallback(() => {
    if (questions.length === 0 || pulling) return;
    setPulling(true);
    setAnswer('');
    setState('idle');
    const next = () => {
      // Never the same one twice in a row.
      setIndex((current) => {
        if (questions.length === 1) return 0;
        let pick = current;
        while (pick === current) pick = Math.floor(Math.random() * questions.length);
        return pick;
      });
      setPulling(false);
    };
    if (reduced) { next(); return; }
    window.setTimeout(next, 460);
  }, [pulling, questions.length, reduced]);

  const send = useCallback(() => {
    const body = answer.trim();
    const question = questions[index];
    if (!body || !question) return;
    if (!underLimit('curiosity', 6, 60 * 60 * 1000)) { setState('full'); return; }
    void addAnswer(question.id, body, lang.slice(0, 8)).catch(() => undefined);
    setAnswer('');
    setState('sent');
  }, [answer, index, lang, questions]);

  const current = index >= 0 ? questions[index] : null;

  return (
    <ObjectShell id="curiosity" label={t('world.ask.label')} hint={current ? undefined : t('world.ask.hint')}>
      <div className={`ask${current ? ' ask--out' : ''}`}>
        <div className="ask__body mat-dark">
          <span className="ask__window" aria-hidden="true">
            <span className="ask__glass" />
            <span className="ask__coil" />
          </span>
          <span className="ask__slot" aria-hidden="true" />
          <span className="ask__plate">{t('world.ask.plate')}</span>
          <button
            className={`ask__lever${pulling ? ' is-pulled' : ''}`}
            type="button"
            data-nodrag
            onClick={pull}
            aria-label={t('world.ask.pull')}
          >
            <span className="ask__leverarm" />
            <span className="ask__leverknob" />
          </button>
        </div>

        {current ? (
          <div className="ask__strip mat-paper" data-nodrag>
            <span className="ask__perf" aria-hidden="true" />
            <p className="ask__q">{promptText(current.prompt, lang)}</p>
            {state === 'sent' ? (
              <div className="ask__done">
                <span>{t('world.ask.thanks')}</span>
                <button type="button" onClick={pull}>{t('world.ask.another')}</button>
              </div>
            ) : (
              <>
                <textarea
                  className="ask__a"
                  rows={3}
                  maxLength={1200}
                  value={answer}
                  placeholder={t('world.ask.placeholder')}
                  onChange={(event) => setAnswer(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) send(); }}
                />
                <div className="ask__actions">
                  <button type="button" className="ask__skip" onClick={pull}>{t('world.ask.another')}</button>
                  <button type="button" className="ask__send" onClick={send} disabled={!answer.trim()}>{t('world.ask.send')}</button>
                </div>
              </>
            )}
            {state === 'full' ? <span className="ask__full">{t('world.ask.enough')}</span> : null}
          </div>
        ) : null}
      </div>
    </ObjectShell>
  );
}
