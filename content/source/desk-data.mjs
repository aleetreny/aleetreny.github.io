// Content of the desk. Plain data — the cover board is markup; this feeds the detail sheets.
export const ITEMS = {
  /* ───────────────── WORK ───────────────── */
  'siemens': {
    kicker: 'Work · Master\'s thesis project', when: 'Nov 2025 → now', where: 'Madrid',
    title: 'Data Scientist at Siemens Energy',
    lede: 'Predicting cash flow for the Spanish HQ. Half of the job is the model, the other half is making a director trust it in eight seconds.',
    stats: [['GAMs vs XGBoost', 'benchmarked'], ['Power BI', 'the delivery layer'], ['€bn', 'scale of the P&L']],
    bullets: [
      'Benchmarking flexible inference (GAMs) against high-precision gradient boosting on real treasury data — the interesting part is where they disagree.',
      'Turning forecasts into a Power BI layer with an expansion roadmap to other countries.',
      'The recurring lesson: a model nobody can read is a model nobody uses. I now spend as long on the reporting as on the fit.',
      'Also my MSc thesis, so the deadline is enforced by two institutions at once.'
    ], photos: 2, tags: ['Python', 'GAMs', 'XGBoost', 'Power BI', 'forecasting']
  },
  'accenture': {
    kicker: 'Work · Internship', when: 'Jan → May 2026', where: 'Madrid',
    title: 'Data Science & AI at Accenture',
    lede: 'Multi-agent systems for Spanish banks, back when "agent" still needed explaining in every meeting.',
    stats: [['AWS Bedrock', 'model layer'], ['MCP', 'servers built'], ['Synthetic data', 'main use case']],
    bullets: [
      'Built Python multi-agent pipelines for synthetic data generation and financial analysis.',
      'Configured models through AWS Bedrock, wired S3 storage and Lambda triggers.',
      'Wrote MCP servers before half the room knew the acronym.',
      'Learned the consultancy dialect: the same result lands very differently depending on which slide it arrives on.'
    ], photos: 2, tags: ['Python', 'AWS Bedrock', 'Lambda', 'S3', 'agents']
  },
  'tropical': {
    kicker: 'Work · Operations', when: 'Nov 2024 → Jun 2025', where: 'Málaga',
    title: 'Data Analyst at Tropical Millenium',
    lede: 'Fruit. Twelve million kilos of it, €44M a year, and a price that moves every single week.',
    stats: [['+7%', 'EBITDA in 8 months'], ['€470k', 'improvement fund'], ['12M kg', 'volume modelled']],
    bullets: [
      'Built time-series price forecasting for a €44M distributor — the first time my output had a truck attached to it.',
      'Worked directly with the CEO on a €470k operational improvement fund, dashboards included.',
      'EBITDA up 7% across eight months.',
      'Sitting inside a supply chain taught me more about incentives than three econometrics courses. Everybody optimises something; almost nobody optimises the same thing.'
    ], photos: 2, tags: ['time series', 'pricing', 'Power BI', 'supply chain']
  },
  'ey': {
    kicker: 'Work · Finance', when: 'Sep 2024 → Jan 2025', where: 'Málaga',
    title: 'Data Analyst at EY, contracted to ING',
    lede: 'Chasing irregularities through corporate accounts worth up to €90M, one reconciliation at a time.',
    stats: [['€90M', 'accounts reviewed'], ['×2', 'cases per day'], ['Power Query', 'the weapon']],
    bullets: [
      'Investigated financial irregularities in corporate accounts for ING, via consultancy.',
      'Replaced the team\'s manual Excel ritual with a Power Query workflow — daily throughput doubled.',
      'First real lesson in automation politics: people defend the process, not the outcome. Show them their afternoon back and they change sides.'
    ], photos: 1, tags: ['Power Query', 'audit', 'Excel', 'finance']
  },
  'frulogy': {
    kicker: 'Venture · First company', when: '2020 → 2022', where: 'Málaga / online',
    title: 'Frulogy — an online fruit business, at 19',
    lede: 'My first company, built partly out of envy that other teenagers were building things. It worked technically and failed emotionally, which turned out to be the useful version.',
    stats: [['DE + ES', 'translated store'], ['19', 'years old'], ['1st', 'business, and a lesson']],
    bullets: [
      'Ran the whole stack alone: web design, tech, logistics, ads, marketing, supplier deals, German translation.',
      'It gave me the foundations to launch anything online. It also taught me that a business you don\'t love becomes a weight you carry.',
      'Diary, August 2021: "if I ever want to quit Frulogy I quit and that\'s it" — I did, and it was the right call.',
      'Everything since has passed one filter first: would I still do this if it made no money?'
    ], photos: 2, tags: ['e-commerce', 'ads', 'logistics', 'failure']
  },

  /* ───────────────── STUDY ───────────────── */
  'ucl': {
    kicker: 'Study · Incoming', when: 'Oct 2026 → Jun 2027', where: 'London',
    title: 'MSc Data Science & Machine Learning, UCL',
    lede: 'Next chapter, funded. Fundación Kareema Excellence Grant, €45k.',
    stats: [['€45k', 'excellence grant'], ['UCL', 'Gower Street'], ['2026/27', 'academic year']],
    bullets: [
      'The plan: go deeper into the machine-learning side while keeping the statistician\'s suspicion of shortcuts.',
      'London has been on the list since I was 18 and writing about wanting to live in another culture "for a limited time, then come home to Andalucía".',
      'Applications elsewhere are still open in my head — Imperial complementary grant, CERN. I keep a checkpoint list.'
    ], photos: 2, tags: ['UCL', 'MSc', 'grant']
  },
  'uc3m': {
    kicker: 'Study', when: 'Sep 2025 → Jun 2026', where: 'Madrid',
    title: 'MSc Statistics for Data Science, UC3M',
    lede: 'The year the maths got serious and I stopped pretending intuition scales.',
    stats: [['8.95', 'GPA / 10'], ['Top 10%', 'cohort'], ['R', 'primary language']],
    bullets: [
      'Key modules: stochastic processes, advanced programming, statistical learning, advanced regression models.',
      'R became my main language here — Quarto for reporting, Positron as the IDE.',
      'Bayesian coursework recorded on video, regression finals in the same week as a hackathon. Worth it.'
    ], photos: 1, tags: ['R', 'stochastic processes', 'Quarto', 'Bayesian']
  },
  'uma': {
    kicker: 'Study', when: 'Sep 2020 → Jun 2025', where: 'Málaga',
    title: 'Double BSc Economics + Business Administration',
    lede: 'Five years, two degrees, and a running argument with the education system that I decided to win from the inside.',
    stats: [['8.56', 'GPA / 10'], ['13.43/14', 'admission grade'], ['Top 10%', 'cohort']],
    bullets: [
      'Key modules: econometrics, statistics, financial mathematics, mathematical programming, game theory.',
      'Diary, 2021: "the goal is to cram the book, recite it and forget it". I spent the next four years proving you could learn properly and still get the mark.',
      'Game theory and micro were where economics stopped being vocabulary and started being a lens.'
    ], photos: 2, tags: ['econometrics', 'game theory', 'statistics']
  },
  'erasmus-sk': {
    kicker: 'Study · Erasmus', when: '2023', where: 'Bratislava, Slovakia',
    title: 'Erasmus year at Comenius University',
    lede: 'A whole year abroad, which I had wanted since I first read the word Erasmus, and which I chased by finally studying properly.',
    stats: [['1 year', 'abroad'], ['Comenius', 'university'], ['~15', 'countries reachable by train']],
    bullets: [
      'The reason I went from "I study to pass" to "I study to get the Erasmus" to, embarrassingly, "I study because it\'s interesting".',
      'Base camp for Vienna, Prague, Budapest, Kraków and every cheap flight out of Central Europe.',
      'Living in another language full-time recalibrated how I meet people — you become the one who starts conversations, or you eat alone.'
    ], photos: 3, tags: ['Erasmus', 'Slovakia', 'Central Europe']
  },
  'languages': {
    kicker: 'Study · Languages', when: 'ongoing', where: 'everywhere',
    title: 'Three languages, one accent problem',
    lede: 'Spanish native, French native, English C1 Cambridge (187) — and a permanent project to sound less Andalusian in all three.',
    stats: [['187', 'Cambridge C1'], ['3', 'languages'], ['C2', 'the current target']],
    bullets: [
      'French from home, Spanish from Málaga, English from years of podcasts, papers and stubbornness.',
      'Built a C2 practice log app for myself rather than pay for a course — real exam banks, guided correction, adaptive review.',
      'The Málaga humour does not translate. I have stopped trying and started rebuilding the jokes in each language.'
    ], photos: 1, tags: ['ES', 'FR', 'EN', 'Cambridge']
  },

  /* ───────────────── VOLUNTEERING ───────────────── */
  'alda': {
    kicker: 'Volunteering', when: '3 months, 2025', where: 'Asunción, Paraguay',
    title: 'Fundación Alda — three months in Paraguay',
    lede: 'The longest and least comfortable thing on this board, and the one that changed the most.',
    stats: [['3 months', 'on the ground'], ['Children', 'the work'], ['1', 'recalibrated scale of "problem"']],
    bullets: [
      'Working with children through Fundación Alda, living where the project is instead of visiting it.',
      'Diary: "the volunteering has added robustness and global openness — I go into anything now with full normality, however strange the clash."',
      'Training sessions where other volunteers described Honduras: which bus you cannot take, why you walk accompanied for the first month. Perspective arrives fast in a room like that.',
      'Also the trip that made me distrust the word "hippy volunteer" — I did it for the work and the shift in scale, not for the identity.',
      'Photos from the market in Asunción and the Bolivian stalls are among my favourite things I own.'
    ], photos: 3, tags: ['Paraguay', 'children', 'cooperation', '3 months']
  },
  'eye2025': {
    kicker: 'Volunteering · Leadership', when: '2025', where: 'Strasbourg / Brussels',
    title: 'European Parliament — EYE2025 coordinator',
    lede: 'Ten thousand young Europeans, one hemicycle, a schedule that could not slip.',
    stats: [['10k+', 'participants'], ['Coordinator', 'my role'], ['1 cm', 'from the Parliament VP']],
    bullets: [
      'Coordinating groups and logistics at the European Youth Event inside the Parliament.',
      'Saw the machine from the inside: a demonstration outside the building and the vice-president of the Parliament a centimetre away, on the same afternoon.',
      'Best possible argument against cynicism about institutions: watching ten thousand people who care show up on time.'
    ], photos: 3, tags: ['European Parliament', 'EYE2025', 'coordination']
  },
  'tedx': {
    kicker: 'Volunteering', when: '2022 →', where: 'Málaga / Cádiz',
    title: 'TEDx — from fan in the audience to the team',
    lede: 'I had watched TED talks obsessively for years. Then I went to a TEDx in Cádiz, ate a cricket, and signed up as a volunteer for the Málaga one.',
    stats: [['1', 'cricket eaten'], ['1000+', 'seats in the theatre'], ['31 €', 'ticket, amortised in free magazines']],
    bullets: [
      'Drove to TEDx Cádiz on the theme of weirdness — insect tasting, clown noses in the goodie bag, a red logo I had only ever seen on a screen.',
      'Came back and joined TEDxMálaga as a volunteer: "you have to say yes to life, I don\'t want to reach old age regretting the times I didn\'t."',
      'First meeting was in a school assembly hall in a neighbourhood too pretty to be real. I have said yes to almost everything since.'
    ], photos: 2, tags: ['TEDx', 'volunteer', 'events']
  },
  'startup-summit': {
    kicker: 'Volunteering · Organising', when: '2025', where: 'Málaga',
    title: 'EU Start-up Summit — organising team',
    lede: 'On the other side of the badge for once: building the event instead of networking through it.',
    stats: [['EU', 'scope'], ['Organising', 'team'], ['∞', 'pitch decks read']],
    bullets: [
      'Part of the organising team for the EU Start-up Summit.',
      'Also went to Outstanding as an attendee, which produced the single best lesson in my diary: an exhibitor who visibly wanted to escape my questions killed my interest in a product I had liked five minutes earlier.',
      'Conclusion I now apply to myself at every event: how you behave in the last five minutes of a conversation is the whole brand.'
    ], photos: 2, tags: ['startups', 'events', 'EU']
  },
  'erasmus-lt': {
    kicker: 'Volunteering · Erasmus+', when: '2023', where: 'Lithuania',
    title: 'Erasmus+ youth exchange, Lithuania',
    lede: 'A week of structured cultural collision with people from six countries, in a place I could not have found on a map at 18.',
    stats: [['6+', 'nationalities'], ['1 week', 'immersion'], ['LT', 'country #?']],
    bullets: [
      'Youth exchange: workshops, national evenings, the specific intimacy of a group that will never be in the same room again.',
      'Kaunas and Vilnius stayed with me more than the programme did.',
      'The template for how I now travel: go where nobody you know has been.'
    ], photos: 2, tags: ['Erasmus+', 'Lithuania', 'youth exchange']
  },
  'erasmus-bg': {
    kicker: 'Volunteering · Erasmus+', when: '2023', where: 'Bulgaria',
    title: 'Erasmus+ youth exchange, Bulgaria',
    lede: 'Sofia, sangria that should not have been sangria, and a fortnight of arguing about Europe in a second language.',
    stats: [['Sofia', 'base'], ['2 weeks', 'duration'], ['BG', 'stamp']],
    bullets: [
      'Second Erasmus+ exchange in a year — by then I knew how to use these programmes properly.',
      'The cheapest possible way to meet people whose assumptions do not match yours.',
      'Half the things I now believe about the EU come from these rooms, not from a class.'
    ], photos: 2, tags: ['Erasmus+', 'Bulgaria']
  },
  'small-vol': {
    kicker: 'Volunteering · The small ones', when: '2022 → now', where: 'Málaga',
    title: 'The unglamorous volunteering',
    lede: 'The ones that never make a CV: 7:15am starts, pedestrian crossings, university open days, film festivals.',
    stats: [['7:15', 'am, for an 11am race'], ['1', 'pedestrian crossing, defended'], ['n', 'friends dragged along']],
    bullets: [
      'Volunteered at a city race where our entire job was controlling a crossing that everyone ignored. Talked two friends into it at 7:15 in the morning.',
      'University open days, guiding people around Teatinos.',
      'Málaga Film Festival is on the list, and researcher\'s night at the Google cybersecurity centre already happened.',
      'I keep doing these because tangible help is the only kind that satisfies me — I am bad at donating money I cannot follow.'
    ], photos: 2, tags: ['local', 'races', 'open days']
  },

  /* ───────────────── HACKATHONS & PRIZES ───────────────── */
  'hack-malaga': {
    kicker: 'Prize · Winner', when: '2026', where: 'Málaga',
    title: 'Málaga City Council data challenge — won it',
    lede: 'Open municipal data, a weekend, and a jury that had to be convinced twice.',
    stats: [['1st', 'place'], ['48h', 'build'], ['Open data', 'the raw material']],
    bullets: [
      'Winner of the Málaga City Council data hackathon.',
      'Afterwards the council\'s own data lead — not even on the jury — came over to say he loved the idea and wanted to develop it further together.',
      'That conversation is the reason a side project turned into an actual meeting with an institution.'
    ], photos: 2, tags: ['hackathon', 'open data', 'winner']
  },
  'hack-diputacion': {
    kicker: 'Prize · Runner-up', when: 'May 2026', where: 'Málaga',
    title: 'Diputación hackathon — came back with a Mac',
    lede: 'Took a train down on a Sunday during exam week because the prize was per person, not per team. Correct decision.',
    stats: [['2nd', 'place'], ['1 Mac', 'per participant'], ['Exam week', 'the timing']],
    bullets: [
      'Two-day data hackathon run by the provincial council; first prize €2k Amazon per person, second a MacBook per person.',
      'Went with my partner, who is genuinely better at presenting than I am — the split of model and pitch is the actual reason we place.',
      'Booked the trip on the assumption we would win something. We did.'
    ], photos: 2, tags: ['hackathon', 'runner-up', 'data']
  },
  'hack-accenture': {
    kicker: 'Hackathon', when: 'Nov 2025', where: 'Madrid',
    title: 'Accenture hackathon — the shopping chatbot',
    lede: 'One of 100 selected. They waited for the hundredth person to arrive before starting, which tells you everything about the energy in the room.',
    stats: [['100', 'selected'], ['2 days', 'non-consecutive'], ['1', 'chatbot shipped']],
    bullets: [
      'Built a shopping assistant chatbot under corporate mentorship.',
      'Best part was the social experiment: getting on well enough with the mentors that one of them photographed my phone case.',
      'Presented the following Friday. Turned an internship application into a conversation.'
    ], photos: 1, tags: ['chatbot', 'hackathon', 'LLM']
  },
  'hack-madrid': {
    kicker: 'Competition', when: '2026', where: 'Madrid',
    title: 'Madrid open-data competition & Localízate',
    lede: 'The city publishes the data; almost nobody uses it. I built the tool I wished existed and entered it.',
    stats: [['€4k', 'first prize'], ['Madrid', 'the dataset'], ['ML', 'under the hood']],
    bullets: [
      'Entered the Madrid open-data challenge with a tool predicting whether a new business survives on a given street.',
      'Became Localízate, developed for the Madrid City Council.',
      'I would have built it anyway. The prize just added a deadline, which is the only thing that reliably finishes my projects.'
    ], photos: 2, links: [['Repo', 'https://github.com/aleetreny/Localizate']], tags: ['open data', 'ML', 'Madrid']
  },
  'mvp-hidro': {
    kicker: 'Hackathon · MVP', when: '2022', where: 'Málaga',
    title: 'Rooftop hydroponics MVP',
    lede: 'Every city has thousands of square metres of empty roof. We built the business around filling them with food.',
    stats: [['MVP', 'in 48h'], ['Rooftops', 'the asset'], ['Hydroponics', 'the method']],
    bullets: [
      'Startup MVP built at a university hackathon: urban farming on unused rooftops.',
      'Explained it to my father over a long afternoon and he actually liked it, which at the time was the highest available validation.',
      'The coworking space was full of random objects. Half my memory of the weekend is objects I should have stolen.'
    ], photos: 1, tags: ['hackathon', 'urban farming', 'MVP']
  },
  'mvp-recycling': {
    kicker: 'Hackathon · MVP', when: '2022', where: 'Málaga',
    title: 'Recycling startup MVP',
    lede: 'Second MVP of the same era: making recycling behaviour legible enough to reward.',
    stats: [['MVP', 'shipped'], ['48h', 'again'], ['2', 'ventures in one year']],
    bullets: [
      'Built with a team in a university innovation hackathon.',
      'The mentors kicked us out of the building at closing time and I finally got to sleep.',
      'Neither MVP became a company. Both taught me how fast an idea can be made touchable.'
    ], photos: 1, tags: ['hackathon', 'recycling', 'MVP']
  },
  'photo-prize': {
    kicker: 'Prize · Twice', when: 'Nov–Dec 2025', where: 'Málaga',
    title: 'International cooperation photo contest — 2nd and 3rd',
    lede: 'I brought photos back from Paraguay. Friends entered one of them for me. I won two categories and a very small bottle.',
    stats: [['2nd', 'one category'], ['3rd', 'the other'], ['1 bottle', '+ 1 notebook']],
    bullets: [
      'University of Málaga international cooperation photography prize, two categories.',
      'Travelled back to Málaga, paid by the cooperation office, to collect it in the botanical garden. Half the winners did not show up.',
      'Diary: "we said it enough times that we made it real."'
    ], photos: 3, tags: ['photography', 'Paraguay', 'prize']
  },

  /* ───────────────── CODE ───────────────── */
  'localizate': {
    kicker: 'Code · For a city', when: '2026', where: 'Madrid',
    title: 'Localízate',
    lede: 'Open data plus machine learning to predict whether a new business will survive its street.',
    stats: [['Madrid', 'city council'], ['ML', 'survival prediction'], ['Open data', 'input']],
    bullets: [
      'Analytical platform: pick a location and a sector, get an evidence-backed answer instead of a hunch.',
      'Built for the Madrid City Council after the open-data competition.',
      'The genuinely hard part is not the model — it is convincing a shopkeeper that a probability is useful.'
    ], photos: 2, links: [['GitHub', 'https://github.com/aleetreny/Localizate']], tags: ['Python', 'ML', 'open data']
  },
  'vexillology': {
    kicker: 'Code · Pure curiosity', when: '2025', where: 'the sofa',
    title: 'Computational Vexillology',
    lede: '250 sovereign flags converted into mathematical fingerprints, then asked whether flag design remembers colonial history, geography and economics.',
    stats: [['250', 'flags'], ['n-dim', 'fingerprints'], ['Yes', 'it partly does']],
    bullets: [
      'Every flag reduced to quantitative features — colour distributions, symmetry, symbol density.',
      'Then correlated against real-world variables: colonial history, latitude, GDP, culture.',
      'My favourite kind of project: absolutely nobody asked for it, and the answer is genuinely interesting.'
    ], photos: 2, links: [['GitHub', 'https://github.com/aleetreny/Computational-Vexillology']], tags: ['R', 'clustering', 'culture']
  },
  'mapping-science': {
    kicker: 'Code · Thesis', when: '2026', where: 'Madrid',
    title: 'Mapping Science',
    lede: 'The shape of science itself: how research fields form, drift and collide over time.',
    stats: [['Embeddings', 'method'], ['Decades', 'of papers'], ['MSc', 'thesis']],
    bullets: [
      'Mapping the structure of research output and tracking how fields move.',
      'Half bibliometrics, half dimensionality reduction, entirely the kind of thing I would do unpaid.',
      'Feeds directly into Scholar Pulse — one project explains the map, the other makes it usable daily.'
    ], photos: 2, links: [['GitHub', 'https://github.com/aleetreny/Mapping-Science']], tags: ['NLP', 'embeddings', 'bibliometrics']
  },
  'hollywood': {
    kicker: 'Code', when: '2025', where: 'the sofa',
    title: 'Hollywood Mirror',
    lede: 'How much do film scripts copy each other? Embeddings say: quite a lot, and predictably so.',
    stats: [['NLP', 'embeddings'], ['1', 'interactive app'], ['Quarto', 'full analysis']],
    bullets: [
      'Narrative similarity across a corpus of movie scripts, with an interactive web app on top.',
      'Full reproducible analysis written in Quarto, because a result you cannot re-run is an anecdote.',
      'Started as an argument about whether a film was derivative. It was.'
    ], photos: 2, links: [['GitHub', 'https://github.com/aleetreny/Hollywood-Mirror']], tags: ['NLP', 'Quarto', 'film']
  },
  'scholar-pulse': {
    kicker: 'Code', when: '2026', where: 'Madrid',
    title: 'Scholar Pulse',
    lede: 'A living showroom for recent science — daily papers, thematic collections, discovery that does not require already knowing what you want.',
    stats: [['Daily', 'refresh'], ['Collections', 'thematic'], ['1', 'firehose, tamed']],
    bullets: [
      'arXiv is a firehose with no taste. This is the reading room I wanted.',
      'Thematic collections and clear discovery paths instead of an endless reverse-chronological list.',
      'The most-used thing I have ever built, by me, on a Sunday morning.'
    ], photos: 2, links: [['GitHub', 'https://github.com/aleetreny/Scholar-Pulse']], tags: ['science', 'discovery', 'web']
  },
  'arraigo': {
    kicker: 'Code · Going somewhere', when: '2026', where: 'Málaga',
    title: 'Arraigo',
    lede: 'Residential intelligence: compare Málaga neighbourhoods with public data, real maps and a recommendation that matches how you actually want to live.',
    stats: [['Idealista', 'API granted'], ['€14.9k', 'prototype ask'], ['Ayuntamiento', 'in the room']],
    bullets: [
      'Built a working prototype and pitched it to Málaga City Council — they liked it, and Idealista giving us their API data genuinely surprised them.',
      'Next step is the housing institute. There is a real budget conversation happening for the full six-month build.',
      'This is the project where the hobby stopped being a hobby.'
    ], photos: 2, tags: ['maps', 'housing', 'public data', 'Málaga']
  },
  'cabicity': {
    kicker: 'Code', when: '2026', where: 'Madrid',
    title: 'Cabicity & mad_plan',
    lede: 'Two attempts to make one city legible: every route, and every event.',
    stats: [['5', 'transport modes'], ['20+', 'event portals scraped'], ['1', 'city']],
    bullets: [
      'Cabicity: intermodal routing across Cabify, Metro, Cercanías, EMT buses, BiciMAD and walking.',
      'mad_plan: every event in Madrid pulled from more than twenty portals into one place.',
      'Both exist because I got annoyed on a specific Tuesday.'
    ], photos: 2, links: [['Cabicity', 'https://github.com/aleetreny/Cabicity'], ['mad_plan', 'https://github.com/aleetreny/mad_plan']], tags: ['routing', 'scraping', 'Madrid']
  },
  'atlas': {
    kicker: 'Code · Reference', when: 'ongoing', where: 'everywhere',
    title: 'ATLAS & the Data Science Ecosystem',
    lede: 'My own textbook. Classical methods through to generative AI, each one with a real case study, written so future-me can trust it.',
    stats: [['1', 'growing atlas'], ['Classical → GenAI', 'coverage'], ['∞', 'rewrites']],
    bullets: [
      'A practical collection of algorithmic techniques for learning and statistics, with worked real-world cases.',
      'Data Science Ecosystem is the sibling: maths, stats and computation applied to actual problems.',
      'My father calls this the third brain. He is not wrong and it stings.'
    ], photos: 1, links: [['Ecosystem', 'https://github.com/aleetreny/Data-Science-Ecosystem']], tags: ['R', 'Python', 'teaching']
  },
  'small-repos': {
    kicker: 'Code · The rest', when: 'nights, various', where: 'github.com/aleetreny',
    title: 'Grabaciones, c2-practice-log, finanzas, Present, Development',
    lede: 'The utilities. Each one exists because paying for the alternative annoyed me more than building it.',
    stats: [['20', 'repos total'], ['1', 'audio transcriber'], ['0', 'subscriptions replaced by choice']],
    bullets: [
      'Grabaciones: a macOS Whisper transcriber that organises my diary audio and outputs clean text. This site partly exists because of it.',
      'c2-practice-log: Cambridge C2 simulator with real exam banks, guided correction and adaptive review.',
      'finanzas: a private personal-finance PWA (Next.js + Supabase).',
      'Present: a personalised star chart, made as a gift. Not everything has to scale.',
      'Development: fast one-page apps for whatever the current obsession is.'
    ], photos: 1, links: [['All repos', 'https://github.com/aleetreny']], tags: ['tooling', 'Whisper', 'Next.js']
  },

  /* ───────────────── LAB BENCH ─────────────────
     Written by hand in both languages: these are the owner's own words, so the
     translator never gets a turn at them. Structure follows the rewritten
     workshop dossiers — running paragraphs, no metrics strip, no tag row. */
  'lab-l1': {
    kicker: { es: 'Laboratorio', en: 'Lab bench' },
    when: { es: 'Máster', en: 'MSc' },
    where: { es: 'Física de partículas', en: 'Particle physics' },
    title: { es: 'Detección de anomalías en el Trigger L1', en: 'L1 Trigger anomaly detection' },
    lede: {
      es: 'Autoencoders cuantizados para encontrar sucesos raros en un colisionador, con un presupuesto de microsegundos.',
      en: 'Quantised autoencoders finding rare events in a collider, on a budget of microseconds.',
    },
    bullets: [
      {
        es: 'Este proyecto sale de una de las asignaturas del máster y de una obsesión que arrastro desde hace años con la física de partículas. El problema de partida es de los que me encantan porque no es estadístico, es físico: un colisionador genera muchísimos más datos de los que se pueden guardar, así que hay un sistema, el trigger, que decide en microsegundos qué se conserva y qué se tira para siempre. Lo que no pasa ese filtro no existe.',
        en: 'This project comes out of one of the master\'s modules and an obsession with particle physics I have been carrying for years. The starting problem is the kind I love because it is not statistical, it is physical: a collider produces far more data than anyone can store, so a system called the trigger decides in microseconds what is kept and what is thrown away forever. Whatever does not pass that filter never existed.',
      },
      {
        es: 'Aquí aparece la parte interesante. Si lo que buscas es un suceso que nadie ha visto todavía, no puedes entrenar un clasificador, porque no tienes etiquetas de algo que aún no tiene nombre. Estás buscando precisamente lo que no supiste anotar.',
        en: 'And here is the interesting part. If what you are looking for is an event nobody has seen yet, you cannot train a classifier, because you have no labels for something that does not have a name yet. You are looking for exactly the thing you did not know how to write down.',
      },
      {
        es: 'La solución es darle la vuelta al planteamiento: entrenas un autoencoder únicamente con sucesos normales, de los aburridos, y le pides que aprenda a comprimirlos y reconstruirlos. Cuando llega algo que no se parece a nada de lo que ha visto, la reconstrucción sale mal, y ese error es la propia señal de alarma. No detectas la anomalía, detectas que el modelo no sabe explicarla.',
        en: 'The solution is to turn the framing around: you train an autoencoder only on ordinary, boring events and ask it to learn to compress and rebuild them. When something arrives that resembles nothing it has seen, the reconstruction comes out wrong, and that error is the alarm itself. You are not detecting the anomaly, you are detecting that the model cannot explain it.',
      },
      {
        es: 'La parte que de verdad cuesta es la cuantización. El modelo tiene que caber en hardware con una latencia fija, así que hay que bajar la precisión de los pesos hasta que entre, sin perder por el camino la capacidad de distinguir lo raro. Es un tira y afloja constante entre lo que el modelo querría y lo que el silicio permite.',
        en: 'The part that is genuinely hard is the quantisation. The model has to fit into hardware with a fixed latency, so you keep lowering the precision of the weights until it does, without losing the ability to tell odd from ordinary along the way. It is a constant tug of war between what the model would like and what the silicon allows.',
      },
      {
        es: 'Me quedo con que fue el primer proyecto donde la restricción no era estadística sino física. A un detector no le puedes pedir un segundo más, y esa frontera tan clara, lejos de agobiarme, me ordenó bastante la cabeza.',
        en: 'What I take from it is that this was the first project where the binding constraint was physical rather than statistical. You cannot ask a detector for another second, and that very clear boundary, far from stressing me out, tidied up my thinking quite a lot.',
      },
    ],
    photos: 0,
  },
  'lab-flows': {
    kicker: { es: 'Laboratorio', en: 'Lab bench' },
    when: { es: 'Máster', en: 'MSc' },
    where: { es: 'Densidades', en: 'Densities' },
    title: { es: 'Integración de fase neuronal con flujos normalizantes', en: 'Neural phase integration with normalising flows' },
    lede: {
      es: 'Flujos normalizantes biyectivos para integrar donde la cuadratura clásica se rinde.',
      en: 'Bijective normalising flows to integrate where classical quadrature gives up.',
    },
    bullets: [
      {
        es: 'Este es probablemente el proyecto más bonito que he programado, y también el que más veces he tenido que volver a entender desde cero. Lo he comprendido tres veces y lo he perdido dos, que viene siendo mi ritmo habitual con cualquier cosa que lleve un jacobiano dentro.',
        en: 'This is probably the most beautiful thing I have programmed, and also the one I have had to understand again from scratch the most times. I have grasped it three times and lost it twice, which is roughly my rate with anything that has a Jacobian inside it.',
      },
      {
        es: 'Un flujo normalizante es una cadena de transformaciones invertibles. Partes de una distribución que sabes muestrear en una línea, una normal de toda la vida, la vas pasando por esas transformaciones y al otro lado obtienes algo mucho más complicado. Lo importante es que, como cada paso es biyectivo, puedes seguir el rastro y calcular la densidad exacta del resultado. Nada de aproximar la constante de normalización y pedir perdón en el apéndice.',
        en: 'A normalising flow is a chain of invertible transformations. You start from a distribution you can sample in one line, a plain normal, push it through those transformations, and out the other side you get something far more complicated. The point is that because every step is bijective you can follow the trail back and compute the exact density of the result. No approximating the normalising constant and apologising in the appendix.',
      },
      {
        es: 'El uso concreto era integrar en dimensiones donde la cuadratura clásica no llega y el Monte Carlo de toda la vida simplemente tiene mucha paciencia. Visto así, aprender el cambio de variable es en realidad aprender dónde se molesta en vivir el integrando, para no gastar esfuerzo en el vacío.',
        en: 'The concrete use was integrating in dimensions where classical quadrature cannot reach and plain Monte Carlo is merely very patient. Seen that way, learning the change of variables is really learning where the integrand actually bothers to live, so you do not spend effort on empty space.',
      },
      {
        es: 'Todo el diseño gira alrededor de un determinante que tiene que salir barato de calcular, y por eso las arquitecturas son una discusión larguísima entre ser expresivo y ser tratable. Buena parte de lo que leí era gente perdiendo esa discusión de formas muy ingeniosas.',
        en: 'The whole design revolves around a determinant that has to stay cheap to compute, which is why the architectures are one long argument between being expressive and being tractable. A good part of what I read was people losing that argument in very ingenious ways.',
      },
    ],
    photos: 0,
  },
  'lab-grayscott': {
    kicker: { es: 'Laboratorio', en: 'Lab bench' },
    when: { es: 'Máster', en: 'MSc' },
    where: { es: 'Simulación', en: 'Simulation' },
    title: { es: 'Simulación de Gray–Scott, patrones de Turing', en: 'Gray–Scott simulation — Turing patterns' },
    lede: {
      es: 'Dos químicos, una ecuación de reacción-difusión y las manchas de todos los animales.',
      en: 'Two chemicals, one reaction–diffusion equation, and every spot on every animal.',
    },
    bullets: [
      {
        es: 'Este proyecto lo hice por puro gusto y sigue siendo al que vuelvo cuando quiero enseñarle a alguien por qué me dedico a esto. El modelo de Gray–Scott son dos reactivos, uno que alimenta al otro, difundiéndose a velocidades distintas. Nada más. Lo discretizas, lo dejas correr y de ahí salen rayas, lunares, laberintos y manchas que se replican solas.',
        en: 'I did this one for the pure pleasure of it and it is still where I go when I want to show someone why I do this for a living. The Gray–Scott model is two reagents, one feeding on the other, diffusing at different speeds. That is all. You discretise it, let it run, and out come stripes, spots, mazes and blobs that replicate on their own.',
      },
      {
        es: 'Lo propuso Turing en 1952 para explicar cómo un embrión, que empieza siendo una masa indiferenciada, decide dónde ponerse las marcas. Verlo pasar en un portátil es lo más parecido que he tenido nunca a ver crecer una ecuación.',
        en: 'Turing proposed it in 1952 to explain how an embryo, which starts out as an undifferentiated mass, decides where to put its markings. Watching it happen on a laptop is the closest I have ever come to seeing an equation grow.',
      },
      {
        es: 'La implementación en sí es un laplaciano por cada paso de tiempo y bastante paciencia con las condiciones de contorno. El trabajo de verdad está en el plano de parámetros: cambias el cuarto decimal de la tasa de alimentación y te sale otro animal completamente distinto. Te pasas las horas moviendo un número diminuto a ver qué bicho aparece.',
        en: 'The implementation itself is one Laplacian per timestep and a fair amount of patience with boundary conditions. The real work is in the parameter plane: change the fourth decimal of the feed rate and a completely different animal comes out. You spend hours nudging a tiny number to see what creature shows up.',
      },
      {
        es: 'Es la demostración más clara que conozco de que la complejidad no necesita una regla complicada. Vuelvo a este proyecto cada vez que un modelo mío se me está poniendo barroco.',
        en: 'It is the clearest demonstration I know that complexity does not require a complicated rule. I come back to this project whenever a model of mine is getting baroque on me.',
      },
    ],
    photos: 0,
  },
  'lab-epidemic': {
    kicker: { es: 'Laboratorio', en: 'Lab bench' },
    when: { es: 'Máster', en: 'MSc' },
    where: { es: 'Simulación', en: 'Simulation' },
    title: { es: 'Dinámica epidémica sobre una malla', en: 'Epidemic dynamics on a lattice' },
    lede: {
      es: 'Un modelo de contagio en dos dimensiones vectorizado con convoluciones, donde la geografía es el parámetro de verdad.',
      en: 'A vectorised 2D convolution model of contagion, where geography is the real parameter.',
    },
    bullets: [
      {
        es: 'El 2020 nos convirtió a todos en epidemiólogos aficionados, yo el primero. Este proyecto es volver a aquello unos años después, pero con las ecuaciones delante en vez de un titular.',
        en: '2020 turned all of us into amateur epidemiologists, myself first among them. This project is going back to that a few years later, but with the equations in front of me instead of a headline.',
      },
      {
        es: 'El planteamiento es sencillo y por eso me gusta: cada celda de la malla es una persona, el vecindario es un kernel, y el contagio no es más que lo que hace una convolución cuando la dejas correr. Ya está, no hay más truco.',
        en: 'The setup is simple, which is why I like it: every cell of the lattice is a person, the neighbourhood is a kernel, and contagion is nothing more than what a convolution does when you let it run. That is it, there is no further trick.',
      },
      {
        es: 'Lo bonito es que el número reproductivo deja de ser algo que tú escribes en un parámetro y pasa a ser algo que mides después, cuando la epidemia ya ha ocurrido. Emerge de cómo está colocada la gente, no de lo que tú supongas.',
        en: 'The lovely part is that the reproduction number stops being something you type into a parameter and becomes something you measure afterwards, once the epidemic has already happened. It emerges from how the people are arranged, not from what you assumed.',
      },
      {
        es: 'Lo escribí vectorizado a propósito: toda la epidemia es una convolución por paso, así que sale barato de ejecutar y puedes barrer los parámetros en lugar de discutirlos. Y ahí es donde se ve lo que un modelo compartimental esconde, que el espacio no es un término molesto que quitarse de encima. La misma infecciosidad dibuja curvas completamente distintas según cómo esté distribuida la población.',
        en: 'I wrote it vectorised on purpose: the whole epidemic is one convolution per step, so it is cheap to run and you can sweep the parameters instead of arguing about them. And that is where you see what a compartmental model hides, which is that space is not some nuisance term to get rid of. The same infectiousness draws completely different curves depending on how the population is laid out.',
      },
    ],
    photos: 0,
  },
  'lab-kepler': {
    kicker: { es: 'Laboratorio', en: 'Lab bench' },
    when: { es: 'Máster', en: 'MSc' },
    where: { es: 'Astronomía', en: 'Astronomy' },
    title: { es: 'PCA y MDS sobre Kepler, agrupando exoplanetas', en: 'Kepler PCA & MDS — clustering exoplanets' },
    lede: {
      es: 'Reducción de dimensionalidad sobre el catálogo de exoplanetas para ver qué mundos se parecen entre sí.',
      en: 'Dimensionality reduction over the exoplanet catalogue, to see which worlds resemble each other.',
    },
    bullets: [
      {
        es: 'Este proyecto me hizo especial ilusión porque llevo años sacando el telescopio por gusto, mucho antes de que nada de esto contase para una nota. Era la primera vez que mirar el cielo me producía un gráfico, y me temo que el hobby no se ha recuperado del todo.',
        en: 'This project was a particular joy because I have been taking the telescope out for fun for years, long before any of this counted towards a mark. It was the first time that looking at the sky produced a plot, and I am afraid the hobby has not fully recovered.',
      },
      {
        es: 'El catálogo de Kepler te entrega miles de planetas confirmados descritos por su periodo orbital, su radio, la insolación que reciben, la estrella que los acompaña y unas cuantas cosas más. Son demasiados ejes para sostenerlos en la cabeza a la vez, así que la única forma de mirarlos en conjunto es aplastarlos con cuidado.',
        en: 'The Kepler catalogue hands you thousands of confirmed planets described by orbital period, radius, the insolation they receive, the star they belong to and a few more things. That is too many axes to hold in your head at once, so the only way to look at them together is to flatten them carefully.',
      },
      {
        es: 'Usé dos métodos a propósito. El PCA busca las direcciones en las que los datos realmente varían, y el MDS intenta conservar las distancias entre mundos y aplastar todo lo demás. Hacer los dos no es redundante, es la forma de preguntarle a los datos si la estructura que ves es real o es un recuerdo del método que has elegido.',
        en: 'I used two methods on purpose. PCA looks for the directions the data actually varies along, and MDS tries to preserve the distances between worlds and flatten everything else. Running both is not redundant, it is how you ask the data whether the structure you are seeing is real or a souvenir of the method you picked.',
      },
      {
        es: 'Lo que sale son familias: los calientes y enormes en una esquina, los pequeños y fríos en otra. Pero cruzando el gráfico por el medio está también el sesgo del propio telescopio, porque un instrumento que detecta tránsitos encuentra lo que un instrumento que detecta tránsitos es capaz de ver. Media interpretación consiste en separar el universo del aparato con el que lo estás mirando.',
        en: 'What comes out is families: the hot and enormous in one corner, the small and cold in another. But running straight across the middle of the plot is the telescope\'s own bias, because an instrument that detects transits finds what an instrument that detects transits is able to see. Half the interpretation is separating the universe from the device you are looking at it with.',
      },
    ],
    photos: 0,
  },
  'lab-particles': {
    kicker: { es: 'Laboratorio', en: 'Lab bench' },
    when: { es: 'Máster', en: 'MSc' },
    where: { es: 'Grafos', en: 'Graphs' },
    title: { es: 'Seguimiento de partículas con redes de grafos cuánticas', en: 'Particle tracking with quantum graph networks' },
    lede: {
      es: 'Reconstruir trayectorias como si fueran un problema de grafos, con una capa cuántica de por medio.',
      en: 'Reconstructing trajectories as a graph problem, with a quantum layer in the middle.',
    },
    bullets: [
      {
        es: 'Un detector no te da trayectorias, te da una nube de impactos y ninguna pista de cuál pertenece a qué partícula. La idea del proyecto es cambiar la forma de mirar el problema: cada impacto pasa a ser un nodo, cada enlace plausible entre dos impactos pasa a ser una arista, y de repente reconstruir trayectorias se convierte en clasificar aristas.',
        en: 'A detector does not give you trajectories, it gives you a cloud of hits and no clue which belongs to which particle. The idea of the project is to change how you look at the problem: every hit becomes a node, every plausible link between two hits becomes an edge, and suddenly reconstructing tracks turns into classifying edges.',
      },
      {
        es: 'La red va pasando mensajes entre nodos vecinos hasta que las aristas que sobreviven deletrean las trayectorias reales. Es un cambio de representación precioso, porque el problema físico no se ha movido, solo lo estás mirando desde otro sitio.',
        en: 'The network passes messages between neighbouring nodes until the surviving edges spell out the real trajectories. It is a beautiful change of representation, because the physical problem has not moved at all, you are just looking at it from somewhere else.',
      },
      {
        es: 'La parte cuántica sustituye un trozo de eso por un circuito parametrizado. No porque hoy sea más rápido, que no lo es, sino porque me parece que merece la pena entender cómo se codifica la información ahí dentro antes de que lo sea.',
        en: 'The quantum part replaces a piece of that with a parameterised circuit. Not because it is faster today, because it is not, but because I think it is worth understanding how information gets encoded in there before it is.',
      },
      {
        es: 'El enemigo real, en cualquier caso, es la combinatoria. El número de aristas candidatas explota muchísimo antes de que la física se ponga interesante, así que casi todo el esfuerzo se va en construir un grafo sensato, no en entrenar sobre él.',
        en: 'The real enemy, in any case, is combinatorics. The number of candidate edges explodes long before the physics gets interesting, so almost all the effort goes into building a sane graph rather than training on it.',
      },
      {
        es: 'Este fue el proyecto en el que dejé de imaginarme los datos como una tabla. Hay cosas que son relaciones antes que filas, y una vez lo ves ya no puedes dejar de verlo en cualquier esquema de base de datos.',
        en: 'This was the project where I stopped picturing data as a table. Some things are relations before they are rows, and once you see that you cannot stop seeing it in any database schema.',
      },
    ],
    photos: 0,
  },
  'lab-ica': {
    kicker: { es: 'Laboratorio', en: 'Lab bench' },
    when: { es: 'Máster', en: 'MSc' },
    where: { es: 'Señales', en: 'Signals' },
    title: { es: 'Análisis de Componentes Independientes y el índice de Fisher', en: 'Independent Component Analysis & the Fisher index' },
    lede: {
      es: 'Separar señales independientes de una mezcla y después medir cuánta información lleva cada una.',
      en: 'Pulling independent signals out of a mixture, then measuring how much information each one carries.',
    },
    bullets: [
      {
        es: 'El problema clásico de esto es el del cóctel: varias personas hablando a la vez, varios micrófonos repartidos por la sala, y ninguna etiqueta que te diga qué voz es cuál. Lo único que tienes es la mezcla, y aun así se pueden recuperar las voces originales.',
        en: 'The classic version of this is the cocktail party problem: several people talking at once, several microphones around the room, and no label telling you which voice is which. All you have is the mixture, and even so the original voices can be recovered.',
      },
      {
        es: 'Un PCA te habría dado componentes incorreladas y se habría parado ahí. El ICA va a por algo bastante más ambicioso, que es la independencia estadística de verdad. Y aquí está lo que más me gustó de la asignatura: eso solo es identificable si las fuentes no son gaussianas. El caso gaussiano es justo el único donde el método entero se cae, y entender por qué es prácticamente toda la lección.',
        en: 'A PCA would have given me uncorrelated components and stopped there. ICA goes after something rather more ambitious, which is genuine statistical independence. And here is what I liked most about the module: that is only identifiable if the sources are non-Gaussian. The Gaussian case is precisely the one place where the whole method collapses, and understanding why is basically the entire lesson.',
      },
      {
        es: 'Encima de eso añadí el índice de información de Fisher, para poder ordenar las componentes por lo que de verdad te cuentan y no por lo alto que suenan. Que una señal domine la mezcla no significa que sea la que lleva la información.',
        en: 'On top of that I added the Fisher information index, so the components could be ranked by what they actually tell you rather than by how loud they are. A signal dominating the mixture does not mean it is the one carrying the information.',
      },
      {
        es: 'Me llevé de aquí una manía que ya no se me ha quitado: "independiente" es una afirmación muchísimo más fuerte que "incorrelado", y casi todo el mundo los usa como sinónimos. Yo también lo hacía, hasta este proyecto.',
        en: 'I came out of this with a pedantry I have not shaken since: "independent" is a far stronger claim than "uncorrelated", and almost everybody uses the two as synonyms. I did too, until this project.',
      },
    ],
    photos: 0,
  },
  'lab-qtrading': {
    kicker: { es: 'Laboratorio', en: 'Lab bench' },
    when: { es: 'Máster', en: 'MSc' },
    where: { es: 'Refuerzo', en: 'Reinforcement' },
    title: { es: 'Deep Q-Trading', en: 'Deep Q-Trading' },
    lede: {
      es: 'Aprendizaje por refuerzo suelto sobre tickers reales, hecho por alguien que ya perdió dinero a mano.',
      en: 'Reinforcement learning let loose on real tickers, by someone who has already lost money the manual way.',
    },
    bullets: [
      {
        es: 'Empecé a invertir a los 19, en el mercado más ruidoso posible, y aprendí la psicología del dinero por la vía cara. Este proyecto es la versión con supervisión académica de aquella curiosidad.',
        en: 'I started investing at 19, in the loudest possible market, and learned the psychology of money the expensive way. This project is the academically supervised version of that curiosity.',
      },
      {
        es: 'La gracia del aprendizaje por refuerzo es que al agente nunca le das la regla, solo la recompensa. Le pasas el estado del mercado, él elige una acción, y poco a poco va construyendo una función que estima lo que valen comprar, vender o quedarse quieto. Nadie le ha explicado qué es una tendencia, la deduce o no la deduce.',
        en: 'The point of reinforcement learning is that you never give the agent the rule, only the reward. You hand it the state of the market, it picks an action, and little by little it builds a function estimating what buying, selling or sitting still are worth. Nobody has explained to it what a trend is; it works that out or it does not.',
      },
      {
        es: 'La parte honesta del proyecto es el backtest, y es donde se cae la mitad de lo que uno lee por internet. Costes de transacción, prohibido mirar el día siguiente, y comprar y mantener ahí puesto como referencia, que es muchísimo más difícil de batir de lo que parece en una clase.',
        en: 'The honest part of the project is the backtest, and it is where half of what you read online falls apart. Transaction costs, no peeking at tomorrow, and buy-and-hold sitting right there as the baseline, which is far harder to beat than a lecture makes it look.',
      },
      {
        es: 'Lo que más me sirvió no fue el resultado sino la asimetría que ya conocía de antes: perder duele varias veces más de lo que gustan las ganancias, y no deja de ser verdad porque sepas ponerle nombre al sesgo. Que es exactamente el motivo por el que me fío más de una política con una función de recompensa escrita que de mí mismo a las dos de la mañana.',
        en: 'What served me most was not the result but the asymmetry I already knew about: losing hurts several times more than winning feels good, and it does not stop being true just because you can name the bias. Which is exactly why I trust a policy with a written reward function more than I trust myself at two in the morning.',
      },
    ],
    photos: 0,
  },

  /* ───────────────── WORLD ───────────────── */
  'w-paraguay': { kicker: 'World · The big one', when: '2025', where: 'Paraguay', title: 'Paraguay', lede: 'Three months, not three weeks. The difference between the two is the whole point.', stats: [['3 months', 'lived'], ['Asunción', 'base'], ['Mercado 4', 'best afternoon']], bullets: ['Volunteering with Fundación Alda, working with children.', 'The market where you can dress yourself for ten euros, the food, the heat, the way plans dissolve.', 'Came back with photographs that won a prize and a much less fragile sense of what is difficult.'], photos: 3, tags: ['South America', 'volunteering'] },
  'w-norway': { kicker: 'World', when: '2026', where: 'Norway', title: 'Fjords, aurora and a snowboard', lede: 'Bergen, the fjords, the northern lights and a week of light behaving wrongly.', stats: [['Aurora', 'seen'], ['Fjords', 'plural'], ['Snowboard', 'survived']], bullets: ['The trip I had been describing in my diary since 2021: green cliffs, blue water, brine on the face.', 'Snowboarding lesson of the year, courtesy of a friend: falling is the prize. Stop standing on the little slope.'], photos: 3, tags: ['Nordics', 'winter'] },
  'w-slovakia': { kicker: 'World · A year', when: '2023', where: 'Slovakia', title: 'Bratislava', lede: 'Erasmus base camp, and the first place that was mine rather than my family\'s.', stats: [['1 year', 'resident'], ['Danube', 'commute'], ['Comenius', 'university']], bullets: ['Living, not visiting: a flat, a supermarket, a routine, a group.', 'The launchpad for every Central European trip on this board.'], photos: 3, tags: ['Erasmus', 'Central Europe'] },
  'w-austria': { kicker: 'World', when: '2023 · 2024', where: 'Austria', title: 'Vienna & Tirol', lede: 'The most repeated destination on the board: Vienna for the city, Tirol for the mountains.', stats: [['Vienna', '×4 at least'], ['Tirol', 'the Alps'], ['Coffee', 'the excuse']], bullets: ['Vienna in every season, mostly by cheap bus from Bratislava.', 'Tirol for snow, valleys and the specific silence of a mountain in the morning.'], photos: 2, tags: ['Alps', 'cities'] },
  'w-czech': { kicker: 'World', when: '2023', where: 'Czechia & Poland', title: 'Prague, Kraków, Warsaw', lede: 'The interrail spine of the Erasmus year.', stats: [['3', 'capitals'], ['1', 'night bus too many'], ['Kraków', 'the favourite']], bullets: ['Prague repeatedly, Kraków and Warsaw once and properly.', 'Where I learned that a city at 6am after a bus is a completely different city.'], photos: 2, tags: ['Central Europe', 'rail'] },
  'w-hungary': { kicker: 'World', when: '2023', where: 'Hungary', title: 'Budapest', lede: 'Baths, ruin bars, a parliament lit up at night that stopped a conversation dead.', stats: [['Danube', 'again'], ['Baths', 'mandatory'], ['1', 'lit parliament']], bullets: ['One of the trips where the group made the city rather than the reverse.', 'Diary entry from Budapest is mostly laughter transcribed badly.'], photos: 2, tags: ['Central Europe'] },
  'w-lithuania': { kicker: 'World', when: '2023', where: 'Lithuania', title: 'Vilnius & Kaunas', lede: 'Erasmus+ exchange, and the Baltic surprise nobody warns you about.', stats: [['Erasmus+', 'programme'], ['2', 'cities'], ['LT', 'stamp']], bullets: ['Youth exchange with six nationalities in one building.', 'Kaunas stayed with me longer than Vilnius, which nobody believes.'], photos: 2, tags: ['Baltics', 'Erasmus+'] },
  'w-bulgaria': { kicker: 'World', when: '2023', where: 'Bulgaria', title: 'Sofia', lede: 'The second Erasmus+ exchange, and my first proper look at Europe\'s edges.', stats: [['Sofia', 'base'], ['2 weeks', 'stay'], ['BG', 'stamp']], bullets: ['Workshops by day, arguments about the EU by night, in English, badly, brilliantly.'], photos: 2, tags: ['Balkans', 'Erasmus+'] },
  'w-nordics': { kicker: 'World', when: '2025 · 2026', where: 'Sweden, Denmark, Norway', title: 'Copenhagen, Lund, Oslo, Stockholm', lede: 'The Nordic research trip that produced my private index of student cities.', stats: [['4', 'cities'], ['10', 'indicators invented'], ['Lund', 'the winner]']], bullets: ['Copenhagen for self-organised events, Lund for the nations and the open notebooks, Oslo for everything working, Stockholm for the archipelago.', 'This is where the Treny Index of Urban Student Epicness™ comes from. Zones of vibe, micro-plans, picnic-ability, weekly re-enchantment.'], photos: 2, tags: ['Nordics', 'cities'] },
  'w-uk': { kicker: 'World', when: '2023 → now', where: 'UK', title: 'London & Edinburgh', lede: 'The city I keep returning to and the one that surprised me most. Next year one of them becomes home.',
    stats: [['London', 'next home'], ['Edinburgh', 'best walk'], ['Dean Village', 'the specific spot']], bullets: ['London in pubs, which is where the best random conversations in Europe happen.', 'Edinburgh for the day-after-a-long-night calm — the exact thing I score cities on.'], photos: 2, tags: ['UK', 'cities'] },
  'w-france': { kicker: 'World', when: 'various', where: 'France', title: 'Strasbourg, Paris and the family side', lede: 'Half my mother tongue lives here. Strasbourg for the Parliament, the rest for the language.', stats: [['FR', 'native tongue'], ['Strasbourg', 'EYE2025'], ['Paris', 'the obvious one']], bullets: ['Strasbourg for the European Youth Event.', 'French is native but France is still foreign to me, which is a strange and useful position.'], photos: 2, tags: ['France', 'EU'] },
  'w-benelux': { kicker: 'World', when: '2023 · 2025', where: 'Belgium', title: 'Brussels', lede: 'The institutional Europe trip: buildings where the acronyms live.', stats: [['EU', 'quarter'], ['Waffles', 'obviously'], ['2', 'visits']], bullets: ['Between EYE2025 and Erasmus+ paperwork, I have seen more of the EU quarter than most tourists.'], photos: 1, tags: ['Belgium', 'EU'] },
  'w-italy': { kicker: 'World', when: 'various', where: 'Italy', title: 'Rome, Venice, Sardinia', lede: 'Italy in three modes: the museum, the impossible city and the island.', stats: [['Rome', 'the classic'], ['Venice', 'the strange one'], ['Sardinia', 'the swim']], bullets: ['Sardinia is the one I would go back to tomorrow: cliffs, water, no plan.', 'Venice as a place that should not work and does.'], photos: 2, tags: ['Italy', 'Mediterranean'] },
  'w-croatia': { kicker: 'World', when: '2024', where: 'Croatia', title: 'Croatia', lede: 'Coast, islands, water clear enough to be suspicious.', stats: [['Adriatic', 'the sea'], ['Islands', 'hopped'], ['1', 'sunburn']], bullets: ['The Mediterranean I grew up on, rearranged into a different alphabet.'], photos: 2, tags: ['Balkans', 'coast'] },
  'w-greece': { kicker: 'World', when: '2023', where: 'Greece', title: 'Greece', lede: 'Where half the words in my degree come from.', stats: [['Athens', 'base'], ['Islands', 'the reason'], ['Feta', 'volume']], bullets: ['The trip that made ancient history feel like geography instead of a syllabus.'], photos: 1, tags: ['Mediterranean'] },
  'w-portugal': { kicker: 'World', when: '2025', where: 'Portugal', title: 'Lisbon & Porto', lede: 'The neighbours. Same peninsula, entirely different temperature of melancholy.', stats: [['Lisbon', 'hills'], ['Porto', 'the river'], ['Pastéis', 'many']], bullets: ['Closest thing to home that still surprises me.'], photos: 1, tags: ['Iberia'] },
  'w-morocco': { kicker: 'World', when: '2021 → 2026', where: 'Morocco', title: 'Morocco', lede: 'An hour from Andalucía and a different world. Repeatedly.', stats: [['1h', 'from Tarifa'], ['Tangier', 'entry point'], ['n', 'teas']], bullets: ['The most consequential short trip available from Málaga.', 'The reason I stopped rating distance as a proxy for adventure.'], photos: 2, tags: ['Africa'] },
  'w-usa': { kicker: 'World', when: '2022', where: 'USA', title: 'Vegas → Palm Springs → Miami → New York',
    lede: 'The road trip I had been writing about wanting: a van, a desert, and a plan invented daily.',
    stats: [['36h', 'awake, flying home'], ['4', 'cities'], ['1', 'desert crossed']], bullets: ['Vegas to Palm Springs by road, then the east coast.', 'Manhattan food courts with views of Jersey City, talking about volunteering with strangers in matching shirts.', 'Flew home for 36 hours without sleeping and went straight into a week of existential clarity.'], photos: 3, tags: ['USA', 'road trip'] },
  'w-canarias': { kicker: 'World', when: 'recurring', where: 'Canary Islands', title: 'Canarias', lede: 'A colour that exists nowhere else on the Spanish spectrum. My most repeated non-mainland destination.', stats: [['4', 'islands'], ['Recurring', 'frequency'], ['1', 'flag in the bio']], bullets: ['Tenerife, Gran Canaria, Lanzarote — volcano, water, wind.', 'Enough of a habit that the Canarian flag ended up in my bio as a running joke.'], photos: 2, tags: ['Spain', 'islands'] },
  'w-andalucia': { kicker: 'World · Home', when: 'always', where: 'Andalucía', title: 'Málaga, Ronda, Tarifa, Sevilla, Granada',
    lede: 'The base. World-class climate, food and people, and the only humour I fully understand.',
    stats: [['1', 'vegetable patch'], ['Tarifa', 'the wind'], ['Ronda', 'the drive']], bullets: ['Valdevaquero and Tarifa for wind and water, Ronda for the road, Sierra Nevada for snow, Granada and Sevilla for everything else.', 'Almayate and Torre del Mar are where the diary was mostly written — a mountain path behind the urbanisation that I found by refusing to follow the map.', 'Diary, 2022: "I want to live somewhere with countryside, with a vegetable patch." Still the plan. London is a chapter, not a destination.'], photos: 3, tags: ['Spain', 'home'] },
  'w-nevada': { kicker: 'World · Snow', when: 'yearly', where: 'Sierra Nevada', title: 'Sierra Nevada & the Alps', lede: 'The annual snowboard pilgrimage, plus Andorra and Tirol when the budget allows.', stats: [['Yearly', 'ritual'], ['3', 'ranges'], ['1', 'goal: bigger falls']], bullets: ['Snowboarding as the one sport where I am happy to be visibly bad and improving.', 'Sierra Nevada is two hours from the beach, which is a fact I use in arguments about where to live.'], photos: 2, tags: ['snow', 'sport'] },

  /* ───────────────── ELSE ───────────────── */
  'podcast': {
    kicker: 'Making things', when: '2025 →', where: 'Málaga / Madrid',
    title: 'Un Poco Absurdo — the podcast',
    lede: 'Tech and philosophy, named accurately. One hundred-plus listeners an episode and five stars three months in.',
    stats: [['100+', 'listeners / ep'], ['★★★★★', 'rating'], ['3 months', 'to get there']],
    bullets: [
      'The format I had wanted since I started recording voice notes into my diary instead of writing them.',
      'Constancy is the actual skill — I learned it from five years of a diary nobody was reading.',
      'Recording is also why I built Grabaciones, a Whisper transcriber that cleans up audio into text.'
    ], photos: 2, tags: ['podcast', 'philosophy', 'tech']
  },
  'diary': {
    kicker: 'The long project', when: '2021 → now', where: 'everywhere',
    title: 'Five years of a weekly diary',
    lede: 'Around 480 entries, each dated and star-rated, from a Sunday in April 2021 to this week. The longest-running dataset I own and the reason this site sounds like me.',
    stats: [['~480', 'entries'], ['5', 'years unbroken'], ['⭐️–⭐️⭐️⭐️', 'own rating scale']],
    bullets: [
      'Started as daily, became weekly, became audio, became a system: a running to-do list of interesting moments so Sunday-me is not staring at a blank page.',
      'It is where the quantified-life habit comes from: I once scored money, mental health, physical health and relationships from −1 to 1 and wrote myself a corrective plan. The plan was "see friends three days a week". It worked.',
      'Not published, and not going to be. It is the source, not the product.',
      'Constancy learned here is the only reason anything else on this board got finished.'
    ], photos: 1, tags: ['writing', 'systems', 'Notion']
  },
  'garden': {
    kicker: 'Obsessions', when: 'ongoing', where: 'Almayate',
    title: 'The vegetable patch',
    lede: 'The least abstract thing I own. I plant it, it grows, I eat it, no dashboard required.',
    stats: [['1', 'huerto'], ['0', 'models fitted'], ['∞', 'patience required']],
    bullets: ['Horticulture as the counterweight to a job made entirely of abstractions.', 'Part of a longer plan: countryside, not just a green urbanisation.'],
    photos: 2, tags: ['horticulture', 'slow']
  },
  'telescope': {
    kicker: 'Obsessions', when: 'ongoing', where: 'dark skies',
    title: 'Astro-analytics',
    lede: 'Telescope out, patterns in. I studied the cosmos for pleasure years before it appeared on a transcript.',
    stats: [['1', 'telescope'], ['Kepler', 'catalogue read for fun'], ['0', 'credits, originally']],
    bullets: ['The hobby that quietly turned into a coursework project and then into a research interest.', 'Also want to be able to navigate by stars without a phone. See: apocalypse notebook.'],
    photos: 2, tags: ['astronomy', 'curiosity']
  },
  'racket': {
    kicker: 'Obsessions', when: 'weekly', where: 'any court',
    title: 'Padel, pickleball and an unreasonable competitive streak',
    lede: 'Racket sports weekly, plus volleyball, spikeball, bowling, billiards and any game with a scoreboard.',
    stats: [['169', 'best bowling game'], ['Weekly', 'padel'], ['1', 'problem: I want to win]']],
    bullets: ['Padel and pickleball are the fixed points of my week.', 'Also volleyball on the beach, spikeball, table football, and a Catan habit that is starting to cost me friendships.'],
    photos: 2, tags: ['sport', 'padel', 'games']
  },
  'apocalypse': {
    kicker: 'Obsessions', when: 'ongoing', where: 'a real notebook',
    title: 'The apocalypse notebook',
    lede: 'A genuine document I keep. Partly a survival plan, mostly an excuse to learn things that do not need electricity.',
    stats: [['8', 'phases'], ['1', 'fish caught (seaweed)'], ['0', 'panic']],
    bullets: [
      'Water sourcing, non-perishables, wooden construction with hand tools, maps of reservoirs and pharmacies, card games for morale.',
      'Phase eight of the plan is "learn, read, study, enjoy life", which tells you it was never really about the apocalypse.',
      'I want to fish, shoot, and navigate by stars for the same reason: every skill that does not depend on a device is a hedge, and hedges are fun.'
    ], photos: 1, tags: ['survival', 'skills', 'sci-fi']
  },
  'genome': {
    kicker: 'Obsessions', when: '2023', where: 'Málaga',
    title: 'I sequenced my own DNA to settle an argument',
    lede: 'Bought a test, downloaded the raw data, ran it through a second service for the interesting reports. My father called it a scam. It is not.',
    stats: [['1%', 'of DNA that differs'], ['14', 'reports read'], ['1', 'sceptical father']],
    bullets: [
      'Ancestry, behavioural genetics, fitness and injury risk, nutrition, pharmacogenetics, sleep, longevity.',
      'The point was not the results, it was understanding the inference: correlate a trait against a sequence across enough people and you get a propensity, not a destiny.',
      'Same instinct as everything else here — if a claim is quantifiable, I want to see the estimator.'
    ], photos: 1, tags: ['genetics', 'quantified self']
  },
  'investing': {
    kicker: 'Obsessions', when: '2021 →', where: 'a screen',
    title: 'Investing, and the psychology of money',
    lede: 'Started at 19 in the loudest possible market. Learned that losing hurts several times more than winning feels good, with real money, on schedule.',
    stats: [['2021', 'tuition year'], ['−30%', 'the week that taught me'], ['1', 'rule: strategy first']],
    bullets: [
      'Crypto and equities from 19, including a week where everything fell 30% and my account was still up — and I felt terrible anyway.',
      'That asymmetry is now the single most useful thing I know about human behaviour, and it shows up in every risk model I build.',
      'Quantitative finance is still the itch: stochastic processes, algorithmic strategies, and Deep Q-Trading as the sanctioned version.'
    ], photos: 1, tags: ['finance', 'behaviour', 'risk']
  },
  'lasik': {
    kicker: 'Obsessions · Body', when: 'Sep 2023', where: 'Málaga',
    title: '−5.75 to 110% vision in five minutes',
    lede: 'Had my eyes lasered. Walked out seeing. Spent the recovery week listening to audio drama and appreciating my most important organ.',
    stats: [['−5.75', 'before'], ['110%', 'at the check-up'], ['5 min', 'in theatre']],
    bullets: [
      'Stressful, not painful. Best trade-off I have ever accepted.',
      'Diary: "I would rather lose hearing, touch, an arm, taste or smell than lose sight." Eyes are the main input channel and I now treat them that way.'
    ], photos: 1, tags: ['body', 'decisions']
  },
  'contact': {
    kicker: 'Reachable', when: 'always', where: 'Madrid → London',
    title: 'Say something strange',
    lede: 'Fastest reply if your message contains a question nobody has asked me before.',
    stats: [['ES / FR / EN', 'languages'], ['Madrid', 'now'], ['London', 'Oct 2026']],
    bullets: ['Email is best. GitHub if it is about code. LinkedIn if it must be formal.'],
    links: [['alejandrotreny100@gmail.com', 'mailto:alejandrotreny100@gmail.com'], ['github.com/aleetreny', 'https://github.com/aleetreny'], ['linkedin.com/in/aleetreny', 'https://linkedin.com/in/aleetreny']],
    photos: 0, tags: ['contact']
  }
};

export const ORDER = Object.keys(ITEMS);
