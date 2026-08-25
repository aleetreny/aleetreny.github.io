// What the visitors leave, and where it goes.
//
// Four things on this board outlive the tab they were made in: a note, a plant,
// an answer, a vote. When the board is wired to its database they go there and
// everybody shares them. When it is not — a fork with no services, the offline
// safe copy, a local `pnpm dev` — they go into this browser instead, and every
// object above them behaves exactly the same.
//
// That is not a stub. A portfolio that only half-works without a backend is a
// portfolio that half-works, and the whole repository is built the other way
// round: fixtures first, services as an upgrade.

import type { Json } from '../../types/database';
import { getNeonClient } from '../neon';
import { readLocal, visitorId, writeLocal } from './visitor';

export type VisitorNote = {
  id: string;
  body: string;
  lang: string;
  visitor: string;
  hidden: boolean;
  at: string;
};

export type Plant = {
  id: string;
  species: string;
  plantedAt: string;
  wateredAt: string;
  waterings: number;
};

export type CuriosityQuestion = { id: string; prompt: unknown; active: boolean; position: number };
export type CuriosityAnswer = {
  id: string; questionId: string; body: string; lang: string; visitor: string; hidden: boolean; at: string;
};
export type VoteTally = { cooperate: number; betray: number };
export type VoteChoice = 'cooperate' | 'betray';

const NOTES_KEY = 'board.notes';
const PLOT_KEY = 'board.garden.plot';
const MINE_KEY = 'board.garden.mine';
const ANSWERS_KEY = 'board.curiosity.answers';
const VOTES_KEY = 'board.votes';
const MY_VOTE_KEY = 'board.vote.mine';

/** Where this board is actually writing. Shown to the owner, so a moderation
 *  list that is only ever going to hold their own browser says so. */
export type Backing = 'remote' | 'local';

let backing: Backing | null = null;

export function currentBacking(): Backing {
  return backing ?? 'local';
}

async function client() {
  try {
    const found = await getNeonClient();
    backing = found ? 'remote' : 'local';
    return found;
  } catch {
    backing = 'local';
    return null;
  }
}

const nowIso = () => new Date().toISOString();
const newId = () => {
  try { return crypto.randomUUID(); } catch { return `l-${Math.random().toString(36).slice(2)}`; }
};

// ------------------------------------------------------------------- notes

export async function addNote(body: string, lang: string): Promise<VisitorNote> {
  const note: VisitorNote = {
    id: newId(), body: body.slice(0, 600), lang, visitor: visitorId(), hidden: false, at: nowIso(),
  };
  const neon = await client();
  if (neon) {
    const { error } = await neon.from('visitor_notes')
      .insert({ body: note.body, lang: note.lang, visitor: note.visitor });
    if (!error) return note;
  }
  writeLocal(NOTES_KEY, [...readLocal<VisitorNote[]>(NOTES_KEY, []), note].slice(-400));
  return note;
}

type NoteRow = { id: string; body: string; lang: string; visitor: string; hidden: boolean; created_at: string };

/** Every note, newest first. Owner only — the policy says so, and so does the
 *  fact that nothing on the board ever asks for this. */
export async function listNotes(): Promise<VisitorNote[]> {
  const neon = await client();
  if (neon) {
    const { data, error } = await neon.from('visitor_notes')
      .select('id,body,lang,visitor,hidden,created_at')
      .order('created_at', { ascending: false })
      .limit(400);
    if (!error && data) {
      return (data as NoteRow[]).map((row) => ({
        id: row.id, body: row.body, lang: row.lang, visitor: row.visitor, hidden: row.hidden, at: row.created_at,
      }));
    }
  }
  return [...readLocal<VisitorNote[]>(NOTES_KEY, [])].reverse();
}

export async function setNoteHidden(id: string, hidden: boolean): Promise<void> {
  const neon = await client();
  if (neon) {
    const { error } = await neon.from('visitor_notes').update({ hidden }).eq('id', id);
    if (!error) return;
  }
  writeLocal(NOTES_KEY, readLocal<VisitorNote[]>(NOTES_KEY, []).map((n) => (n.id === id ? { ...n, hidden } : n)));
}

export async function removeNote(id: string): Promise<void> {
  const neon = await client();
  if (neon) {
    const { error } = await neon.from('visitor_notes').delete().eq('id', id);
    if (!error) return;
  }
  writeLocal(NOTES_KEY, readLocal<VisitorNote[]>(NOTES_KEY, []).filter((n) => n.id !== id));
}

// ------------------------------------------------------------------ garden

function localPlot(): Plant[] {
  return readLocal<Plant[]>(PLOT_KEY, []);
}

export async function gardenPlot(): Promise<Plant[]> {
  const neon = await client();
  if (neon) {
    const { data, error } = await neon.rpc('garden_plot');
    if (!error && Array.isArray(data)) return data as unknown as Plant[];
  }
  return localPlot();
}

export async function myPlant(): Promise<Plant | null> {
  const neon = await client();
  if (neon) {
    const { data, error } = await neon.rpc('garden_mine', { p_visitor: visitorId() });
    if (!error) return (data as unknown as Plant | null) ?? null;
  }
  return readLocal<Plant | null>(MINE_KEY, null);
}

export async function plantSeed(species: string): Promise<Plant> {
  const neon = await client();
  if (neon) {
    const { data, error } = await neon.rpc('garden_plant', { p_visitor: visitorId(), p_species: species });
    if (!error && data) {
      const plant = data as unknown as Plant;
      writeLocal(MINE_KEY, plant);
      return plant;
    }
  }
  const existing = readLocal<Plant | null>(MINE_KEY, null);
  if (existing) return existing;
  const plant: Plant = {
    id: newId(), species, plantedAt: nowIso(), wateredAt: nowIso(), waterings: 0,
  };
  writeLocal(MINE_KEY, plant);
  writeLocal(PLOT_KEY, [...localPlot(), plant].slice(-200));
  return plant;
}

/** Four hours between waterings, enforced in the database when there is one and
 *  here when there is not. A plant you can drown in one afternoon is a slider,
 *  not a plant. */
export const WATER_INTERVAL_MS = 4 * 60 * 60 * 1000;

export async function waterPlant(): Promise<Plant | null> {
  const neon = await client();
  if (neon) {
    const { data, error } = await neon.rpc('garden_water', { p_visitor: visitorId() });
    if (!error) {
      const plant = (data as unknown as Plant | null) ?? null;
      if (plant) writeLocal(MINE_KEY, plant);
      return plant;
    }
  }
  const mine = readLocal<Plant | null>(MINE_KEY, null);
  if (!mine) return null;
  if (Date.now() - new Date(mine.wateredAt).getTime() < WATER_INTERVAL_MS) return mine;
  const next: Plant = { ...mine, wateredAt: nowIso(), waterings: mine.waterings + 1 };
  writeLocal(MINE_KEY, next);
  writeLocal(PLOT_KEY, localPlot().map((p) => (p.id === next.id ? next : p)));
  return next;
}

type PlantRow = {
  id: string; visitor: string; species: string; planted_at: string; watered_at: string;
  waterings: number; removed: boolean;
};

export type OwnerPlant = Plant & { visitor: string; removed: boolean };

export async function listPlants(): Promise<OwnerPlant[]> {
  const neon = await client();
  if (neon) {
    const { data, error } = await neon.from('garden_plants')
      .select('id,visitor,species,planted_at,watered_at,waterings,removed')
      .order('planted_at', { ascending: false })
      .limit(400);
    if (!error && data) {
      return (data as PlantRow[]).map((row) => ({
        id: row.id, visitor: row.visitor, species: row.species, plantedAt: row.planted_at,
        wateredAt: row.watered_at, waterings: row.waterings, removed: row.removed,
      }));
    }
  }
  return localPlot().map((p) => ({ ...p, visitor: visitorId(), removed: false }));
}

export async function removePlant(id: string): Promise<void> {
  const neon = await client();
  if (neon) {
    const { error } = await neon.from('garden_plants').update({ removed: true }).eq('id', id);
    if (!error) return;
  }
  writeLocal(PLOT_KEY, localPlot().filter((p) => p.id !== id));
  const mine = readLocal<Plant | null>(MINE_KEY, null);
  if (mine?.id === id) writeLocal(MINE_KEY, null);
}

// --------------------------------------------------------------- curiosity

/** The questions the machine ships with. Open on purpose: none of them has a
 *  settled answer, none of them is about me, and none of them is trivia. */
export const SHIPPED_QUESTIONS: Array<{ id: string; prompt: { es: string; en: string } }> = [
  { id: 'q-copy', prompt: { es: '¿Una copia perfecta de tu cerebro seguiría siendo tú?', en: 'Would a perfect copy of your brain still be you?' } },
  { id: 'q-time', prompt: { es: '¿Existe una unidad mínima de tiempo?', en: 'Is there a smallest possible unit of time?' } },
  { id: 'q-rational', prompt: { es: '¿Puede una sociedad ser completamente racional?', en: 'Could a society be entirely rational?' } },
  { id: 'q-choice', prompt: { es: '¿Cuánto de una decisión es realmente tuyo?', en: 'How much of a decision is actually yours?' } },
  { id: 'q-memory', prompt: { es: '¿Podría existir inteligencia sin memoria?', en: 'Could there be intelligence without memory?' } },
  { id: 'q-sim', prompt: { es: '¿Qué observación demostraría que vivimos en una simulación?', en: 'What observation would show that we live in a simulation?' } },
  { id: 'q-number', prompt: { es: '¿Se descubren los números o se inventan?', en: 'Are numbers discovered or invented?' } },
  { id: 'q-forget', prompt: { es: '¿Qué se pierde cuando una lengua deja de hablarse?', en: 'What is lost when a language stops being spoken?' } },
  { id: 'q-random', prompt: { es: '¿Existe algo verdaderamente aleatorio?', en: 'Is anything truly random?' } },
  { id: 'q-model', prompt: { es: '¿Puede un modelo entender algo que no puede predecir?', en: 'Can a model understand something it cannot predict?' } },
  { id: 'q-pain', prompt: { es: '¿Sabrías si nunca hubieras sido consciente?', en: 'Would you know if you had never been conscious?' } },
  { id: 'q-future', prompt: { es: '¿Le debemos algo a la gente que aún no existe?', en: 'Do we owe anything to people who do not exist yet?' } },
];

type QuestionRow = { id: string; prompt: Json; active: boolean; position: number };

export async function listQuestions(ownerView = false): Promise<CuriosityQuestion[]> {
  const neon = await client();
  if (neon) {
    let query = neon.from('curiosity_questions').select('id,prompt,active,position').order('position');
    if (!ownerView) query = query.eq('active', true);
    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return (data as QuestionRow[]).map((row) => ({
        id: row.id, prompt: row.prompt, active: row.active, position: row.position,
      }));
    }
  }
  return SHIPPED_QUESTIONS.map((q, index) => ({ id: q.id, prompt: q.prompt, active: true, position: index }));
}

export async function addAnswer(questionId: string, body: string, lang: string): Promise<void> {
  const answer: CuriosityAnswer = {
    id: newId(), questionId, body: body.slice(0, 1200), lang, visitor: visitorId(), hidden: false, at: nowIso(),
  };
  const neon = await client();
  if (neon) {
    const { error } = await neon.from('curiosity_answers')
      .insert({ question_id: questionId, body: answer.body, lang, visitor: answer.visitor });
    if (!error) return;
  }
  writeLocal(ANSWERS_KEY, [...readLocal<CuriosityAnswer[]>(ANSWERS_KEY, []), answer].slice(-400));
}

type AnswerRow = {
  id: string; question_id: string; body: string; lang: string; visitor: string; hidden: boolean; created_at: string;
};

export async function listAnswers(): Promise<CuriosityAnswer[]> {
  const neon = await client();
  if (neon) {
    const { data, error } = await neon.from('curiosity_answers')
      .select('id,question_id,body,lang,visitor,hidden,created_at')
      .order('created_at', { ascending: false })
      .limit(500);
    if (!error && data) {
      return (data as AnswerRow[]).map((row) => ({
        id: row.id, questionId: row.question_id, body: row.body, lang: row.lang,
        visitor: row.visitor, hidden: row.hidden, at: row.created_at,
      }));
    }
  }
  return [...readLocal<CuriosityAnswer[]>(ANSWERS_KEY, [])].reverse();
}

export async function removeAnswer(id: string): Promise<void> {
  const neon = await client();
  if (neon) {
    const { error } = await neon.from('curiosity_answers').delete().eq('id', id);
    if (!error) return;
  }
  writeLocal(ANSWERS_KEY, readLocal<CuriosityAnswer[]>(ANSWERS_KEY, []).filter((a) => a.id !== id));
}

export async function saveQuestion(question: { id?: string; prompt: unknown; active: boolean; position: number }): Promise<void> {
  const neon = await client();
  if (!neon) return;
  if (question.id && !question.id.startsWith('q-')) {
    await neon.from('curiosity_questions')
      .update({ prompt: question.prompt as Json, active: question.active, position: question.position })
      .eq('id', question.id);
    return;
  }
  await neon.from('curiosity_questions')
    .insert({ prompt: question.prompt as Json, active: question.active, position: question.position });
}

export async function removeQuestion(id: string): Promise<void> {
  const neon = await client();
  if (!neon) return;
  await neon.from('curiosity_questions').delete().eq('id', id);
}

// -------------------------------------------------------------- the vote

export function myVote(): VoteChoice | null {
  return readLocal<VoteChoice | null>(MY_VOTE_KEY, null);
}

export async function castVote(choice: VoteChoice): Promise<VoteTally> {
  writeLocal(MY_VOTE_KEY, choice);
  const neon = await client();
  if (neon) {
    const { data, error } = await neon.rpc('world_vote', { p_visitor: visitorId(), p_choice: choice });
    if (!error && data) return data as unknown as VoteTally;
  }
  const tally = readLocal<VoteTally>(VOTES_KEY, { cooperate: 0, betray: 0 });
  const next = { ...tally, [choice]: tally[choice] + 1 };
  writeLocal(VOTES_KEY, next);
  return next;
}

export async function voteTally(): Promise<VoteTally> {
  const neon = await client();
  if (neon) {
    const { data, error } = await neon.rpc('world_vote_tally');
    if (!error && data) return data as unknown as VoteTally;
  }
  return readLocal<VoteTally>(VOTES_KEY, { cooperate: 0, betray: 0 });
}

export async function resetVotes(): Promise<void> {
  const neon = await client();
  if (neon) {
    // Every row: `id` is a uuid and never the empty string, so this is a
    // delete-all that the Data API will actually accept a filter for.
    const { error } = await neon.from('world_votes').delete().not('id', 'is', null);
    if (!error) return;
  }
  writeLocal(VOTES_KEY, { cooperate: 0, betray: 0 });
  writeLocal(MY_VOTE_KEY, null);
}
