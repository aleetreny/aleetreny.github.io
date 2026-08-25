// A calculator that works.
//
// It really does arithmetic — that is the point. If it were obviously broken
// nobody would ever be surprised by it. There are a handful of expressions it
// has its own opinion about, and one of them is the only sum in fiction that
// matters. It never announces any of this.

import { useCallback, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useUiText } from '../ui-text-context';

const KEYS = [
  ['7', '8', '9', '÷'],
  ['4', '5', '6', '×'],
  ['1', '2', '3', '−'],
  ['0', '.', '=', '+'],
] as const;

type Op = '÷' | '×' | '−' | '+';

/** The handful of sums this machine has made its mind up about.
 *  Six by nine first, because Douglas Adams got there before the arithmetic. */
const OPINIONS: Record<string, string> = {
  '6×9': '42',
  '9×6': '42',
  '2+2': '4',
  '1÷0': '∞',
  '0÷0': '?',
  '42÷0': 'THE ANSWER',
  '6×7': '42',
};

function compute(a: number, op: Op, b: number): number {
  switch (op) {
    case '+': return a + b;
    case '−': return a - b;
    case '×': return a * b;
    case '÷': return b === 0 ? Number.POSITIVE_INFINITY : a / b;
  }
}

function show(value: number): string {
  if (!Number.isFinite(value)) return '∞';
  const rounded = Math.round(value * 1e9) / 1e9;
  const text = String(rounded);
  return text.length > 11 ? rounded.toExponential(4) : text;
}

export function Calculator({ onAnswer }: { onAnswer: () => void }) {
  const t = useUiText();
  const [readout, setReadout] = useState('0');
  const [pending, setPending] = useState<{ value: number; op: Op } | null>(null);
  const [fresh, setFresh] = useState(true);

  const press = useCallback((key: string) => {
    if (key === '=') {
      if (!pending) return;
      const b = Number(readout);
      const typed = `${show(pending.value)}${pending.op}${show(b)}`;
      const opinion = OPINIONS[typed];
      const result = opinion ?? show(compute(pending.value, pending.op, b));
      setReadout(result);
      setPending(null);
      setFresh(true);
      if (result === '42' || result === 'THE ANSWER') onAnswer();
      return;
    }
    if (key === '÷' || key === '×' || key === '−' || key === '+') {
      const value = Number(readout);
      // Chaining: 2 + 3 + 4 shows 5 before it shows 9, like a real one.
      const carried = pending && !fresh ? compute(pending.value, pending.op, value) : value;
      if (pending && !fresh) setReadout(show(carried));
      setPending({ value: Number.isFinite(carried) ? carried : value, op: key });
      setFresh(true);
      return;
    }
    if (key === '.') {
      if (fresh) { setReadout('0.'); setFresh(false); return; }
      if (!readout.includes('.')) setReadout(`${readout}.`);
      return;
    }
    if (fresh || readout === '0') { setReadout(key); setFresh(false); return; }
    if (readout.replace(/\D/g, '').length >= 11) return;
    setReadout(readout + key);
  }, [fresh, onAnswer, pending, readout]);

  const clear = useCallback(() => { setReadout('0'); setPending(null); setFresh(true); }, []);

  return (
    <ObjectShell id="calculator" label={t('world.calc.label')}>
      <div className="calc mat-dark">
        <div className="calc__brand">
          <span>TR-42</span>
          <button className="calc__clear" type="button" data-nodrag onClick={clear} aria-label={t('world.calc.clear')}>C</button>
        </div>
        <output className="calc__screen" data-nodrag aria-live="polite">
          <span className="calc__ghost">88888888888</span>
          <span className="calc__value">{readout}</span>
        </output>
        <div className="calc__pad" data-nodrag>
          {KEYS.flat().map((key) => (
            <button
              key={key}
              type="button"
              className={`calc__key${'÷×−+='.includes(key) ? ' calc__key--op' : ''}`}
              onClick={() => press(key)}
            >{key}</button>
          ))}
        </div>
      </div>
    </ObjectShell>
  );
}
