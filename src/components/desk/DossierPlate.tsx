import { useEffect, useRef } from 'react';
import type { ContentBlock, PortfolioEntry } from '../../types/content';
import { toDossier } from '../../lib/board';
import { ImageSlot } from './ImageSlot';

type PhotoAsset = { url?: string; alt?: string };

type DossierPlateProps = {
  entry: PortfolioEntry;
  posLabel: string;
  prevTitle: string;
  nextTitle: string;
  editing: boolean;
  photoBusy: number | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onChange: (next: PortfolioEntry) => void;
  onPickPhoto: (index: number, file: File) => void;
};

function readText(event: { currentTarget: HTMLElement }): string {
  return (event.currentTarget.textContent ?? '').trim();
}

function photoAssetsOf(entry: PortfolioEntry): PhotoAsset[] {
  return Array.isArray(entry.metadata.photoAssets) ? (entry.metadata.photoAssets as PhotoAsset[]) : [];
}

export function DossierPlate({
  entry, posLabel, prevTitle, nextTitle, editing, photoBusy,
  onClose, onPrev, onNext, onChange, onPickPhoto,
}: DossierPlateProps) {
  const dossier = toDossier(entry);
  const closeRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => { closeRef.current?.focus(); }, []);
  useEffect(() => { if (sheetRef.current) sheetRef.current.scrollTop = 0; }, [entry.slug]);

  const photoAssets = photoAssetsOf(entry);
  const photoCount = Math.max(dossier.photos, photoAssets.length);

  const setMeta = (key: string, value: unknown) =>
    onChange({ ...entry, metadata: { ...entry.metadata, [key]: value } });

  const setStat = (index: number, which: 0 | 1, value: string) => {
    const stats = dossier.stats.map((pair) => [...pair] as [string, string]);
    if (!stats[index]) return;
    stats[index][which] = value;
    setMeta('stats', stats);
  };
  const addStat = () => setMeta('stats', [...dossier.stats, ['0', 'label']]);
  const setTag = (index: number, value: string) => {
    const tags = [...dossier.tags];
    tags[index] = value;
    setMeta('tags', tags);
  };
  const addTag = () => setMeta('tags', [...dossier.tags, 'tag']);

  const orderedBlocks = [...entry.blocks].sort((a, b) => a.position - b.position);
  const setBullet = (blockId: string, value: string) => {
    const blocks = entry.blocks.map((block) =>
      block.id === blockId ? { ...block, props: { ...block.props, text: value } } : block,
    );
    onChange({ ...entry, blocks });
  };
  const delBullet = (blockId: string) => {
    const blocks = entry.blocks
      .filter((block) => block.id !== blockId)
      .map((block, position) => ({ ...block, position }));
    onChange({ ...entry, blocks });
  };
  const addBullet = () => {
    const next: ContentBlock = {
      id: crypto.randomUUID(),
      type: 'text',
      position: entry.blocks.length,
      props: { text: 'New line — click to write.' },
      layout: {},
    };
    onChange({ ...entry, blocks: [...entry.blocks, next] });
  };

  const setPhotoCount = (delta: number) => {
    const current = typeof entry.metadata.photos === 'number' ? entry.metadata.photos : dossier.photos;
    setMeta('photos', Math.max(0, current + delta));
  };

  return (
    <div className="dossier" role="presentation">
      <div className="dossier__scrim" onClick={onClose} />
      <div className="dossier__plate" role="dialog" aria-modal="true" aria-label={dossier.title}>
        <div className="dossier__bar">
          <div className="dossier__bar-meta">
            <span className="k">{dossier.kicker}</span>
            <span className="dossier__bar-pos">{posLabel}</span>
          </div>
          <div className="dossier__bar-actions">
            {editing ? <span className="dossier__editflag">editing — click any text</span> : null}
            <button className="pbtn" onClick={onPrev} type="button" aria-label="Anterior">←</button>
            <button className="pbtn" onClick={onNext} type="button" aria-label="Siguiente">→</button>
            <button ref={closeRef} className="pbtn pbtn--close" onClick={onClose} type="button">close · esc</button>
          </div>
        </div>

        <div className="dossier__sheet" ref={sheetRef}>
          <div className="dossier__inner">
            <div className="dossier__crumbs">
              <span contentEditable={editing} suppressContentEditableWarning onBlur={(e) => setMeta('when', readText(e))}>{dossier.when}</span>
              <span className="dot">·</span>
              <span contentEditable={editing} suppressContentEditableWarning onBlur={(e) => setMeta('where', readText(e))}>{dossier.where}</span>
            </div>

            <h2 className="dossier__title" contentEditable={editing} suppressContentEditableWarning onBlur={(e) => onChange({ ...entry, title: readText(e) || entry.title })}>{dossier.title}</h2>
            <p className="dossier__lede" contentEditable={editing} suppressContentEditableWarning onBlur={(e) => onChange({ ...entry, summary: readText(e) })}>{dossier.lede}</p>

            {photoCount > 0 ? (
              <div className="dossier__photos">
                {Array.from({ length: photoCount }).map((_, index) => {
                  const asset = photoAssets[index];
                  const span = index === 0 ? '1 / -1' : 'auto';
                  const height = index === 0 ? 280 : 168;
                  return (
                    <div key={index} style={{ gridColumn: span }}>
                      <div style={{ position: 'relative', width: '100%', height }}>
                        <ImageSlot
                          url={asset?.url}
                          alt={asset?.alt ?? dossier.where}
                          placeholder={dossier.where || 'drop a photo'}
                          editable={editing}
                          busy={photoBusy === index}
                          onPick={(file) => onPickPhoto(index, file)}
                        />
                      </div>
                      <div className="dossier__photo-cap">{dossier.where}{photoCount > 1 ? ` · ${index + 1}` : ''}</div>
                    </div>
                  );
                })}
              </div>
            ) : null}
            {editing ? (
              <div style={{ display: 'flex', gap: 6, margin: '8px 0 0' }}>
                <button className="editadd editadd--sm" type="button" onClick={() => setPhotoCount(1)}>+ photo</button>
                <button className="editadd editadd--sm" type="button" onClick={() => setPhotoCount(-1)}>− photo</button>
              </div>
            ) : null}

            {dossier.stats.length > 0 || editing ? (
              <div className="dossier__stats">
                {dossier.stats.map((pair, index) => (
                  <div key={index}>
                    <b contentEditable={editing} suppressContentEditableWarning onBlur={(e) => setStat(index, 0, readText(e))}>{pair[0]}</b>
                    <span contentEditable={editing} suppressContentEditableWarning onBlur={(e) => setStat(index, 1, readText(e))}>{pair[1]}</span>
                  </div>
                ))}
                {editing ? <button className="editadd editadd--sm" type="button" onClick={addStat}>+ number</button> : null}
              </div>
            ) : null}

            <div className="dossier__bullets">
              {orderedBlocks.map((block) => (
                <div className="bullet" key={block.id}>
                  <p contentEditable={editing} suppressContentEditableWarning onBlur={(e) => setBullet(block.id, readText(e))}>
                    {typeof block.props.text === 'string' ? block.props.text : ''}
                  </p>
                  {editing ? <button className="editdel" type="button" onClick={() => delBullet(block.id)} aria-label="Eliminar línea">×</button> : null}
                </div>
              ))}
              {editing ? <button className="editadd" type="button" onClick={addBullet}>+ add line</button> : null}
            </div>

            {dossier.tags.length > 0 || editing ? (
              <div className="dossier__filed">
                <span className="lbl">filed under</span>
                {dossier.tags.map((tag, index) => (
                  <span className="tag" key={index} contentEditable={editing} suppressContentEditableWarning onBlur={(e) => setTag(index, readText(e))}>{tag}</span>
                ))}
                {editing ? <button className="editadd editadd--sm" type="button" onClick={addTag}>+ tag</button> : null}
              </div>
            ) : null}

            {dossier.links.length > 0 ? (
              <div className="dossier__links">
                {dossier.links.map((link, index) => (
                  <a key={index} href={link[1]} target="_blank" rel="noreferrer">{link[0]} →</a>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="dossier__foot">
          <span onClick={onPrev}>← {prevTitle}</span>
          <span onClick={onNext} style={{ textAlign: 'right' }}>{nextTitle} →</span>
        </div>
      </div>
    </div>
  );
}
