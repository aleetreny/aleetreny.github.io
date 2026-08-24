// Canonical description of the working-board cover: theme, cards, groupings.
// This is the reproducible source for the seed fixtures. Once seeded into Neon,
// the owner edits everything from the site itself (theme, layout, text, photos)
// and this file only matters for a clean re-seed or the offline safe copy.

// Board is authored on a fixed canvas; the app fits/zooms it to any screen.
export const BOARD = {"width": 3390, "height": 2500};

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
  "work": ["siemens", "accenture", "tropical", "ey"],
  "edu": ["ucl", "uc3m", "uma"],
  "lab": ["lab-l1", "lab-flows", "lab-grayscott", "lab-epidemic", "lab-kepler", "lab-particles", "lab-ica", "lab-cancer", "lab-physarum", "lab-beans"],
  "vol": ["alda", "eye2025", "startup-summit", "small-vol", "tedx"],
  "hack": ["hackathon-de-cabify", "hack-malaga", "hack-madrid", "hack-accenture", "hack-diputacion", "photo-prize", "mvp-hidro", "mvp-recycling"],
  "repos": ["atlas", "mapping-science", "localizate", "scholar-pulse", "vexillology", "hollywood", "cabicity", "small-repos", "c2-practice-log"],
  "travel": [],
  "random": ["garden", "telescope", "racket", "genome", "apocalypse"],
  "contact": ["contact"],
  "experiencias-internacionales": ["erasmus-programme", "traineeship-programme", "youth-exchange", "intercambio-de-idiomas"],
};

// Human label for each default list — the owner can rename or delete any of
// these, and add new ones, once the board is live.
export const GROUP_LABELS = {
  "work": "Work",
  "edu": "Studies",
  "lab": "Lab bench",
  "vol": "Volunteering",
  "hack": "Competitions",
  "repos": "Projects",
  "travel": "Travel",
  "random": "Hobbies",
  "contact": "Contact",
  "experiencias-internacionales": "Mobility",
};

// The list names are part of the board copy too. Keep the English source above
// for single-language forks, and provide the authored Spanish labels when the
// bilingual fixture is built so overflow panels never fall back to English.
export const GROUP_LABELS_ES = {
  "work": "Trabajo",
  "edu": "Estudios",
  "lab": "Laboratorio",
  "vol": "Voluntariado",
  "hack": "Competiciones",
  "repos": "Proyectos",
  "travel": "Viajes",
  "random": "Hobbies",
  "contact": "Contacto",
  "experiencias-internacionales": "Movilidad",
};

// entry_type per group (DB constraint: project|case-study|experience|education|note|custom)
export const GROUP_ENTRY_TYPE = {
  "work": "experience",
  "edu": "education",
  "lab": "project",
  "vol": "experience",
  "hack": "project",
  "repos": "project",
  "travel": "note",
  "random": "note",
  "contact": "note",
  "experiencias-internacionales": "experience",
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

// The cover cards, in the order the board reads. `x,y,rot,w` are the
// authored positions; an owner drag persists to site_settings['board.layout']
// and overrides them. `tone` selects a themed surface, so a theme colour
// change restyles every card of that tone.
export const CARDS = [
  {
    id: "hero",
    type: "hero",
    jump: "me",
    x: 132,
    y: 96,
    rot: 0.9,
    w: 620,
    kicker: {"es": "Portfolio", "en": "Portfolio"},
    name: {"es": "Alejandro\nTreny Ortega", "en": "Alejandro\nTreny Ortega"},
    tags: [{"es": "estadística", "en": "statistics"}, {"es": "datos", "en": "data"}, {"es": "economía", "en": "economics"}],
    intro: {"es": "Hola! Soy Alejandro, un chico de Málaga con pasión por los datos y su capacidad de responder preguntas.", "en": "Hi! I'm Alejandro, a guy from Málaga with a passion for data and its ability to answer questions."},
    hint: {"es": "Este tablón es un recorrido por mi vida, tanto profesional como personal. Haz click en cualquier entrada para ver detalles. Puedes moverte libremente por el tablero tanto con un ratón como con trackpad.", "en": "This board is a walk through my life, professional and personal alike. Click on any entry to see the details. You can move around the board freely with either a mouse or a trackpad."},
  },
  {
    id: "now",
    type: "now",
    jump: "now",
    current: "siemens",
    next: "ucl",
    tone: "amber",
    x: 1156,
    y: 128,
    rot: -2.4,
    w: 430,
    label: {"es": "Actualmente", "en": "Currently"},
    currentTitle: {"es": "Ciencia de Datos e IA\n@ Siemens Energy", "en": "Data Science and AI\n@ Siemens Energy"},
    currentSub: {"es": "Estamos implementando una herramienta para la predicción de algunos KPIs financieros en la central española, con la perspectiva de expandir la metodología a toda la operativa europea", "en": "We are rolling out a tool to forecast some financial KPIs at the Spanish headquarters, with the prospect of extending the methodology across the whole European operation"},
    nextLabel: {"es": "siguiente", "en": "next"},
    nextTitle: {"es": "MSc Ciencia de Datos & ML, UCL", "en": "MSc Data Science & ML, UCL"},
    nextSub: {"es": "Oct 2026 · Beca de Excelencia Kareema, €45k", "en": "Oct 2026 · Kareema Excellence Scholarship, €45k"},
  },
  {
    id: "work",
    type: "drawer",
    jump: "work",
    group: "work",
    tone: "paper",
    x: 96,
    y: 742,
    rot: -2.2,
    w: 620,
    kicker: {"es": "01 — Experiencia profesional", "en": "01 — Professional experience"},
    title: {"es": "Mi recorrido laboral", "en": "My working path"},
    subtitle: {"es": "Acumulo alrededor de 1 año y medio de experiencia laboral. He estado en varios sectores y tanto en empresa grande como pequeña. ", "en": "I have built up around a year and a half of work experience. I have been in several sectors and in both big and small companies. "},
    tech: [],
    stats: [],
    layout: "list",
    maxItems: 4,
  },
  {
    id: "edu",
    type: "drawer",
    jump: "edu",
    group: "edu",
    tone: "dark",
    x: 148,
    y: 1214,
    rot: 1.7,
    w: 620,
    kicker: {"es": "02 — Estudios", "en": "02 — Studies"},
    title: {"es": "Mi recorrido académico", "en": "My academic path"},
    subtitle: {"es": "Aunque un poco rocambolesco, mi objetivo es especializarme en Machine Learning aplicado a la Economía o Empresa. Quiero tener los fundamentos matemáticos y algorítmicos para abordar cuestiones de sociedad, mercado, o finanzas.", "en": "A bit convoluted, but my aim is to specialise in Machine Learning applied to Economics or Business. I want the mathematical and algorithmic foundations to tackle questions of society, markets, or finance."},
    layout: "list",
    maxItems: 4,
  },
  {
    id: "lab",
    type: "drawer",
    jump: "lab",
    group: "lab",
    tone: "slate",
    x: 104,
    y: 1672,
    rot: -1.4,
    w: 620,
    kicker: {"es": "03 — Laboratorio", "en": "03 — Lab bench"},
    title: {"es": "Algunos mini experimentos con datos ", "en": "Some mini experiments with data "},
    subtitle: {"es": "Aquí no hay gran cosa, estos son algunos ejemplos de uso de las matemáticas para explorar algunas preguntas tanto de física como de biología.", "en": "There is not much here, these are a few examples of using maths to explore some questions from both physics and biology."},
    tech: [],
    sweep: true,
    layout: "grid",
    maxItems: 10,
  },
  {
    id: "repos",
    type: "drawer",
    jump: "repos",
    group: "repos",
    tone: "paper",
    x: 1126,
    y: 586,
    rot: 2.1,
    w: 430,
    maxItems: 4,
    kicker: {"es": "04 — Proyectos", "en": "04 — Projects"},
    title: {"es": "Proyectos de código", "en": "Code projects"},
    intro: {"es": "Todo está en github totalmente reproducible", "en": "It is all on github, fully reproducible"},
    subtitle: {"es": "He explorado varias temáticas bastante diferentes, todos tienen algún componente de ciencia de datos, pero sobre todo me han servido para aprender y divertirme.", "en": "I have explored several pretty different themes, they all have some data science component, but above all they have been for learning and having fun."},
    layout: "notes",
    footerLink: ["github.com/aleetreny →", "https://github.com/aleetreny"],
  },
  {
    id: "hack",
    type: "drawer",
    jump: "hack",
    group: "hack",
    tone: "amber",
    x: 1162,
    y: 1306,
    rot: -2.8,
    w: 430,
    kicker: {"es": "05 — Competiciones", "en": "05 — Competitions"},
    title: {"es": "Hackathones y Concursos", "en": "Hackathons and Competitions"},
    subtitle: {"es": "Porque hay que apuntarse a todo, cómo vamos a progresar si no. ", "en": "Because you have to sign up for everything, how else are we going to make progress. "},
    layout: "atlas",
    maxItems: 8,
  },
  {
    id: "diary",
    type: "spotlight",
    jump: "diary",
    open: "diary",
    tone: "paperCream",
    x: 1134,
    y: 1994,
    rot: 2.6,
    w: 430,
    kicker: {"es": "06 — Emprendimiento", "en": "06 — Entrepreneurship"},
    title: {"es": "Frulogy", "en": "Frulogy"},
    blurb: {"es": "Vengo de una familia de agricultores y los márgenes para el productor son minúsculos. Creé una plataforma para vender directamente al consumidor europeo con precios dinámicos.", "en": "I come from a family of farmers and the margins for the grower are minuscule. I built a platform to sell directly to the European consumer with dynamic prices."},
    barCaption: {"es": "leer más →", "en": "read more →"},
    grid: [["> 300 ", {"es": "Pedidos", "en": "Orders"}], ["4.5 / 5", "Trustpilot"], ["+ 150%", {"es": "Margen de productores", "en": "Growers' margin"}], ["900", {"es": "Seguidores en Instagram", "en": "Instagram followers"}]],
    bars: true,
    ruled: true,
  },
  {
    id: "vol",
    type: "drawer",
    jump: "vol",
    group: "vol",
    tone: "paper",
    x: 1984,
    y: 136,
    rot: 2.3,
    w: 450,
    kicker: {"es": "07 — Voluntariado", "en": "07 — Volunteering"},
    title: {"es": "Voluntariados", "en": "Volunteering"},
    subtitle: {"es": "Cuando se puede, ayudamos.", "en": "When we can, we help."},
    layout: "compact",
    maxItems: 5,
  },
  {
    id: "9ab9f373-b73a-4d50-824d-06a90005c5fc",
    type: "drawer",
    group: "experiencias-internacionales",
    tone: "paper",
    x: 1952,
    y: 776,
    rot: -2.7,
    w: 450,
    kicker: {"es": "08 — Experiencias internacionales", "en": "08 — International experiences"},
    title: {"es": "Experiencias internacionales", "en": "International experiences"},
    subtitle: {"es": "A coger mundo", "en": "Off to see the world"},
    layout: "compact",
  },
  {
    id: "langs",
    type: "sticker",
    open: "languages",
    tone: "paperCream",
    x: 2018,
    y: 1352,
    rot: 4.6,
    w: 320,
    kicker: {"es": "09 — Idiomas", "en": "09 — Languages"},
    title: {"es": "Hablo 3 idiomas", "en": "I speak 3 languages"},
    note: {"es": "Mi familia materna es española, y mi familia paterna es francesa.", "en": "My mother's family is Spanish, and my father's family is French."},
    langs: [["ES", {"es": "Nativo en español", "en": "Native Spanish"}, 5], ["FR", {"es": "Nativo en francés", "en": "Native French"}, 5], ["EN", {"es": "C2 Cambridge · 215", "en": "C2 Cambridge · 215"}, 5]],
  },
  {
    id: "random",
    type: "drawer",
    jump: "random",
    group: "random",
    tone: "slate",
    x: 2836,
    y: 138,
    rot: -2.1,
    w: 450,
    kicker: {"es": "10 — Hobbies", "en": "10 — Hobbies"},
    title: {"es": "Hobbies e intereses", "en": "Hobbies and interests"},
    subtitle: {"es": "La vida es mucho más que trabajar, yo suelo disfrutar con esto:", "en": "Life is much more than work, this is what I usually enjoy:"},
    footer: {"es": "También: ciencia ficción y fantasía (Douglas Adams es innegociable), juegos de mesa, comida asiática, y un grillo que me comí en un TEDx. No como aguacate.", "en": "Also: sci-fi and fantasy (Douglas Adams is non-negotiable), board games, Asian food, and one cricket eaten at a TEDx. I do not eat avocado."},
    layout: "notes",
    maxItems: 7,
  },
  {
    id: "pod",
    type: "spotlight",
    jump: "pod",
    open: "podcast",
    tone: "paperWarm",
    x: 2842,
    y: 1448,
    rot: 2.4,
    w: 430,
    kicker: {"es": "11 — Podcast", "en": "11 — Podcast"},
    title: {"es": "Un Poco\nAbsurdo", "en": "Un Poco\nAbsurdo"},
    blurb: {"es": "Durante un verano hice un podcast de Filosofía y Tecnología. La mayoría eran tonterías pero me divertí mucho.", "en": "One summer I made a podcast about Philosophy and Technology. Most of it was nonsense but I had a great time."},
    footer: ["100+ / ep", "★★★★★", {"es": "leer más →", "en": "read more →"}],
    waveform: true,
  },
  {
    id: "c8b59d16-b101-4d16-b029-3a938ed771ef",
    type: "spotify",
    tone: "dark",
    x: 2812,
    y: 1836,
    rot: -1.6,
    w: 430,
    spotifyUrl: "https://open.spotify.com/track/5jysHNTiZcXz83qaIXl3vf?si=491ad285481a43f2",
  },
  {
    id: "contact",
    type: "contact",
    jump: "contact",
    open: "contact",
    tone: "dark",
    x: 2838,
    y: 2094,
    rot: 2.8,
    w: 450,
    kicker: {"es": "12 — Contacto", "en": "12 — Contact"},
    title: {"es": "Encuéntrame por aquí", "en": "Find me here"},
    note: {"es": "Por si quieres tomar un café o seguirme la pista.", "en": "In case you fancy a coffee or want to keep track of me."},
    links: [["alejandrotreny100@gmail.com", "mailto:alejandrotreny100@gmail.com"], ["github.com/aleetreny", "https://github.com/aleetreny"], ["linkedin.com/in/aleetreny", "https://linkedin.com/in/aleetreny"]],
  },
];

// Instant photos — draggable, each with a fillable photo slot.
export const POLAROIDS = [
  {
    id: "cd8ee42e-7bd9-4bdf-a560-35576db3ce66",
    x: 2824,
    y: 1112,
    rot: -3.9,
    w: 280,
    h: 220,
    caption: "",
    assetUrl: "https://br-blue-dawn-ay0e37ed.storage.c-5.us-east-2.aws.neon.tech/portfolio-assets/d245e522-0791-420d-9454-04e3f0e7e34e/19cd99d7-c463-4793-949a-0579559daecd-img_1780813107302.jpeg",
    placeholder: "",
    assetMediaType: "image/jpeg",
  },
  {
    id: "0b7edf74-f03b-465c-afbf-eac0714a3b67",
    x: 1608,
    y: 2012,
    rot: 2.9,
    w: 280,
    h: 220,
    caption: "",
    assetUrl: "https://br-blue-dawn-ay0e37ed.storage.c-5.us-east-2.aws.neon.tech/portfolio-assets/d245e522-0791-420d-9454-04e3f0e7e34e/30e14d64-1d4d-4571-9b78-26ea6d656a65-9b9e9bf2-6a2c-4d56-8809-f6a7820b5cfa.jpg",
    placeholder: "",
    assetMediaType: "image/jpeg",
  },
  {
    id: "76ef90fd-0892-4f81-895d-d3c499c4c591",
    x: 1636,
    y: 164,
    rot: 3.8,
    w: 280,
    h: 220,
    caption: "",
    assetUrl: "https://br-blue-dawn-ay0e37ed.storage.c-5.us-east-2.aws.neon.tech/portfolio-assets/d245e522-0791-420d-9454-04e3f0e7e34e/db06c0fc-193b-48ff-8c6c-8dfec02f2126-img_1777654623515.jpeg",
    placeholder: "",
    assetMediaType: "image/jpeg",
  },
  {
    id: "fb625376-c68f-4aa8-bd2c-dbf31846b5fd",
    x: 778,
    y: 1806,
    rot: -3.6,
    w: 280,
    h: 220,
    caption: "",
    assetUrl: "https://br-blue-dawn-ay0e37ed.storage.c-5.us-east-2.aws.neon.tech/portfolio-assets/d245e522-0791-420d-9454-04e3f0e7e34e/558d2857-e733-40d0-8a55-bdbdc40bd4d0-img_1737295742881.jpeg",
    placeholder: "",
    assetMediaType: "image/jpeg",
  },
  {
    id: "dc7efc3d-fe79-43fa-b0e9-7d8336637934",
    x: 772,
    y: 806,
    rot: 3.4,
    w: 280,
    h: 220,
    caption: "",
    assetUrl: "https://br-blue-dawn-ay0e37ed.storage.c-5.us-east-2.aws.neon.tech/portfolio-assets/d245e522-0791-420d-9454-04e3f0e7e34e/503d564b-5ef0-4f78-8914-a5abdb2a8de1-img_1712962953334.jpeg",
    placeholder: "",
    assetMediaType: "image/jpeg",
  },
  {
    id: "058364fb-99aa-4218-8eb4-7dc54f2eb270",
    x: 1604,
    y: 656,
    rot: -2.6,
    w: 280,
    h: 220,
    caption: "",
    assetUrl: "https://br-blue-dawn-ay0e37ed.storage.c-5.us-east-2.aws.neon.tech/portfolio-assets/d245e522-0791-420d-9454-04e3f0e7e34e/567db077-108d-4cd0-a713-9a3feefeec1c-img_1711713351787.jpeg",
    placeholder: "",
    assetMediaType: "image/jpeg",
  },
  {
    id: "a6c656f2-3aa7-4585-97b0-a19753bf86f1",
    x: 1642,
    y: 1388,
    rot: -4.4,
    w: 280,
    h: 220,
    caption: "",
    assetUrl: "https://br-blue-dawn-ay0e37ed.storage.c-5.us-east-2.aws.neon.tech/portfolio-assets/d245e522-0791-420d-9454-04e3f0e7e34e/e31c981e-d417-4ccc-942b-70f76168fac8-img_1706807444401.jpeg",
    placeholder: "",
    assetMediaType: "image/jpeg",
  },
  {
    id: "0c77969f-c720-4b16-ae42-0d5877e05c86",
    x: 2486,
    y: 682,
    rot: -3.3,
    w: 280,
    h: 220,
    caption: "",
    assetUrl: "https://br-blue-dawn-ay0e37ed.storage.c-5.us-east-2.aws.neon.tech/portfolio-assets/d245e522-0791-420d-9454-04e3f0e7e34e/e0801136-a924-40fb-b732-9c871b7b41f9-img_2846.png",
    placeholder: "",
    assetMediaType: "image/png",
  },
  {
    id: "cc5400c7-f3d0-4138-92d3-f70a5ae443f6",
    x: 806,
    y: 1188,
    rot: -2.8,
    w: 280,
    h: 220,
    caption: "",
    assetUrl: "https://br-blue-dawn-ay0e37ed.storage.c-5.us-east-2.aws.neon.tech/portfolio-assets/d245e522-0791-420d-9454-04e3f0e7e34e/3b1a1c6a-9085-4357-ae94-0f59682e8dc2-img_1780374393843.jpeg",
    placeholder: "",
    assetMediaType: "image/jpeg",
  },
  {
    id: "e3515a8c-9766-44c0-a0a0-3d17ff9f3a8a",
    x: 2456,
    y: 1034,
    rot: 4.1,
    w: 280,
    h: 220,
    caption: "",
    assetUrl: "https://br-blue-dawn-ay0e37ed.storage.c-5.us-east-2.aws.neon.tech/portfolio-assets/d245e522-0791-420d-9454-04e3f0e7e34e/fffa13f1-885b-4733-813f-7f2181f1d0fe-img_1697905718708.jpeg",
    placeholder: "",
    assetMediaType: "image/jpeg",
  },
  {
    id: "8e9687a7-3bc6-4fb4-9efe-b967165110a8",
    x: 2012,
    y: 1734,
    rot: 3.1,
    w: 280,
    h: 220,
    caption: "",
    assetUrl: "https://br-blue-dawn-ay0e37ed.storage.c-5.us-east-2.aws.neon.tech/portfolio-assets/d245e522-0791-420d-9454-04e3f0e7e34e/391ddd29-7c8f-4bdd-a9ad-e5b000bf3fdd-img_8634.jpeg",
    placeholder: "",
    assetMediaType: "image/jpeg",
  },
  {
    id: "abd756d1-fef8-4243-938b-4a1e59a11705",
    x: 1978,
    y: 2052,
    rot: -2.4,
    w: 280,
    h: 220,
    caption: "",
    assetUrl: "https://br-blue-dawn-ay0e37ed.storage.c-5.us-east-2.aws.neon.tech/portfolio-assets/d245e522-0791-420d-9454-04e3f0e7e34e/cd75a151-2149-40bc-a546-a93d5882aec3-img_1693418099620.jpeg",
    placeholder: "",
    assetMediaType: "image/jpeg",
  },
  {
    id: "da4981ab-6ee3-41e9-a7a3-691faa9b3b25",
    x: 2856,
    y: 786,
    rot: 3.7,
    w: 280,
    h: 220,
    caption: "",
    assetUrl: "https://br-blue-dawn-ay0e37ed.storage.c-5.us-east-2.aws.neon.tech/portfolio-assets/d245e522-0791-420d-9454-04e3f0e7e34e/55c06e49-5303-443f-80a0-2e1b36eb567f-img_1689759814814.jpeg",
    placeholder: "",
    assetMediaType: "image/jpeg",
  },
  {
    id: "6248ec11-6759-498b-92cb-9e3199de7fad",
    x: 812,
    y: 214,
    rot: -4.2,
    w: 280,
    h: 220,
    caption: "",
    assetUrl: "https://br-blue-dawn-ay0e37ed.storage.c-5.us-east-2.aws.neon.tech/portfolio-assets/d245e522-0791-420d-9454-04e3f0e7e34e/ffc6c807-b46f-478d-acc3-692c1908b067-img_1717701097365.jpeg",
    imageFrame: {"x": 50, "y": 60, "scale": 1},
    placeholder: "",
    assetMediaType: "image/jpeg",
  },
];

// Sticky marginalia — small notes, toggled by theme.showMarginalia.
export const MARGINALIA = [
  {
    id: "note-1",
    x: 776,
    y: 556,
    rot: 5.0,
    w: 250,
    style: "amber",
    text: {"es": "Como especia el cardamomo", "en": "As a spice, cardamom"},
  },
  {
    id: "note-2",
    x: 2828,
    y: 2358,
    rot: -4.6,
    w: 270,
    style: "amber",
    text: {"es": "Rick y Morty es mi serie preferida, un documental de los 2000", "en": "Rick and Morty is my favourite series, a documentary from the 2000s"},
  },
  {
    id: "note-3",
    x: 1616,
    y: 1004,
    rot: 3.2,
    w: 270,
    style: "paper-dashed",
    text: {"es": "Se me da muy mal el fútbol", "en": "I am very bad at football"},
  },
  {
    id: "a9a3a0f2-2c01-4281-92e6-793a43a7c6ef",
    x: 830,
    y: 1548,
    rot: 4.4,
    w: 220,
    style: "amber",
    text: {"es": "1. Mango\n2. Lichi\n3. Melón", "en": "1. Mango\n2. Lychee\n3. Melon"},
  },
  {
    id: "c39bd248-9410-4a4e-906c-44e1af0e39bc",
    x: 1974,
    y: 1648,
    rot: -4.0,
    w: 250,
    style: "paper-dashed",
    text: {"es": "Juvenocrático", "en": "Juvenocratic"},
  },
  {
    id: "79c733ce-7c0f-436b-a2b3-d90012b3ba85",
    x: 1630,
    y: 1892,
    rot: -3.8,
    w: 250,
    style: "amber",
    text: {"es": "Don't Panic", "en": "Don't Panic"},
  },
];

// Languages. Off by default: a fork with one language behaves exactly as it
// did before this existed. Turn it on and the board gains a switcher, the owner
// writes in `primary`, and the translate action in the owner bar fills the rest.
export const I18N = {
  enabled: true,
  primary: 'es',
  languages: [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' },
  ],
  auto: true, // translate a field when the owner leaves it
  provider: 'mymemory', // mymemory (keyless) | function (your own key) | off
  remember: true, // keep the visitor's choice
  followBrowser: true, // open in the visitor's own language when we have it
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
  // The framing left 55px of empty slate under the walking bar and
  // 38px of air around every stop, which on a 1280x800 laptop was
  // enough to shrink a full-height drawer below its own type size.
  camera: { padTop: 50, padBottom: 112, inflate: 22 },
  // The walking bar speaks the board's languages too.
  bar: {
    backLabel: { es: '← atrás', en: '← back' },
    nextLabel: { es: 'siguiente →', en: 'next →' },
    finishLabel: { es: 'abrir el tablero →', en: 'open the board →' },
    skipLabel: { es: 'saltar', en: 'skip' },
    hint: { es: 'espacio / → siguiente · arrastra y haz zoom cuando quieras', en: 'space / → next · drag & zoom anytime' },
  },
  stops: [
    { id: 'stop-1', label: { es: 'Quién soy', en: 'Who I am' }, items: ['hero', '6248ec11-6759-498b-92cb-9e3199de7fad', 'note-1'] },
    { id: 'stop-2', label: { es: 'Dónde estoy ahora', en: 'Where I am now' }, items: ['now', '76ef90fd-0892-4f81-895d-d3c499c4c591'] },
    { id: 'stop-3', label: { es: '01 · Dónde he trabajado', en: '01 · Where I have worked' }, items: ['work', 'dc7efc3d-fe79-43fa-b0e9-7d8336637934'] },
    { id: 'stop-4', label: { es: '02 · Dónde he estudiado', en: '02 · Where I have studied' }, items: ['edu', 'cc5400c7-f3d0-4138-92d3-f70a5ae443f6', 'a9a3a0f2-2c01-4281-92e6-793a43a7c6ef'] },
    { id: 'stop-5', label: { es: '03 · El laboratorio', en: '03 · The lab bench' }, items: ['lab', 'fb625376-c68f-4aa8-bd2c-dbf31846b5fd'] },
    { id: 'stop-6', label: { es: '04 · Lo que construyo', en: '04 · What I build' }, items: ['repos', '058364fb-99aa-4218-8eb4-7dc54f2eb270', 'note-3'] },
    { id: 'stop-7', label: { es: '05 · Competiciones', en: '05 · Competitions' }, items: ['hack', 'a6c656f2-3aa7-4585-97b0-a19753bf86f1'] },
    { id: 'stop-8', label: { es: '06 · El negocio que monté', en: '06 · The business I built' }, items: ['diary', '0b7edf74-f03b-465c-afbf-eac0714a3b67', '79c733ce-7c0f-436b-a2b3-d90012b3ba85'] },
    { id: 'stop-9', label: { es: '07 · Cuando se puede, ayudamos', en: '07 · When we can, we help' }, items: ['vol'] },
    { id: 'stop-10', label: { es: '08 · A coger mundo', en: '08 · Off to see the world' }, items: ['9ab9f373-b73a-4d50-824d-06a90005c5fc'] },
    { id: 'stop-11', label: { es: '09 · Tres idiomas', en: '09 · Three languages' }, items: ['langs', 'c39bd248-9410-4a4e-906c-44e1af0e39bc'] },
    { id: 'stop-12', label: { es: 'Fotos sueltas', en: 'Loose photos' }, items: ['8e9687a7-3bc6-4fb4-9efe-b967165110a8', 'abd756d1-fef8-4243-938b-4a1e59a11705'] },
    { id: 'stop-13', label: { es: 'Más fotos', en: 'More photos' }, items: ['0c77969f-c720-4b16-ae42-0d5877e05c86', 'e3515a8c-9766-44c0-a0a0-3d17ff9f3a8a'] },
    { id: 'stop-14', label: { es: '10 · Fuera del CV', en: '10 · Off the CV' }, items: ['random'] },
    { id: 'stop-15', label: { es: 'Las últimas fotos', en: 'The last few photos' }, items: ['da4981ab-6ee3-41e9-a7a3-691faa9b3b25', 'cd8ee42e-7bd9-4bdf-a560-35576db3ce66'] },
    { id: 'stop-16', label: { es: '11 · En el aire', en: '11 · On the air' }, items: ['pod', 'c8b59d16-b101-4d16-b029-3a938ed771ef'] },
    { id: 'stop-17', label: { es: '12 · Dónde encontrarme', en: '12 · Where to find me' }, items: ['contact', 'note-2'] },
  ],
};
