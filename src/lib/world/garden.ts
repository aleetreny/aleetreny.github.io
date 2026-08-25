// The seeds, and how long each of them takes.
//
// Growth runs on the wall clock, not on how long the tab was open: a plant is
// a promise that something will have happened by the time you come back, and a
// timer that only counts while you are watching is not that.
//
// The numbers are compressed from the real ones but they keep their order — a
// radish beats a sunflower, basil germinates before a carrot — because the
// point is that different seeds behave differently, not that they are fast.

export type Species = {
  id: string;
  label: { es: string; en: string };
  /** Hours before anything shows above the soil. */
  germ: number;
  /** Hours from sowing to fully grown. */
  grow: number;
  /** Hours it can go without water before it starts to slow down. */
  thirst: number;
  /** The two greens and the fruit colour it is drawn in. */
  leaf: string;
  leaf2: string;
  fruit: string;
  /** How the grown plant is built. */
  form: 'vine' | 'bush' | 'root' | 'rosette' | 'herb' | 'tall';
};

export const SPECIES: Species[] = [
  { id: 'tomato', label: { es: 'Tomate', en: 'Tomato' }, germ: 8, grow: 168, thirst: 22, leaf: '#4f8043', leaf2: '#63a052', fruit: '#c8402e', form: 'vine' },
  { id: 'pepper', label: { es: 'Pimiento', en: 'Pepper' }, germ: 14, grow: 200, thirst: 26, leaf: '#3f7038', leaf2: '#568c48', fruit: '#3f9b4a', form: 'bush' },
  { id: 'carrot', label: { es: 'Zanahoria', en: 'Carrot' }, germ: 12, grow: 150, thirst: 30, leaf: '#5f9b4e', leaf2: '#7bb862', fruit: '#dd7326', form: 'root' },
  { id: 'lettuce', label: { es: 'Lechuga', en: 'Lettuce' }, germ: 5, grow: 96, thirst: 16, leaf: '#79b25a', leaf2: '#96c974', fruit: '#a9d489', form: 'rosette' },
  { id: 'basil', label: { es: 'Albahaca', en: 'Basil' }, germ: 6, grow: 110, thirst: 14, leaf: '#3d7a3d', leaf2: '#549850', fruit: '#8fc07f', form: 'herb' },
  { id: 'strawberry', label: { es: 'Fresa', en: 'Strawberry' }, germ: 16, grow: 190, thirst: 20, leaf: '#4a8443', leaf2: '#62a256', fruit: '#d63a4a', form: 'rosette' },
  { id: 'sunflower', label: { es: 'Girasol', en: 'Sunflower' }, germ: 9, grow: 220, thirst: 24, leaf: '#4c7f3c', leaf2: '#67a04f', fruit: '#e9b93a', form: 'tall' },
];

export function speciesOf(id: string): Species {
  return SPECIES.find((s) => s.id === id) ?? SPECIES[0];
}

const HOUR = 3600_000;

export type Growth = {
  /** 0 – 1 of the way to fully grown. */
  stage: number;
  /** Has anything come up yet? */
  up: boolean;
  /** 0 – 1, where 1 is just watered. */
  moisture: number;
  /** Hours it has been dry past what it can take. */
  parched: number;
  ripe: boolean;
};

/** Where a plant is right now, from two timestamps and the clock. */
export function growthOf(species: Species, plantedAt: string, wateredAt: string, now = Date.now()): Growth {
  const planted = new Date(plantedAt).getTime();
  const watered = new Date(wateredAt).getTime();
  const age = Math.max(0, (now - planted) / HOUR);
  const since = Math.max(0, (now - watered) / HOUR);
  const parched = Math.max(0, since - species.thirst);
  // Drought slows growth; it never kills it. A visitor who plants something and
  // never comes back should still find it alive, only behind.
  const effective = Math.max(0, age - parched * 0.55);
  return {
    stage: Math.min(1, effective / species.grow),
    up: effective >= species.germ,
    moisture: Math.max(0, 1 - since / (species.thirst * 1.6)),
    parched,
    ripe: effective >= species.grow,
  };
}

/** How long ago, in the fewest words that are still true. */
export function ago(iso: string, now = Date.now()): string {
  const ms = Math.max(0, now - new Date(iso).getTime());
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}
