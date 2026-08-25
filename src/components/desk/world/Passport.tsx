// A passport, with a stamp for every country and a page behind every stamp.
//
// It is not a travel map. A map tells you where somebody has been; a passport
// makes you turn the leaves and find out. Every stamp opens a small card with a
// photograph and something written by hand, and every part of that — the
// countries, the ink, where the stamp sits, the words — is the owner's from
// inside the board.

import { useCallback, useMemo, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { DEFAULT_STAMPS, type PassportStamp } from '../../../lib/world/passport';
import { useUiText } from '../ui-text-context';

export function Passport() {
  const t = useUiText();
  const world = useWorld();
  const { passport, savePassport, editing, upload } = world;
  const [open, setOpen] = useState(false);
  const [leaf, setLeaf] = useState(1);
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const stamps = passport.length > 0 ? passport : DEFAULT_STAMPS;
  const pages = useMemo(() => Math.max(2, ...stamps.map((s) => s.page)), [stamps]);
  const onLeaf = useCallback((page: number) => stamps.filter((s) => s.page === page), [stamps]);
  const chosen = stamps.find((s) => s.id === picked) ?? null;

  const patch = useCallback((id: string, next: Partial<PassportStamp>) => {
    savePassport(stamps.map((s) => (s.id === id ? { ...s, ...next } : s)));
  }, [savePassport, stamps]);

  const addStamp = useCallback(() => {
    const made: PassportStamp = {
      id: `stamp-${Date.now().toString(36)}`,
      code: 'XX', place: '', year: '', page: leaf,
      x: 20 + Math.random() * 40, y: 18 + Math.random() * 44, rot: (Math.random() - 0.5) * 40,
      ink: 'violet', shape: 'round', note: '', city: '',
    };
    savePassport([...stamps, made]);
    setPicked(made.id);
  }, [leaf, savePassport, stamps]);

  const pickPhoto = useCallback((file: File) => {
    if (!chosen) return;
    setBusy(true);
    const done = (url: string) => { patch(chosen.id, { assetUrl: url }); setBusy(false); };
    if (upload) {
      upload(file).then(done).catch(() => setBusy(false));
      return;
    }
    // No bucket wired up: a data URL still shows the photograph, it simply
    // lives in this settings document rather than in storage.
    const reader = new FileReader();
    reader.onload = () => done(String(reader.result));
    reader.onerror = () => setBusy(false);
    reader.readAsDataURL(file);
  }, [chosen, patch, upload]);

  return (
    <ObjectShell
      id="passport"
      onActivate={() => setOpen((v) => !v)}
      hint={open ? undefined : t('world.pass.hint')}
      label={t('world.pass.label')}
      className={open ? 'obj--pass-open' : ''}
    >
      {open ? (
        <div className="pass pass--open" data-nodrag>
          <button className="pass__close" type="button" onClick={() => { setOpen(false); setPicked(null); }} aria-label={t('world.pass.close')}>×</button>
          <div className="pass__spread">
            {[leaf, leaf + 1].map((page) => (
              <div className="pass__leaf" key={page}>
                <span className="pass__watermark" aria-hidden="true">✦</span>
                <span className="pass__leafno">{page}</span>
                {onLeaf(page).map((stamp) => (
                  <button
                    key={stamp.id}
                    type="button"
                    className={`pstamp pstamp--${stamp.shape} pstamp--${stamp.ink}${picked === stamp.id ? ' is-open' : ''}`}
                    style={{ left: `${stamp.x}%`, top: `${stamp.y}%`, transform: `rotate(${stamp.rot}deg)` }}
                    onClick={() => setPicked(picked === stamp.id ? null : stamp.id)}
                    title={stamp.place}
                  >
                    <span className="pstamp__code">{stamp.code}</span>
                    <span className="pstamp__place">{stamp.place}</span>
                    <span className="pstamp__year">{stamp.year}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="pass__bar">
            <button type="button" onClick={() => setLeaf((n) => Math.max(1, n - 2))} disabled={leaf <= 1}>‹</button>
            <span>{leaf}–{leaf + 1} / {pages}</span>
            <button type="button" onClick={() => setLeaf((n) => Math.min(pages, n + 2))} disabled={leaf + 1 >= pages}>›</button>
            {editing ? <button type="button" className="pass__add" onClick={addStamp}>+</button> : null}
          </div>

          {chosen ? (
            <div className="pass__card mat-paper">
              <button className="pass__cardclose" type="button" onClick={() => setPicked(null)} aria-label={t('world.pass.close')}>×</button>
              <div className="pass__photo">
                {chosen.assetUrl
                  ? <img src={chosen.assetUrl} alt={chosen.place} />
                  : <span className="pass__nophoto">{editing ? t('world.pass.addPhoto') : ''}</span>}
                {editing ? (
                  <>
                    <button className="pass__pick" type="button" disabled={busy} onClick={() => fileRef.current?.click()}>
                      {busy ? '…' : t('world.pass.photo')}
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(event) => { const file = event.target.files?.[0]; if (file) pickPhoto(file); event.target.value = ''; }}
                    />
                  </>
                ) : null}
              </div>
              {editing ? (
                <div className="pass__edit">
                  <div className="pass__row">
                    <input value={chosen.code} maxLength={3} onChange={(e) => patch(chosen.id, { code: e.target.value.toUpperCase() })} aria-label="code" />
                    <input value={chosen.place} onChange={(e) => patch(chosen.id, { place: e.target.value })} aria-label="place" />
                    <input value={chosen.year} maxLength={9} onChange={(e) => patch(chosen.id, { year: e.target.value })} aria-label="year" />
                  </div>
                  <div className="pass__row">
                    <input value={chosen.city ?? ''} placeholder={t('world.pass.city')} onChange={(e) => patch(chosen.id, { city: e.target.value })} aria-label="city" />
                    <select value={chosen.ink} onChange={(e) => patch(chosen.id, { ink: e.target.value as PassportStamp['ink'] })} aria-label="ink">
                      {['violet', 'teal', 'rust', 'ink', 'green'].map((ink) => <option key={ink} value={ink}>{ink}</option>)}
                    </select>
                    <select value={chosen.shape} onChange={(e) => patch(chosen.id, { shape: e.target.value as PassportStamp['shape'] })} aria-label="shape">
                      {['round', 'rect', 'oval', 'shield'].map((shape) => <option key={shape} value={shape}>{shape}</option>)}
                    </select>
                  </div>
                  <div className="pass__row">
                    <label>{t('world.pass.page')}<input type="number" min={1} value={chosen.page} onChange={(e) => patch(chosen.id, { page: Math.max(1, Number(e.target.value) || 1) })} /></label>
                    <label>x<input type="number" value={Math.round(chosen.x)} onChange={(e) => patch(chosen.id, { x: Number(e.target.value) })} /></label>
                    <label>y<input type="number" value={Math.round(chosen.y)} onChange={(e) => patch(chosen.id, { y: Number(e.target.value) })} /></label>
                    <label>↻<input type="number" value={Math.round(chosen.rot)} onChange={(e) => patch(chosen.id, { rot: Number(e.target.value) })} /></label>
                  </div>
                  <textarea
                    value={chosen.note ?? ''}
                    rows={4}
                    placeholder={t('world.pass.note')}
                    onChange={(e) => patch(chosen.id, { note: e.target.value })}
                  />
                  <button className="pass__del" type="button" onClick={() => { savePassport(stamps.filter((s) => s.id !== chosen.id)); setPicked(null); }}>
                    {t('world.pass.remove')}
                  </button>
                </div>
              ) : (
                <div className="pass__read">
                  <h5>{chosen.place || chosen.code}</h5>
                  <p className="pass__meta">{[chosen.city, chosen.year].filter(Boolean).join(' · ')}</p>
                  {chosen.note ? <p className="pass__note">{chosen.note}</p> : <p className="pass__note pass__note--empty">—</p>}
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="pass pass--shut">
          <span className="pass__crest" aria-hidden="true">
            <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="15" /><path d="M20 7v26M7 20h26M11 11l18 18M29 11L11 29" /></svg>
          </span>
          <span className="pass__word">PASAPORTE</span>
          <span className="pass__word pass__word--2">PASSPORT</span>
          <span className="pass__chip" aria-hidden="true" />
          <span className="pass__edge" aria-hidden="true" />
        </div>
      )}
    </ObjectShell>
  );
}
