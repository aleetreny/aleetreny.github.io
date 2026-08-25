// A pad of paper, for anyone who wants to leave something behind.
//
// The visitor writes on the top sheet, tears it off, and it lands on the spike.
// They are not shown anybody else's — a wall of other people's notes changes
// what you are willing to write. What comes back is one line of acknowledgement
// and the sound of paper.

import { useCallback, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { addNote } from '../../../lib/world/remote';
import { underLimit } from '../../../lib/world/visitor';
import { useUiText } from '../ui-text-context';

const MAX = 400;

export function NotePad() {
  const t = useUiText();
  const { reduced } = useWorld();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'full'>('idle');
  const sheetRef = useRef<HTMLDivElement | null>(null);

  const send = useCallback(() => {
    const text = body.trim();
    if (!text || state === 'sending') return;
    if (!underLimit('note', 3, 60 * 60 * 1000)) { setState('full'); return; }
    setState('sending');
    const fly = () => {
      setBody('');
      setState('sent');
      window.setTimeout(() => { setState('idle'); setOpen(false); }, 2100);
    };
    const el = sheetRef.current;
    const lang = document.documentElement.lang || '';
    void addNote(text, lang.slice(0, 8)).catch(() => undefined);
    if (!el || reduced) { fly(); return; }
    // Torn off, tumbled, and spiked. The physics is a lie but the weight is not.
    el.animate([
      { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
      { transform: 'translate(10px,-26px) rotate(-7deg)', opacity: 1, offset: 0.3 },
      { transform: 'translate(-6px,34px) rotate(9deg)', opacity: .9, offset: 0.7 },
      { transform: 'translate(0,64px) rotate(4deg)', opacity: 0 },
    ], { duration: 760, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'none' })
      .addEventListener('finish', fly, { once: true });
  }, [body, reduced, state]);

  const left = MAX - body.length;

  return (
    <ObjectShell
      id="notepad"
      onActivate={() => setOpen((v) => !v)}
      hint={open ? undefined : t('world.note.hint')}
      label={t('world.note.label')}
      className={open ? 'obj--pad-open' : ''}
    >
      <div className={`pad${open ? ' pad--open' : ''}`}>
        <span className="pad__stack" aria-hidden="true" />
        <span className="pad__stack pad__stack--2" aria-hidden="true" />
        <span className="pad__spike" aria-hidden="true" />
        <div className="pad__sheet mat-paper" ref={sheetRef}>
          {open ? (
            <div className="pad__form" data-nodrag>
              <textarea
                className="pad__input"
                value={body}
                maxLength={MAX}
                rows={5}
                autoFocus
                placeholder={t('world.note.placeholder')}
                onChange={(event) => setBody(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setOpen(false);
                  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) send();
                }}
              />
              <div className="pad__actions">
                <span className={`pad__count${left < 40 ? ' is-low' : ''}`}>{left}</span>
                <button className="pad__send" type="button" onClick={send} disabled={!body.trim() || state === 'sending'}>
                  {t('world.note.send')}
                </button>
              </div>
            </div>
          ) : (
            <span className="pad__rules" aria-hidden="true" />
          )}
        </div>
        {state === 'sent' ? <span className="pad__ack">{t('world.note.thanks')}</span> : null}
        {state === 'full' ? <span className="pad__ack pad__ack--no">{t('world.note.enough')}</span> : null}
      </div>
    </ObjectShell>
  );
}
