import type { Highlighter } from '../typings.js';

/** No-op highlighter that returns SQL text unchanged. Used as the default when no syntax highlighting is configured. */
export class NullHighlighter implements Highlighter {
  highlight(text: string): string {
    return text;
  }
}
