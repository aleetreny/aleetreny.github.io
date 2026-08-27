// The board's furniture, redrawn at phone size.
//
// A photograph on the slate is an object with a position, a rotation and a
// drag handle. On a phone it is a picture in a column, and the only thing
// worth keeping is what made it a photograph rather than an image: the white
// border, the strip of tape, the caption written under it. Same for the loose
// notes. Everything else — coordinates, z-order, editing chrome — belongs to
// the desk and stays there.

import { useState, type CSSProperties } from 'react';
import type { Marginal, Polaroid } from '../../lib/board';
import { isVideoMedia } from '../../lib/image-upload';

/** A deterministic tilt, so the same photo leans the same way on every visit
 *  and the column reads as paper rather than as a gallery. */
function tilt(seed: string, spread = 1.6): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return (((hash % 1000) / 1000) * 2 - 1) * spread;
}

/** `near` is the screen on show and its two neighbours. Off-screen pages sit
 *  behind a transform rather than off the document, and lazy loading through a
 *  transform is a browser-by-browser guess — so the gate is explicit: fourteen
 *  photographs never load to show the first one, and the next screen's picture
 *  is already there when the thumb arrives. */
export function MobilePhoto({ photo, near }: { photo: Polaroid; near: boolean }) {
  // A photograph whose asset has gone is not a photograph, and an empty white
  // frame in the middle of a screen reads as a bug. On the slate the frame is
  // furniture and can stay; in a column it cannot.
  const [failed, setFailed] = useState(false);
  const ratio = photo.h > 0 && photo.w > 0 ? photo.w / photo.h : 4 / 3;
  if (!photo.assetUrl || failed) return null;
  return (
    <figure className="m-photo" style={{ '--tilt': `${tilt(photo.id)}deg` } as CSSProperties}>
      <div className="m-photo__frame">
        {photo.tape ? <span className="m-photo__tape" aria-hidden="true" /> : null}
        <div className="m-photo__window" style={{ aspectRatio: ratio }}>
          {!near ? null : isVideoMedia(photo.assetMediaType, photo.assetUrl) ? (
            <video src={photo.assetUrl} muted loop playsInline autoPlay preload="metadata" onError={() => setFailed(true)} />
          ) : (
            <img src={photo.assetUrl} alt={photo.caption || ''} decoding="async" onError={() => setFailed(true)} />
          )}
        </div>
        {photo.caption ? <figcaption className="m-photo__cap">{photo.caption}</figcaption> : null}
      </div>
    </figure>
  );
}

export function MobileNote({ note }: { note: Marginal }) {
  return (
    <aside
      className={`m-note m-note--${note.style}`}
      style={{ '--tilt': `${tilt(note.id, 1.1)}deg` } as CSSProperties}
    >
      {note.text}
    </aside>
  );
}
