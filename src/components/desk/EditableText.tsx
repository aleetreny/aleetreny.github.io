import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

// One well-behaved contentEditable, used by every field the owner can type in.
//
// The board used to hand React a bare `contentEditable` and read
// `textContent.trim()` on blur. Three things went wrong with that, all of them
// silent:
//
//  1. Pressing Enter made the browser insert a `<div>`. `textContent` glued the
//     two lines together with no separator ("PRIMERA" + "SEGUNDA" read back as
//     "PRIMERASEGUNDA"), so a line break destroyed a word boundary.
//  2. That `<div>` is a node React never created, so React could not remove it.
//     After the commit re-rendered the text, the stray element stayed put and
//     the paragraph showed its last line twice.
//  3. Pasting from anywhere brought the source's markup in with it.
//
// So nothing is left to the browser's own editing commands: every insertion
// goes through `beforeinput`, comes back as plain text, and the element holds
// text nodes only. `readEditable` still reconstructs line breaks defensively —
// an input method or an extension can always slip an element past us — and a
// drift check remounts the field when it finds one.

const BLOCK_TAGS = new Set(['DIV', 'P', 'LI', 'TR', 'SECTION', 'ARTICLE', 'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4']);

/** Read a contentEditable subtree the way the model stores it: plain text, with
 *  every break the browser expressed as an element turned back into `\n`. */
export function readEditable(root: HTMLElement): string {
  let out = '';
  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) { out += child.textContent ?? ''; continue; }
      if (!(child instanceof HTMLElement)) continue;
      if (child.tagName === 'BR') { out += '\n'; continue; }
      const isBlock = BLOCK_TAGS.has(child.tagName);
      if (isBlock && out && !out.endsWith('\n')) out += '\n';
      walk(child);
      if (isBlock && out && !out.endsWith('\n')) out += '\n';
    }
  };
  walk(root);
  // A non-breaking space is what the browser leaves behind at the end of a
  // line; the model wants an ordinary one.
  return out.replace(/\u00a0/g, ' ').replace(/\n+$/, '');
}

/** Character offset of a DOM position inside `root`, counting text only. */
export function caretOffset(root: HTMLElement, node: Node, offset: number): number {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let total = 0;
  let current = walker.nextNode();
  while (current) {
    if (current === node) return total + Math.min(offset, current.textContent?.length ?? 0);
    total += current.textContent?.length ?? 0;
    current = walker.nextNode();
  }
  // A boundary reported on the element itself (an empty field, or a caret
  // parked between children) counts everything before it.
  if (node === root) {
    let seen = 0;
    for (let i = 0; i < Math.min(offset, root.childNodes.length); i += 1) {
      seen += root.childNodes[i].textContent?.length ?? 0;
    }
    return seen;
  }
  return total;
}

/** Where the caret sits inside `root`, or null when it is somewhere else. */
export function readCaret(root: HTMLElement): { start: number; end: number } | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;
  const start = caretOffset(root, range.startContainer, range.startOffset);
  const end = caretOffset(root, range.endContainer, range.endOffset);
  return { start: Math.min(start, end), end: Math.max(start, end) };
}

/** Put the caret back at a character offset after a re-render. */
export function placeCaret(root: HTMLElement, offset: number): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let total = 0;
  let node = walker.nextNode();
  let target: Node = root;
  let local = 0;
  while (node) {
    const length = node.textContent?.length ?? 0;
    if (offset <= total + length) { target = node; local = offset - total; break; }
    total += length;
    target = node;
    local = length;
    node = walker.nextNode();
  }
  const range = document.createRange();
  try {
    range.setStart(target, local);
  } catch {
    range.selectNodeContents(root);
    range.collapse(false);
  }
  range.collapse(true);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

/** Insert plain text at the caret, one line at a time.
 *
 *  Both halves go through `execCommand`: deprecated, but the only insertion the
 *  browser's own undo stack knows about, and — for a line break — the only one
 *  that leaves the caret somewhere sane. Handing `insertText` a string with a
 *  newline in it does not work: engines turn the break into a `<div>`, the very
 *  markup this component exists to keep out. Writing the newline as a text node
 *  instead does keep the DOM clean, but a newline at the end of a block has no
 *  line box, so the caret cannot be put after it and the next character typed
 *  lands in front of the break.
 *
 *  `insertLineBreak` sidesteps both: it produces a `<br>`, which `readEditable`
 *  turns back into `\n` at commit time, and the caret ends up where the owner
 *  is looking. */
export function insertPlainText(root: HTMLElement, text: string): void {
  const lines = text.split('\n');
  let ok = true;
  lines.forEach((line, index) => {
    if (index > 0) ok = document.execCommand('insertLineBreak') && ok;
    if (line) ok = document.execCommand('insertText', false, line) && ok;
  });
  if (ok) return;

  // Nothing implements `execCommand`: fall back to the range, and put the caret
  // back by offset because `normalize()` invalidates any range anchored to the
  // node it just merged away.
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const at = readCaret(root);
  const range = selection.getRangeAt(0);
  range.deleteContents();
  range.insertNode(document.createTextNode(text));
  root.normalize();
  placeCaret(root, (at?.start ?? 0) + text.length);
  root.dispatchEvent(new Event('input', { bubbles: true }));
}

export type EditableConfig = {
  editing: boolean;
  /** The model value. The DOM is only allowed to disagree while focused. */
  text: string;
  /** Can this field hold a line break at all? A date or a kicker cannot. */
  multiline?: boolean;
  /** Called with the field's text whenever it should be stored. */
  onCommit: (text: string) => void;
  /** Enter splits the field in two — a new paragraph, a new list item. When
   *  absent, Enter inserts a line break (or commits, on a single-line field). */
  onSplit?: (before: string, after: string) => void;
  /** Take focus as soon as this field appears; used for the half a block or
   *  list item that Enter just created. */
  autoFocus?: boolean;
};

type EditableState = {
  ref: (node: HTMLElement | null) => void;
  /** Bumped when the DOM drifts from the model, to force a clean remount. */
  generation: number;
  props: Record<string, unknown>;
  /** Read the DOM now — for callers that need the live text mid-gesture. */
  read: () => string;
};

export function useEditable({
  editing, text, multiline = true, onCommit, onSplit, autoFocus,
}: EditableConfig): EditableState {
  const nodeRef = useRef<HTMLElement | null>(null);
  const [generation, setGeneration] = useState(0);
  const textRef = useRef(text);
  const liveRef = useRef<string | null>(null);
  const commitRef = useRef(onCommit);
  const splitRef = useRef(onSplit);
  const multilineRef = useRef(multiline);

  // Kept in refs, and refreshed after every render rather than during it: the
  // DOM listeners below are attached once and must still see the latest props
  // when the owner finally blurs the field.
  useEffect(() => {
    textRef.current = text;
    commitRef.current = onCommit;
    splitRef.current = onSplit;
    multilineRef.current = multiline;
  });

  const read = useCallback(() => (nodeRef.current ? readEditable(nodeRef.current) : textRef.current), []);

  const commit = useCallback(() => {
    const node = nodeRef.current;
    if (!node) return;
    const next = readEditable(node);
    liveRef.current = null;
    if (next === textRef.current) return;
    textRef.current = next;
    commitRef.current(next);
  }, []);

  // Every insertion is funnelled through here so the element can only ever
  // contain text nodes: no `<div>` from Enter, no markup from a paste, no
  // stray `<font>` from a drag-and-drop between two windows.
  useEffect(() => {
    const node = nodeRef.current;
    if (!editing || !node) return undefined;

    const onBeforeInput = (event: InputEvent) => {
      const type = event.inputType;

      if (type === 'insertParagraph' || type === 'insertLineBreak') {
        event.preventDefault();
        const split = splitRef.current;
        // Shift+Enter always means "a break inside this field", so it never
        // splits even where Enter would.
        if (split && type === 'insertParagraph') {
          const caret = readCaret(node);
          const current = readEditable(node);
          const at = caret ? caret.start : current.length;
          const end = caret ? caret.end : current.length;
          const before = current.slice(0, at);
          const after = current.slice(end);

          // React only knows the last committed value. When that happens to
          // equal `before`, it does not touch the DOM — even though the live
          // editable still contains `after`. The focus handoff would then blur
          // that stale node and commit the full paragraph back over the first
          // half. Remount it now, before the new paragraph takes focus.
          liveRef.current = null;
          textRef.current = before;
          setGeneration((value) => value + 1);
          split(before, after);
          return;
        }
        if (!multilineRef.current) { node.blur(); return; }
        insertPlainText(node, '\n');
        return;
      }

      if (type === 'insertFromPaste' || type === 'insertFromDrop' || type === 'insertFromYank') {
        const plain = event.dataTransfer?.getData('text/plain');
        if (plain === undefined) return; // nothing to sanitise; let it through
        event.preventDefault();
        insertPlainText(node, normalisePasted(plain, multilineRef.current));
      }
    };

    // Safari and Firefox route a paste through `paste` rather than giving
    // `beforeinput` a dataTransfer, so both doors are covered.
    const onPaste = (event: ClipboardEvent) => {
      const plain = event.clipboardData?.getData('text/plain');
      if (plain === undefined) return;
      event.preventDefault();
      insertPlainText(node, normalisePasted(plain, multilineRef.current));
    };

    const onInput = () => { liveRef.current = readEditable(node); };

    node.addEventListener('beforeinput', onBeforeInput as EventListener);
    node.addEventListener('paste', onPaste as EventListener);
    node.addEventListener('input', onInput);
    return () => {
      node.removeEventListener('beforeinput', onBeforeInput as EventListener);
      node.removeEventListener('paste', onPaste as EventListener);
      node.removeEventListener('input', onInput);
    };
  }, [editing, generation]);

  // The safety net for everything above: if the DOM ever says something other
  // than the model while nobody is typing in it, throw the element away and let
  // React build a clean one. Without this a single stray node survives every
  // re-render, and the field quietly shows a duplicated line for ever.
  useLayoutEffect(() => {
    const node = nodeRef.current;
    if (!editing || !node) return;
    if (document.activeElement === node) return;
    if (readEditable(node) !== text) setGeneration((value) => value + 1);
    // `generation` is in the list on purpose: the remount it triggers is what
    // clears the drift, so the check has to run once more afterwards to confirm
    // it did — and then stop, because the DOM now matches.
  }, [editing, text, generation]);

  // A field can be unmounted without ever blurring — the dossier closes, the
  // block is deleted, the language switches. Whatever was typed is still worth
  // keeping.
  useEffect(() => () => {
    const pending = liveRef.current;
    if (pending !== null && pending !== textRef.current) commitRef.current(pending);
  }, []);

  useEffect(() => {
    if (!autoFocus || !editing) return;
    const node = nodeRef.current;
    if (!node) return;
    node.focus();
    placeCaret(node, 0);
  }, [autoFocus, editing]);

  const ref = useCallback((node: HTMLElement | null) => { nodeRef.current = node; }, []);

  const props = editing
    ? {
      contentEditable: true,
      suppressContentEditableWarning: true,
      spellCheck: true,
      'data-nodrag': '',
      onBlur: commit,
    }
    : {};

  return { ref, generation, props, read };
}

/** Clipboard text arrives with the source's line endings and, from a word
 *  processor, a shoal of non-breaking spaces. A single-line field flattens the
 *  breaks rather than refusing the paste. */
export function normalisePasted(text: string, multiline: boolean): string {
  const clean = text.replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ');
  return multiline ? clean : clean.replace(/\s*\n+\s*/g, ' ');
}

type EditableTextProps = Omit<EditableConfig, 'text'> & {
  as: 'span' | 'div' | 'p' | 'h2' | 'h3' | 'b' | 'cite' | 'figcaption';
  className?: string;
  style?: CSSProperties;
  text: string;
  /** Shown, greyed, when the field is empty and the owner is editing. Without
   *  it an empty field is an invisible zero-height target nobody can click. */
  placeholder?: string;
};

/** A plain editable field: a title, a caption, a date, a metric label. Prose
 *  that can carry links goes through `RichText` instead, which uses the same
 *  hook underneath. */
export function EditableText({
  as, className, style, text, placeholder, editing, multiline, onCommit, onSplit, autoFocus,
}: EditableTextProps) {
  const { ref, generation, props } = useEditable({ editing, text, multiline, onCommit, onSplit, autoFocus });
  const Tag = as;
  return (
    <Tag
      key={generation}
      ref={ref as never}
      className={className}
      style={style}
      data-placeholder={editing ? placeholder : undefined}
      {...props}
    >
      {text}
    </Tag>
  );
}
