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
type SectionId =
  | 'research'
  | 'civic'
  | 'ai'
  | 'products'
  | 'experiments'
  | 'career'
  | 'education'
  | 'community'
  | 'profile'
  | 'contact';

type CorkboardPortfolioProps = {
  entries: PortfolioEntry[];
  error?: string;
  loading: boolean;
  remoteDataEnabled: boolean;
};

type BoardSection = {
  id: SectionId;
  index: string;
  kicker: string;
  title: string;
  subtitle: string;
  entries: PortfolioEntry[];
  previewCount: number;
  tone: string;
  style: { left: number; top: number; width: number; transform: string };
};

const MIN_SCALE = 0.34;
const MAX_SCALE = 2.2;
const BOARD_WIDTH = 2860;
const BOARD_HEIGHT = 1940;

const sectionBlueprints: Array<Omit<BoardSection, 'entries'>> = [
  {
    id: 'research',
    index: '01',
    kicker: 'Sistemas de conocimiento',
    title: 'Research systems',
    subtitle: 'Mapear literatura, medir estructuras y construir instrumentos para pensar mejor.',
    previewCount: 3,
    tone: 'oxide',
    style: { left: 820, top: 105, width: 500, transform: 'rotate(0.4deg)' },
  },
  {
    id: 'ai',
    index: '02',
    kicker: 'Modelos en producto',
    title: 'AI / interfaces',
    subtitle: 'IA que vive en una interacción concreta, con límites visibles y propósito.',
    previewCount: 3,
    tone: 'ink',
    style: { left: 1450, top: 150, width: 470, transform: 'rotate(-1deg)' },
  },
  {
    id: 'civic',
    index: '03',
    kicker: 'Ciudades legibles',
    title: 'Civic intelligence',
    subtitle: 'Datos urbanos convertidos en decisiones sobre comercio, vivienda y movilidad.',
    previewCount: 3,
    tone: 'signal',
    style: { left: 2070, top: 100, width: 500, transform: 'rotate(0.8deg)' },
  },
  {
    id: 'products',
    index: '04',
    kicker: 'De pipeline a uso',
    title: 'Products in the wild',
    subtitle: 'Herramientas que se actualizan, guardan estado y resuelven una tarea completa.',
    previewCount: 3,
    tone: 'bone',
    style: { left: 230, top: 730, width: 510, transform: 'rotate(-0.7deg)' },
  },
  {
    id: 'experiments',
    index: '05',
    kicker: 'Física para tocar',
    title: 'Interactive experiments',
    subtitle: 'Astrofísica, audio y simulación tratados como materiales de interfaz.',
    previewCount: 3,
    tone: 'graphite',
    style: { left: 900, top: 760, width: 500, transform: 'rotate(1.1deg)' },
  },
  {
    id: 'career',
    index: '06',
    kicker: 'Trabajo aplicado',
    title: 'Career field notes',
    subtitle: 'Rigor cuantitativo dentro de operaciones, finanzas y equipos reales.',
    previewCount: 3,
    tone: 'ledger',
    style: { left: 1570, top: 780, width: 480, transform: 'rotate(-0.4deg)' },
  },
  {
    id: 'education',
    index: '07',
    kicker: 'Base y reconocimientos',
    title: 'Education / awards',
    subtitle: 'Economía para el contexto; estadística para la evidencia.',
    previewCount: 3,
    tone: 'oxide',
    style: { left: 2190, top: 770, width: 470, transform: 'rotate(0.5deg)' },
  },
  {
    id: 'community',
    index: '08',
    kicker: 'Fuera de la pantalla',
    title: 'Community / culture',
    subtitle: 'Coordinar personas, escenarios e ideas también es construir sistemas.',
    previewCount: 2,
    tone: 'signal',
    style: { left: 500, top: 1350, width: 520, transform: 'rotate(0.8deg)' },
  },
  {
    id: 'profile',
    index: '09',
    kicker: 'Perfil de trabajo',
    title: 'Numbers with context',
    subtitle: 'Estadística aplicada, producto y una curiosidad bastante difícil de apagar.',
    previewCount: 1,
    tone: 'bone',
    style: { left: 1210, top: 1360, width: 520, transform: 'rotate(-0.6deg)' },
  },
  {
    id: 'contact',
    index: '10',
    kicker: 'Canal abierto',
    title: 'Contact / links',
    subtitle: 'Una conversación interesante suele ser el mejor punto de partida.',
    previewCount: 0,
    tone: 'ink',
    style: { left: 1940, top: 1370, width: 520, transform: 'rotate(0.7deg)' },
  },
];

function clampScale(scale: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

function initialTransform(): ViewTransform {
  return window.innerWidth < 680
    ? { x: -20, y: 84, scale: 0.52 }
    : { x: 242, y: 86, scale: 0.68 };
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

function formatCoordinate(value: number) {
  const rounded = Math.round(value);
  return `${rounded < 0 ? '−' : '+'}${Math.abs(rounded).toString().padStart(4, '0')}`;
}

function sectionForEntry(entry: PortfolioEntry): SectionId {
  const explicitSection = metadata(entry, 'section');
  if (sectionBlueprints.some((section) => section.id === explicitSection)) return explicitSection as SectionId;
  if (entry.entryType === 'experience') return 'career';
  if (entry.entryType === 'education') return 'education';
  if (entry.entryType === 'note') return 'profile';
  return 'products';
}

function EntryNote({ entry, number }: { entry: PortfolioEntry; number: number }) {
  const topics = Array.isArray(entry.metadata.topics)
    ? entry.metadata.topics.filter((topic): topic is string => typeof topic === 'string')
    : [];
  const projectUrl = metadata(entry, 'projectUrl');
  const repositoryUrl = metadata(entry, 'repositoryUrl');

  return (
    <article className="expanded-entry">
      <div className="expanded-entry__registry" aria-hidden="true">
        <span>{String(number).padStart(2, '0')}</span>
        <span>{entry.slug.slice(0, 12)}</span>
      </div>
      <div className="expanded-entry__meta">
        <span>{metadata(entry, 'organization') || entry.entryType}</span>
        {metadata(entry, 'period') ? <span>{metadata(entry, 'period')}</span> : null}
      </div>
      <h3>{entry.title}</h3>
      {metadata(entry, 'signal') ? <strong className="expanded-entry__signal">{metadata(entry, 'signal')}</strong> : null}
      <p>{entry.summary}</p>
      <ContentBlocks blocks={entry.blocks} />
      {topics.length > 0 ? (
        <ul className="board-tag-list" aria-label="Temas">
          {topics.map((topic) => <li key={topic}>{topic}</li>)}
        </ul>
      ) : null}
      {projectUrl || repositoryUrl ? (
        <div className="expanded-entry__links">
          {projectUrl ? <a href={projectUrl} rel="noreferrer" target="_blank">Abrir proyecto ↗</a> : null}
          {repositoryUrl ? <a href={repositoryUrl} rel="noreferrer" target="_blank">Ver código ↗</a> : null}
        </div>
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
        <header className="expanded-cork__bar">
          <span>AT / ARCHIVE / {section.index}</span>
          <span>{section.entries.length.toString().padStart(2, '0')} registros</span>
          <button
            aria-label="Cerrar sección"
            autoFocus
            className="board-modal__close"
            data-modal-close
            onClick={onClose}
            type="button"
          >
            Cerrar ×
          </button>
        </header>
        <div className={`expanded-sheet expanded-sheet--${section.tone}`}>
          <span className="expanded-sheet__index">{section.index}</span>
          <p className="board-kicker">{section.kicker}</p>
          <h2 id="expanded-section-title">{section.title}</h2>
          <p className="expanded-sheet__subtitle">{section.subtitle}</p>
        </div>

        {section.id === 'contact' ? (
          <div className="contact-notes">
            <a className="contact-note" href="mailto:alejandrotreny100@gmail.com">
              <span>01 / Correo</span>
              <strong>alejandrotreny100@gmail.com</strong>
              <em>Escribir mensaje ↗</em>
            </a>
            <a className="contact-note" href="https://github.com/aleetreny" rel="noreferrer" target="_blank">
              <span>02 / GitHub</span>
              <strong>github.com/aleetreny</strong>
              <em>Explorar código ↗</em>
            </a>
            <a className="contact-note" href="https://es.linkedin.com/in/aleetreny" rel="noreferrer" target="_blank">
              <span>03 / LinkedIn</span>
              <strong>linkedin.com/in/aleetreny</strong>
              <em>Ver trayectoria ↗</em>
            </a>
          </div>
        ) : (
          <div className={`expanded-grid expanded-grid--${section.id}`}>
            {section.entries.map((entry, index) => <EntryNote entry={entry} key={entry.id} number={index + 1} />)}
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

  const sections = useMemo<BoardSection[]>(() => sectionBlueprints.map((section) => ({
    ...section,
    entries: entries.filter((entry) => sectionForEntry(entry) === section.id),
  })), [entries]);

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

  function focusSection(section: BoardSection) {
    const scale = window.innerWidth < 680 ? 0.68 : 0.88;
    const cardCenterX = section.style.left + section.style.width / 2;
    const cardCenterY = section.style.top + 245;
    applyTransform({
      scale,
      x: window.innerWidth / 2 - cardCenterX * scale,
      y: window.innerHeight / 2 - cardCenterY * scale,
    });
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    zoomAt(event.clientX, event.clientY, transformRef.current.scale * Math.exp(-event.deltaY * 0.0012));
  }

  return (
    <main
      aria-label="Portfolio de Alejandro Treny en un tablero de archivo interactivo"
      className="corkboard"
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        const step = event.shiftKey ? 140 : 60;
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
      <div className="corkboard__coordinates" aria-hidden="true" />

      <header className="board-toolbar" data-board-interactive inert={Boolean(expandedSection)}>
        <div className="board-toolbar__identity">
          <span className="board-toolbar__monogram">AT</span>
          <div>
            <strong>Alejandro Treny</strong>
            <span>{remoteDataEnabled ? 'Live archive / Neon connected' : 'Public archive / local copy'}</span>
          </div>
        </div>
        <div className="board-toolbar__controls" aria-label="Controles del tablero">
          <button aria-label="Alejar" onClick={() => zoomAt(window.innerWidth / 2, window.innerHeight / 2, transformRef.current.scale / 1.2)} type="button">−</button>
          <output aria-label="Nivel de zoom">{Math.round(transform.scale * 100)}%</output>
          <button aria-label="Acercar" onClick={() => zoomAt(window.innerWidth / 2, window.innerHeight / 2, transformRef.current.scale * 1.2)} type="button">+</button>
          <button className="board-toolbar__reset" onClick={() => applyTransform(initialTransform())} type="button">Vista general</button>
        </div>
      </header>

      <nav aria-label="Índice del tablero" className="board-index" data-board-interactive inert={Boolean(expandedSection)}>
        <span className="board-index__label">Index / 10 files</span>
        <div>
          {sections.map((section) => (
            <button key={section.id} onClick={() => focusSection(section)} type="button">
              <span>{section.index}</span>{section.title}
            </button>
          ))}
        </div>
      </nav>

      <div className="board-status" data-board-interactive inert={Boolean(expandedSection)}>
        <span>X {formatCoordinate(-transform.x / transform.scale)}</span>
        <span>Y {formatCoordinate(-transform.y / transform.scale)}</span>
        <span>Drag / wheel / pinch</span>
      </div>

      {loading ? <div className="board-loading" role="status">Indexando archivos…</div> : null}
      {error ? <div className="board-error" role="alert">{error}</div> : null}

      {!loading ? (
        <div
          className="board-world"
          inert={Boolean(expandedSection)}
          style={{
            height: BOARD_HEIGHT,
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
            width: BOARD_WIDTH,
          }}
        >
          <div className="board-axis board-axis--x" aria-hidden="true">000 · 500 · 1000 · 1500 · 2000 · 2500</div>
          <div className="board-axis board-axis--y" aria-hidden="true">000 · 500 · 1000 · 1500</div>

          <button
            aria-label="Abrir perfil de Alejandro"
            className="board-intro"
            data-board-interactive
            onClick={(event) => openSection('profile', event.currentTarget)}
            style={{ left: 105, top: 105, transform: 'rotate(-0.8deg)' }}
            type="button"
          >
            <span className="board-intro__register">DOSSIER / AT-1999—∞</span>
            <span className="board-kicker">Quantitative economics · applied statistics · product</span>
            <strong>NUMBERS<br />WITH<br /><em>CONTEXT.</em></strong>
            <span className="board-intro__copy">Construyo modelos, interfaces y sistemas de datos para que una pregunta compleja termine en una decisión que se pueda entender.</span>
            <span className="board-intro__footer">Madrid / open file / tocar para leer ↗</span>
          </button>

          {sections.map((section) => (
            <button
              aria-label={`${section.title}: abrir sección`}
              className={`board-sticker board-sticker--${section.tone}`}
              data-board-interactive
              data-section={section.id}
              key={section.id}
              onClick={(event) => openSection(section.id, event.currentTarget)}
              style={section.style}
              type="button"
            >
              <span className="board-sticker__tape" aria-hidden="true" />
              <span className="board-sticker__index">{section.index}</span>
              <span className="board-kicker">{section.kicker}</span>
              <strong className="board-sticker__title">{section.title}</strong>
              <span className="board-sticker__subtitle">{section.subtitle}</span>
              {section.entries.length > 0 ? (
                <ol>
                  {section.entries.slice(0, section.previewCount).map((entry, index) => (
                    <li key={entry.id}>
                      <small>{String(index + 1).padStart(2, '0')}</small>
                      <span>{entry.title}</span>
                      {metadata(entry, 'signal') ? <em>{metadata(entry, 'signal')}</em> : null}
                    </li>
                  ))}
                </ol>
              ) : (
                <span className="board-sticker__contact">MAIL / GITHUB / LINKEDIN</span>
              )}
              <span className="board-sticker__open">
                Abrir archivo
                <em>{section.entries.length > section.previewCount ? `+${section.entries.length - section.previewCount}` : '↗'}</em>
              </span>
            </button>
          ))}

          <div className="board-annotation board-annotation--north" aria-hidden="true">EVIDENCE → INTERFACE → DECISION</div>
          <div className="board-annotation board-annotation--south" aria-hidden="true">NOT EVERYTHING VALUABLE FITS IN A SPREADSHEET.</div>
          <div className="board-crosshair" aria-hidden="true"><span /><span /></div>
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
