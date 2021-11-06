import type { Highlighter } from '../typings';

export class NullHighlighter implements Highlighter {

  highlight(text: string): string {
    return text;
  }

}
