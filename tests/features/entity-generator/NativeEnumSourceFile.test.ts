import { type NamingStrategy, type Platform, UnderscoreNamingStrategy } from '@mikro-orm/core';
import { NativeEnumSourceFile } from '../../../packages/entity-generator/src/NativeEnumSourceFile.js';

describe('NativeEnumSourceFile', () => {
  const namingStrategy: NamingStrategy = new UnderscoreNamingStrategy();
  const platform = {} as Platform;

  const createSourceFile = (items: string[], enumMode: 'union-type' | 'dictionary' = 'union-type') =>
    new NativeEnumSourceFile({} as any, namingStrategy, platform, { enumMode, fileName: (n: string) => n } as any, {
      name: 'status',
      items,
    });

  it('escapes backslashes so a trailing `\\` cannot terminate the literal early', () => {
    const source = createSourceFile([String.raw`ok`, String.raw`x\'`]).generate();

    expect(source).toMatchInlineSnapshot(`
      "export type TStatus = 'ok' | 'x\\\\\\'';
      "
    `);
  });

  it('escapes backticks and ${} when a newline forces the template-literal branch', () => {
    const source = createSourceFile(['a`b', 'c\n${d}', "'a`b"]).generate();

    expect(source).toMatchInlineSnapshot(`
      "export type TStatus = 'a\`b' | \`c
      \\\${d}\` | \`'a\\\`b\`;
      "
    `);
  });

  it('round-trips every label through the generated literal', () => {
    const items = [
      String.raw`x\'`,
      'a`b',
      "it's",
      'c\n${d}',
      String.raw`back\\slash`,
      "'leading quote",
      "'a`b",
      'a\rb',
      'a\r\nb',
    ];

    for (const item of items) {
      const source = createSourceFile([item]).generate();
      const literal = source.slice(source.indexOf(' = ') + 3, source.lastIndexOf(';'));

      expect(new Function(`return ${literal}`)()).toBe(item);
    }
  });

  it('emits string-literal keys for labels that are not valid identifiers', () => {
    const items = [String.raw`x\'`, 'a`b', 'c\n${d}', "'leading quote", 'a\rb', 'a\tb'];
    const source = createSourceFile(items, 'dictionary').generate();
    const expression = source.slice(source.indexOf('{'), source.lastIndexOf('} as const;') + 1);

    expect(Object.values(new Function(`return ${expression}`)())).toEqual(items);
  });
});
