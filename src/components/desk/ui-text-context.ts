import { createContext, useContext } from 'react';
import { makeUiText, type UiText } from '../../lib/ui-text';

/** Chrome wording, resolved for the language currently on screen.
 *
 *  A context rather than a prop because every component down the tree says
 *  something out loud — threading `t` through eight components would be the
 *  same edit repeated eight times, and a component added later would silently
 *  go back to hardcoded English.
 *
 *  The default is the built-in Spanish, so a component rendered outside the
 *  board (a test, a future standalone page) still speaks rather than crashing. */
export const UiTextContext = createContext<UiText>(makeUiText({}, 'es', 'es'));

export function useUiText(): UiText {
  return useContext(UiTextContext);
}
