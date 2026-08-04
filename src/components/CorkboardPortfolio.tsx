import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type WheelEvent,
} from 'react';
import type { PortfolioEntry } from '../types/content';
import { ContentBlocks } from './ContentBlocks';

type ViewTransform = { x: number; y: number; scale: number };
type PointerPosition = { x: number; y: number };
type SectionId = 'projects' | 'experience' | 'education' | 'about' | 'contact';

type CorkboardPortfolioProps = {
  entries: PortfolioEntry[];
  error?: string;
  loading: boolean;
  remoteDataEnabled: boolean;
};

type BoardSection = {
  id: SectionId;
  kicker: string;
  title: string;
  subtitle: string;
  entries: PortfolioEntry[];
  previewCount: number;
  className: string;
  style: { left: number; top: number; width: number; transform: string };
};

const MIN_SCALE = 0.42;
const MAX_SCALE = 2.1;

function clampScale(scale: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

function initialTransform(): ViewTransform {
  return window.innerWidth < 600
    ? { x: -42, y: 18, scale: 0.78 }
    : { x: 0, y: 0, scale: 0.9 };
}

function distance(first: PointerPosition, second: PointerPosition) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function centroid(points: PointerPosition[]) {
  const total = points.reduce((sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }), { x: 0, y: 0 });
  return { x: total.x / points.length, y: total.y / points.length };
}

function metadata(entry: PortfolioEntry, key: string): string {
  return typeof entry.metadata[key] === 'string' ? entry.metadata[key] : '';
}

function EntryNote({ entry }: { entry: PortfolioEntry }) {
  const topics = Array.isArray(entry.metadata.topics)
    ? entry.metadata.topics.filter((topic): topic is string => typeof topic === 'string')
    : [];

  return (
    <article className="expanded-entry">
      <span className="expanded-entry__pin" aria-hidden="true" />
      <div className="expanded-entry__meta">
        <span>{metadata(entry, 'organization') || entry.entryType}</span>
        {metadata(entry, 'period') ? <span>{metadata(entry, 'period')}</span> : null}
      </div>
      <h3>{entry.title}</h3>
      <p>{entry.summary}</p>
      <ContentBlocks blocks={entry.blocks} />
      {topics.length > 0 ? (
        <ul className="board-tag-list" aria-label="Temas">
          {topics.map((topic) => <li key={topic}>#{topic}</li>)}
        </ul>
      ) : null}
    </article>
  );
}

function ExpandedSection({
  section,
  onClose,
  returnFocusRef,
}: {
  section: BoardSection;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const focusTarget = returnFocusRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog?.querySelector<HTMLElement>('[data-modal-close]')?.focus();

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;

      const focusable = [...dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )].filter((element) => !element.hidden);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!dialog.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
      focusTarget?.focus();
    };
  }, [onClose, returnFocusRef]);

  return (
    <div className="board-modal" role="presentation" onPointerDown={(event) => {
      if (event.currentTarget === event.target) onClose();
    }}>
      <section
        aria-labelledby="expanded-section-title"
        aria-modal="true"
        className="expanded-cork"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <button
          aria-label="Cerrar sección"
          autoFocus
          className="board-modal__close"
          data-modal-close
          onClick={onClose}
          type="button"
        >
          ×
        </button>
        <div className="expanded-sheet">
          <span className="expanded-sheet__tape" aria-hidden="true" />
          <p className="board-kicker">{section.kicker}</p>
          <h2 id="expanded-section-title">{section.title}</h2>
          <p className="expanded-sheet__subtitle">{section.subtitle}</p>
        </div>

        {section.id === 'contact' ? (
          <div className="contact-notes">
            <a className="contact-note contact-note--mail" href="mailto:alejandrotreny100@gmail.com">
              <span>Escríbeme</span>
              <strong>alejandrotreny100@gmail.com</strong>
            </a>
            <a className="contact-note contact-note--github" href="https://github.com/aleetreny" rel="noreferrer" target="_blank">
              <span>Código y proyectos</span>
              <strong>github.com/aleetreny</strong>
            </a>
          </div>
        ) : (
          <div className={`expanded-grid expanded-grid--${section.id}`}>
            {section.entries.map((entry) => <EntryNote entry={entry} key={entry.id} />)}
          </div>
        )}
      </section>
    </div>
  );
}

export function CorkboardPortfolio({ entries, error, loading, remoteDataEnabled }: CorkboardPortfolioProps) {
  const [transform, setTransform] = useState<ViewTransform>(initialTransform);
  const [expandedId, setExpandedId] = useState<SectionId | null>(null);
  const pointers = useRef(new Map<number, PointerPosition>());
  const lastTrigger = useRef<HTMLElement | null>(null);
  const transformRef = useRef(transform);
  const gesture = useRef<{
    transform: ViewTransform;
    center: PointerPosition;
    distance: number;
  } | null>(null);

  const sections = useMemo<BoardSection[]>(() => {
    const projects = entries.filter((entry) => entry.entryType === 'project' || entry.entryType === 'case-study');
    const experience = entries.filter((entry) => entry.entryType === 'experience');
    const education = entries.filter((entry) => entry.entryType === 'education');
    const notes = entries.filter((entry) => entry.entryType === 'note');
    return [
      {
        id: 'projects',
        kicker: 'Casos pegados al tablero',
        title: 'Proyectos',
        subtitle: 'Modelos, experimentos y productos construidos para convertir datos en decisiones.',
        entries: projects,
        previewCount: 3,
        className: 'board-sticker--mint',
        style: { left: 560, top: 115, width: 430, transform: 'rotate(1.8deg)' },
      },
      {
        id: 'experience',
        kicker: 'Trayectoria',
        title: 'Experiencia',
        subtitle: 'Los lugares donde he aprendido a unir rigor analítico, contexto y ejecución.',
        entries: experience,
        previewCount: 2,
        className: 'board-sticker--blue',
        style: { left: 1080, top: 400, width: 410, transform: 'rotate(-2.2deg)' },
      },
      {
        id: 'education',
        kicker: 'Base académica',
        title: 'Formación',
        subtitle: 'Economía, estadística e inferencia como base para plantear mejores preguntas.',
        entries: education,
        previewCount: 2,
        className: 'board-sticker--yellow',
        style: { left: 105, top: 680, width: 400, transform: 'rotate(-1.4deg)' },
      },
      {
        id: 'about',
        kicker: 'Una nota personal',
        title: 'Sobre mí',
        subtitle: 'Curiosidad cuantitativa, criterio práctico y obsesión por dejar sistemas que otros puedan continuar.',
        entries: notes,
        previewCount: 1,
        className: 'board-sticker--rose',
        style: { left: 650, top: 770, width: 440, transform: 'rotate(2.5deg)' },
      },
      {
        id: 'contact',
        kicker: '¿Hablamos?',
        title: 'Contacto',
        subtitle: 'Si tienes un problema interesante entre datos y decisiones, deja una nota.',
        entries: [],
        previewCount: 0,
        className: 'board-sticker--cream',
        style: { left: 1320, top: 90, width: 360, transform: 'rotate(3deg)' },
      },
    ];
  }, [entries]);

  const expandedSection = sections.find((section) => section.id === expandedId) ?? null;

  const openSection = useCallback((id: SectionId, trigger: HTMLElement) => {
    lastTrigger.current = trigger;
    setExpandedId(id);
  }, []);

  const closeSection = useCallback(() => setExpandedId(null), []);

  function applyTransform(next: ViewTransform) {
    transformRef.current = next;
    setTransform(next);
  }

  function resetGesture() {
    const points = [...pointers.current.values()];
    if (points.length === 0) {
      gesture.current = null;
      return;
    }
    gesture.current = {
      transform: transformRef.current,
      center: centroid(points),
      distance: points.length > 1 ? distance(points[0], points[1]) : 0,
    };
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('[data-board-interactive]')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    resetGesture();
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId) || !gesture.current) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...pointers.current.values()];
    const currentCenter = centroid(points);
    const start = gesture.current;

    if (points.length === 1) {
      applyTransform({
        ...start.transform,
        x: start.transform.x + currentCenter.x - start.center.x,
        y: start.transform.y + currentCenter.y - start.center.y,
      });
      return;
    }

    const nextScale = clampScale(start.transform.scale * (distance(points[0], points[1]) / start.distance));
    const worldX = (start.center.x - start.transform.x) / start.transform.scale;
    const worldY = (start.center.y - start.transform.y) / start.transform.scale;
    applyTransform({
      scale: nextScale,
      x: currentCenter.x - worldX * nextScale,
      y: currentCenter.y - worldY * nextScale,
    });
  }

  function handlePointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    resetGesture();
  }

  function zoomAt(clientX: number, clientY: number, nextScale: number) {
    const current = transformRef.current;
    const scale = clampScale(nextScale);
    const worldX = (clientX - current.x) / current.scale;
    const worldY = (clientY - current.y) / current.scale;
    applyTransform({ x: clientX - worldX * scale, y: clientY - worldY * scale, scale });
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    zoomAt(event.clientX, event.clientY, transformRef.current.scale * Math.exp(-event.deltaY * 0.0012));
  }

  return (
    <main
      aria-label="Portfolio de Alejandro Treny en un tablero de corcho interactivo"
      className="corkboard"
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        const step = event.shiftKey ? 120 : 55;
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-'].includes(event.key)) return;
        event.preventDefault();
        if (event.key === 'ArrowLeft') applyTransform({ ...transformRef.current, x: transformRef.current.x + step });
        if (event.key === 'ArrowRight') applyTransform({ ...transformRef.current, x: transformRef.current.x - step });
        if (event.key === 'ArrowUp') applyTransform({ ...transformRef.current, y: transformRef.current.y + step });
        if (event.key === 'ArrowDown') applyTransform({ ...transformRef.current, y: transformRef.current.y - step });
        if (event.key === '+' || event.key === '=') zoomAt(window.innerWidth / 2, window.innerHeight / 2, transformRef.current.scale * 1.15);
        if (event.key === '-') zoomAt(window.innerWidth / 2, window.innerHeight / 2, transformRef.current.scale / 1.15);
      }}
      onPointerCancel={handlePointerEnd}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onWheel={handleWheel}
      tabIndex={0}
    >
      <div className="corkboard__grain" aria-hidden="true" />
      <header className="board-toolbar" data-board-interactive inert={Boolean(expandedSection)}>
        <div>
          <strong>Alejandro Treny</strong>
          <span>{remoteDataEnabled ? 'tablero conectado' : 'portfolio / tablero abierto'}</span>
        </div>
        <div className="board-toolbar__controls" aria-label="Controles del tablero">
          <button aria-label="Alejar" onClick={() => zoomAt(window.innerWidth / 2, window.innerHeight / 2, transformRef.current.scale / 1.2)} type="button">−</button>
          <output aria-label="Nivel de zoom">{Math.round(transform.scale * 100)}%</output>
          <button aria-label="Acercar" onClick={() => zoomAt(window.innerWidth / 2, window.innerHeight / 2, transformRef.current.scale * 1.2)} type="button">+</button>
          <button className="board-toolbar__reset" onClick={() => applyTransform(initialTransform())} type="button">Centrar</button>
        </div>
      </header>

      <div className="board-hint" data-board-interactive inert={Boolean(expandedSection)}>
        <span aria-hidden="true">↔</span>
        arrastra para explorar · pellizca o usa la rueda para acercar
      </div>

      {loading ? <div className="board-loading" role="status">Colocando notas en el tablero…</div> : null}
      {error ? <div className="board-error" role="alert">{error}</div> : null}

      {!loading ? (
        <div
          className="board-world"
          inert={Boolean(expandedSection)}
          style={{ transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})` }}
        >
          <button
            aria-label="Abrir presentación de Alejandro"
            className="board-intro"
            data-board-interactive
            onClick={(event) => openSection('about', event.currentTarget)}
            style={{ left: 90, top: 100, transform: 'rotate(-2.2deg)' }}
            type="button"
          >
            <span className="board-intro__tape" aria-hidden="true" />
            <span className="board-kicker">Estadística · datos · producto</span>
            <strong>Modelos rigurosos,<br />decisiones que se<br />pueden explicar.</strong>
            <span>Soy Alejandro. Este tablero reúne los proyectos, experiencias y preguntas que me han traído hasta aquí.</span>
            <em>Toca cualquier nota para ampliarla →</em>
          </button>

          {sections.map((section) => (
            <button
              aria-label={`${section.title}: abrir sección`}
              className={`board-sticker ${section.className}`}
              data-board-interactive
              data-section={section.id}
              key={section.id}
              onClick={(event) => openSection(section.id, event.currentTarget)}
              style={section.style}
              type="button"
            >
              <span className="board-pin" aria-hidden="true" />
              <span className="board-kicker">{section.kicker}</span>
              <strong className="board-sticker__title">{section.title}</strong>
              <span className="board-sticker__subtitle">{section.subtitle}</span>
              {section.entries.length > 0 ? (
                <ul>
                  {section.entries.slice(0, section.previewCount).map((entry) => (
                    <li key={entry.id}>
                      <span>{entry.title}</span>
                      {metadata(entry, 'organization') ? <small>{metadata(entry, 'organization')}</small> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
              <span className="board-sticker__open">
                {section.entries.length > section.previewCount
                  ? `Abrir sección · +${section.entries.length - section.previewCount} más`
                  : 'Abrir sección'}
              </span>
            </button>
          ))}

          <div className="board-doodle board-doodle--arrow" aria-hidden="true">↗</div>
          <div className="board-doodle board-doodle--formula" aria-hidden="true">ŷ = f(x) + ε</div>
          <div className="board-paperclip" aria-hidden="true">⌇</div>
        </div>
      ) : null}

      {expandedSection ? (
        <ExpandedSection
          onClose={closeSection}
          returnFocusRef={lastTrigger}
          section={expandedSection}
        />
      ) : null}
    </main>
  );
}
