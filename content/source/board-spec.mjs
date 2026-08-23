// Canonical description of the working-board cover: theme, cards, groupings.
// This is the reproducible source for the seed fixtures. Once seeded into Neon,
// the owner edits everything from the site itself (theme, layout, text, photos)
// and this file only matters for a clean re-seed or the offline safe copy.

// Board is authored on a fixed canvas; the app fits/zooms it to any screen.
export const BOARD = { width: 2540, height: 2290 };

// Default visual theme. Every value here is editable live from the owner theme
// panel and stored in site_settings.theme.
export const THEME = {
  boardStyle: 'slate', // blueprint | cork | graphite | slate | paper | midnight | sunset
  chaos: 1, // 0..2 — how much the cards are rotated
  showMarginalia: true,
  cardRadius: 0, // px — corner rounding applied to every surface
  // Everything behind the cards: the wall the slate hangs on, the slate itself
  // and its hardware. All of it is editable from the owner theme panel.
  backdrop: {
    wall: 'plaster', // plaster | concrete | studio | ink | warm | moss | void | custom
    wallColor: '#232629', // custom wall — centre
    wallColor2: '#0a0b0d', // custom wall — edge
    grain: 0.5, // 0..1 plaster grain
    vignette: 0.55, // 0..1 corner darkening
    plate: true, // false → the board texture fills the viewport (pre-slate look)
    plateMargin: 58, // px the slate reaches beyond the board box
    frame: 10, // px inset frame on the slate
    plateShadow: 1, // 0..1.6 multiplier on the slate's drop shadow
    studs: true,
    studSize: 22,
    studInset: 34, // px the studs sit outside the board box
    grid: 'plate', // plate | viewport | off
    gridScale: 1,
  },
  // How a card is built as an object.
  cards: {
    edge: 'hairline', // hairline | none | heavy | double | dashed | inked
    shadow: 1, // 0..2.5 multiplier on the drop shadow
    grain: 0, // 0..1 paper grain over the surface
    padding: 22, // px inside a card
    fastener: 'none', // none | tape | pin | clip | staple
    lift: 'none', // none | raise | straighten | tilt | glow — on hover
    rowContrast: 0.5, // 0..1 how strongly a drawer row is tinted
    rowRule: 3, // px accent rule down the left of a row
  },
  // The full-page article a card opens into.
  dossier: {
    width: 860, // px plate width
    measure: 60, // ch reading measure
    bodyFace: 'display', // display | mono
    bodySize: 16.5,
    bodyLeading: 1.66,
    titleSize: 46,
    titleWeight: 800,
    titleCase: 'none', // none | upper | lower
    titleTracking: -0.03, // em
    lede: 'italic', // italic | plain | large | kicker
    dropCap: false,
    numbered: false,
    blockGap: 18, // px between blocks
    enter: 'plate', // plate | fade | rise | sheet | none
    scrim: 0.78, // 0..1 darkness behind the plate
    scrimBlur: 5, // px
    centred: false,
  },
  fonts: {
    display: "'Bricolage Grotesque', system-ui, sans-serif",
    mono: "'IBM Plex Mono', ui-monospace, monospace",
    scale: 1,
    displayWeight: 700,
    tracking: 0, // em, added to every display letter-spacing
  },
  colors: {
    accent: 'oklch(0.5 0.13 45)', // rust — links, work accents
    accent2: 'oklch(0.62 0.16 250)', // blue — "the odd one" markers
    signal: 'oklch(0.78 0.14 66)', // amber — now / hackathons
    signalSoft: 'oklch(0.82 0.11 74)',
    lab: 'oklch(0.75 0.1 220)', // cool blue — lab bench
    paper: '#fbf7ef',
    paperWarm: '#faf3e6',
    paperCream: '#efe7d4',
    ink: '#17150f',
    dark: '#171510',
    slate: '#1d2733',
    slateInk: '#e6eef6',
    darkInk: '#f3ecdd',
  },
};

// Which drawer each dossier belongs to, in display order. Drives the cover
// lists and each entry's metadata.group / metadata.order.
export const GROUPS = {
  work: ['siemens', 'accenture', 'tropical', 'ey', 'frulogy'],
  edu: ['ucl', 'uc3m', 'uma', 'erasmus-sk', 'languages'],
  lab: ['lab-l1', 'lab-flows', 'lab-grayscott', 'lab-epidemic', 'lab-kepler', 'lab-particles', 'lab-ica', 'lab-qtrading'],
  vol: ['alda', 'eye2025', 'tedx', 'startup-summit', 'erasmus-lt', 'erasmus-bg', 'small-vol'],
  hack: ['hack-malaga', 'hack-diputacion', 'hack-madrid', 'hack-accenture', 'photo-prize', 'mvp-hidro', 'mvp-recycling'],
  repos: ['localizate', 'arraigo', 'vexillology', 'mapping-science', 'scholar-pulse', 'hollywood', 'cabicity', 'atlas', 'small-repos'],
  travel: ['w-paraguay', 'w-norway', 'w-slovakia', 'w-nordics', 'w-uk', 'w-usa', 'w-austria', 'w-czech', 'w-hungary', 'w-lithuania', 'w-bulgaria', 'w-france', 'w-benelux', 'w-italy', 'w-croatia', 'w-greece', 'w-portugal', 'w-morocco', 'w-canarias', 'w-nevada', 'w-andalucia'],
  random: ['garden', 'telescope', 'racket', 'apocalypse', 'genome', 'investing', 'lasik', 'podcast', 'diary'],
  contact: ['contact'],
};

// Human label for each default list — the owner can rename or delete any of
// these, and add new ones, once the board is live.
export const GROUP_LABELS = {
  work: 'Paid work', edu: 'Schooling', lab: 'Lab bench', vol: 'Unpaid',
  hack: 'Hackathons & prizes', repos: 'The workshop', travel: 'Field log',
  random: 'The drawer', contact: 'Reachable',
};

// The list names are part of the board copy too. Keep the English source above
// for single-language forks, and provide the authored Spanish labels when the
// bilingual fixture is built so overflow panels never fall back to English.
export const GROUP_LABELS_ES = {
  work: 'Trabajo remunerado', edu: 'Estudios', lab: 'Laboratorio', vol: 'Voluntariado',
  hack: 'Hackatones y premios', repos: 'El taller', travel: 'Bitácora de viajes',
  random: 'El cajón', contact: 'Contacto',
};

// entry_type per group (DB constraint: project|case-study|experience|education|note|custom)
export const GROUP_ENTRY_TYPE = {
  work: 'experience',
  edu: 'education',
  lab: 'project',
  vol: 'experience',
  hack: 'project',
  repos: 'project',
  travel: 'note',
  random: 'note',
  contact: 'note',
};
export const ENTRY_TYPE_OVERRIDE = { frulogy: 'project' };

// Two-letter country codes for the field-log rows (compact travel drawer).
export const TRAVEL_CODES = {
  'w-paraguay': 'PY', 'w-norway': 'NO', 'w-slovakia': 'SK', 'w-nordics': 'SE',
  'w-uk': 'UK', 'w-usa': 'US', 'w-austria': 'AT', 'w-czech': 'CZ',
  'w-hungary': 'HU', 'w-lithuania': 'LT', 'w-bulgaria': 'BG', 'w-france': 'FR',
  'w-benelux': 'BE', 'w-italy': 'IT', 'w-croatia': 'HR', 'w-greece': 'GR',
  'w-portugal': 'PT', 'w-morocco': 'MA', 'w-canarias': 'IC', 'w-nevada': '❄',
  'w-andalucia': 'ES',
};

// The cover cards. `x,y,rot,w` are defaults; owner drags persist to
// site_settings['board.layout'] and override these. `tone` selects a themed
// surface so a theme colour change restyles every card of that tone.
export const CARDS = [
  {
    id: 'hero', type: 'hero', jump: 'me', x: 110, y: 110, rot: 0, w: 620,
    kicker: 'the working board · everything, on purpose',
    name: 'Alejandro\nTreny',
    tags: ['statistician', 'data scientist', { label: 'compulsive noticer', accent: true }],
    intro: 'I fit models for a living and I have kept a diary about it every week for five years. Málaga made me, Madrid pays me, London gets me next.',
    hint: 'This board is the index, not the summary — I have a phobia of leaving things out. Tap any line and it opens the full page. Drag the paper, pinch or scroll to zoom.',
  },
  {
    id: 'now', type: 'now', jump: 'now', x: 790, y: 130, rot: 1.2, w: 400, tone: 'amber',
    label: 'currently', current: 'siemens', nextLabel: 'next', next: 'ucl',
    currentTitle: 'Data Scientist\n@ Siemens Energy',
    currentSub: 'Cash-flow forecasting for the Spanish HQ. GAMs against XGBoost, then squashed into a dashboard a director reads in eight seconds. Also my MSc thesis.',
    nextTitle: 'MSc Data Science & ML, UCL',
    nextSub: 'Oct 2026 · Kareema Excellence Grant, €45k',
  },
  {
    id: 'work', type: 'drawer', jump: 'work', group: 'work', x: 110, y: 640, rot: -0.7, w: 620, tone: 'paper',
    kicker: 'drawer 01 — paid work', title: 'Where the numbers\nhad consequences', layout: 'list', maxItems: 4,
    stats: [['+7%', 'EBITDA, 8 months'], ['×2', 'audit throughput'], ['€90M', 'accounts reviewed'], ['12M kg', 'fruit modelled']],
  },
  {
    id: 'edu', type: 'drawer', jump: 'edu', group: 'edu', x: 110, y: 1090, rot: 0.6, w: 620, tone: 'dark',
    kicker: 'drawer 02 — schooling', title: 'Marks I keep\nbringing up', layout: 'list', maxItems: 4,
    subtitle: 'I spent years arguing that memorising a book is not learning. Then I went and finished top 10% of three degrees, so nobody could use that against the argument.',
  },
  {
    id: 'lab', type: 'drawer', jump: 'lab', group: 'lab', x: 110, y: 1545, rot: -1, w: 620, tone: 'slate',
    kicker: 'drawer 03 — lab bench', title: 'Things I built because\nthe maths was pretty', layout: 'grid', maxItems: 6, sweep: true,
    tech: ['R', 'Python', 'SQL', 'PyTorch', 'XGBoost', 'Quarto', 'Power BI', 'Stochastic processes'],
  },
  {
    id: 'vol', type: 'drawer', jump: 'vol', group: 'vol', x: 790, y: 598, rot: -1.6, w: 400, tone: 'paper',
    kicker: 'drawer 04 — unpaid', title: 'Rooms I helped\nfill up', layout: 'compact', maxItems: 4,
  },
  {
    id: 'hack', type: 'drawer', jump: 'hack', group: 'hack', x: 790, y: 1160, rot: 1.7, w: 400, tone: 'amber',
    kicker: 'drawer 05 — 48-hour habits', title: 'Hackathons\n& trophies', layout: 'compact', maxItems: 4,
  },
  {
    id: 'pod', type: 'spotlight', jump: 'pod', open: 'podcast', x: 790, y: 1730, rot: -0.9, w: 400, tone: 'paperWarm',
    kicker: 'drawer 06 — on the air', title: 'Un Poco\nAbsurdo',
    blurb: 'Tech and philosophy, named accurately. 100+ listeners an episode, five stars, three months in.',
    waveform: true, footer: ['100+ / ep', '★★★★★', 'read more →'],
  },
  {
    id: 'repos', type: 'drawer', jump: 'repos', group: 'repos', x: 1250, y: 120, rot: 1, w: 450, tone: 'paper',
    kicker: 'drawer 07 — the workshop', title: 'Built for fun,\nshipped anyway', layout: 'notes', maxItems: 5,
    intro: 'None of this is a job. It is what happens when a question refuses to leave me alone on a Tuesday night.',
    footerLink: ['github.com/aleetreny →', 'https://github.com/aleetreny'],
  },
  {
    id: 'travel', type: 'drawer', jump: 'travel', group: 'travel', x: 1250, y: 1100, rot: -1.2, w: 450, tone: 'paper',
    kicker: 'drawer 08 — field log', title: 'Places that\nrearranged me', layout: 'atlas', maxItems: 8,
    intro: 'I rate cities by picnic-ability, density of open notebooks and weekly re-enchantment. It is a real index. It lives in the Nordics.',
  },
  {
    id: 'contact', type: 'contact', jump: 'contact', open: 'contact', x: 1720, y: 1900, rot: 1.4, w: 450, tone: 'dark',
    kicker: 'drawer 09 — reachable', title: 'Say something\nstrange',
    links: [
      ['alejandrotreny100@gmail.com', 'mailto:alejandrotreny100@gmail.com'],
      ['github.com/aleetreny', 'https://github.com/aleetreny'],
      ['linkedin.com/in/aleetreny', 'https://linkedin.com/in/aleetreny'],
    ],
    note: 'Spanish, French, English. Fastest reply if your message contains a question nobody has asked me before.',
  },
  {
    id: 'diary', type: 'spotlight', jump: 'diary', open: 'diary', x: 1750, y: 110, rot: -1.8, w: 430, tone: 'paperCream',
    kicker: 'drawer 10 — the long project', title: 'Five years of a\nweekly diary',
    blurb: 'Around 480 entries, each dated and star-rated, unbroken since April 2021. The longest-running dataset I own, and the reason this board sounds like me. Not published — it is the source, not the product.',
    grid: [['~480', 'entries'], ['5', 'years unbroken'], ['187', 'cambridge C1'], ['20', 'repos, mostly nights']],
    ruled: true, bars: true, barCaption: 'mean weekly rating, by month · read more →',
  },
  {
    id: 'random', type: 'drawer', jump: 'random', group: 'random', x: 1750, y: 620, rot: 1.6, w: 430, tone: 'slate',
    kicker: 'drawer 11 — the drawer', title: 'Things with\nno CV line', layout: 'compact', maxItems: 5,
    footer: 'Also: sci-fi and fantasy (Douglas Adams is non-negotiable), board games, Asian food, and one cricket eaten at a TEDx. I do not eat avocado.',
  },
  {
    id: 'langs', type: 'sticker', open: 'languages', x: 2214, y: 1852, rot: -2.6, w: 300, tone: 'paperCream',
    kicker: 'sticker — spoken', title: 'Three\nlanguages',
    // [code, level, filled marks out of five] — structure, not prose, so the
    // translator leaves it alone exactly as it leaves `stats` alone.
    langs: [
      ['ES', 'native · Málaga', 5],
      ['FR', 'native · at home', 5],
      ['EN', 'C1 Cambridge · 187', 4],
    ],
    note: 'The Málaga humour does not survive the crossing. I rebuild the jokes in each one.',
  },
];

// Instant photos — draggable, with a fillable photo slot each.
export const POLAROIDS = [
  { id: 'pola-1', x: 1750, y: 1390, rot: 2.6, w: 280, h: 240, caption: 'Asunción', hint: 'drop a photo', tape: true, placeholder: 'Paraguay · volunteering' },
  { id: 'pola-2', x: 2210, y: 170, rot: -2.8, w: 280, h: 240, caption: 'Norway, above the line', placeholder: 'fjords / aurora / snowboard' },
  { id: 'pola-3', x: 2210, y: 640, rot: 1.8, w: 280, h: 200, caption: 'Ten thousand Europeans', placeholder: 'EYE2025 / Strasbourg' },
  { id: 'pola-4', x: 2210, y: 1060, rot: -1.6, w: 280, h: 200, caption: 'Almayate, harvest', placeholder: 'the vegetable patch' },
];

// Sticky marginalia — small notes, toggled by theme.showMarginalia.
export const MARGINALIA = [
  { id: 'note-1', x: 1250, y: 1900, rot: -3.4, w: 250, style: 'amber', text: 'Favourite word: fugaz. Nothing has value in eternity; everything has value because it ends.' },
  { id: 'note-2', x: 2210, y: 1450, rot: 2.4, w: 270, style: 'amber', text: 'Second brain, my dad calls it the third brain. He is not wrong and it stings.' },
  { id: 'note-3', x: 2210, y: 1700, rot: -1.2, w: 270, style: 'paper-dashed', text: 'Working theory: depth feels like plenitude, breadth feels like appetite. I want both, so I never stop.' },
];

// Languages. Off by default: a fork with one language behaves exactly as it
// did before this existed. Turn it on and the board gains a switcher, the owner
// writes in `primary`, and the translate action in the owner bar fills the rest.
export const I18N = {
  enabled: true,
  primary: 'en',
  languages: [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
  ],
  auto: true, // translate a field when the owner leaves it
  provider: 'mymemory', // mymemory (keyless) | function (your own key) | off
  remember: true, // keep the visitor's choice
  followBrowser: false, // start in English regardless of the visitor's browser
};

// The guided tour — the slate slams onto the wall and the visitor walks the
// board section by section, at their own pace, while each drawer, photo and
// note is stuck onto the slate.
//
// Only the authored route lives here, because the route is content: which
// pieces are shown together, in what order, under what heading. Every
// behavioural default (speed, camera motion, reveal style, intro, bar labels)
// comes from src/lib/tour.ts and is overridden per-field the moment the owner
// touches the tour panel. Anything not listed in a stop is picked up by the
// trailing "the rest" stop, so a card added later is never left invisible.
export const TOUR = {
  route: 'custom',
  stops: [
    { id: 'stop-1', label: 'the person, first', items: ['hero', 'now'] },
    { id: 'stop-2', label: 'what pays · what does not', items: ['work', 'vol'] },
    { id: 'stop-3', label: 'marks and trophies', items: ['edu', 'hack', 'langs'] },
    { id: 'stop-4', label: 'the bench · on the air', items: ['lab', 'pod'] },
    { id: 'stop-5', label: 'the workshop · the long diary', items: ['repos', 'diary', 'pola-2'] },
    { id: 'stop-6', label: 'the drawer with no CV line', items: ['random', 'pola-3', 'pola-4'] },
    { id: 'stop-7', label: 'the field log', items: ['travel'] },
    { id: 'stop-8', label: 'reachable', items: ['contact', 'pola-1', 'note-1', 'note-2', 'note-3'] },
  ],
};
