import type { Highlighter } from '../typings.js';

export class NullHighlighter implements Highlighter {

  highlight(text: string): string {
    return text;
  }

}
