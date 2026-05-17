import { type NamingStrategy, type Platform, UnderscoreNamingStrategy } from '@mikro-orm/core';
import { RoutineSourceFile } from '@mikro-orm/entity-generator';

describe('RoutineSourceFile', () => {
  const namingStrategy: NamingStrategy = new UnderscoreNamingStrategy();
  // Platform is only consulted to derive `runtimeType` when introspection didn't supply one.
  const platform = { getMappedType: () => ({ runtimeType: 'string' }) } as unknown as Platform;

  it('emits `new Routine(...)` const for a function definition', () => {
    const sourceFile = new RoutineSourceFile(
      {
        name: 'sql_hash',
        type: 'function',
        language: 'sql',
        params: [
          { name: 'name', type: 'varchar(255)', direction: 'in' },
          { name: 'age', type: 'integer', direction: 'in' },
        ],
        returns: { type: 'text', runtimeType: 'string', nullable: true },
        body: "select md5(name || age::text || 'secret salt')",
      },
      namingStrategy,
      platform,
      { entityDefinition: 'decorators', fileName: (n: string) => n },
    );

    expect(sourceFile.generate()).toMatchInlineSnapshot(`
      "import { Routine } from '@mikro-orm/core';

      export const SqlHash = new Routine({
        name: 'sql_hash',
        type: 'function',
        language: 'sql',
        params: {
          name: { type: 'varchar(255)' },
          age: { type: 'integer' },
        },
        returns: { runtimeType: 'string', columnType: 'text', nullable: true },
        body: 'select md5(name || age::text || \\'secret salt\\')',
      });
      "
    `);
    expect(sourceFile.getBaseName()).toBe('SqlHash.ts');
  });

  it('always emits `new Routine(...)` regardless of entityDefinition mode', () => {
    const sourceFile = new RoutineSourceFile(
      {
        name: 'pi',
        type: 'function',
        language: 'sql',
        params: [],
        returns: { type: 'double precision', runtimeType: 'number' },
        body: 'select 3.14159',
      },
      namingStrategy,
      platform,
      { entityDefinition: 'defineEntity', fileName: (n: string) => n },
    );

    expect(sourceFile.generate()).toMatchInlineSnapshot(`
      "import { Routine } from '@mikro-orm/core';

      export const Pi = new Routine({
        name: 'pi',
        type: 'function',
        language: 'sql',
        params: {},
        returns: { runtimeType: 'number', columnType: 'double precision' },
        body: 'select 3.14159',
      });
      "
    `);
  });

  it('emits `new Routine(...)` for the entitySchema mode too', () => {
    const sourceFile = new RoutineSourceFile(
      {
        name: 'echo',
        type: 'function',
        params: [{ name: 'v', type: 'text', direction: 'in' }],
        returns: { type: 'text', runtimeType: 'string' },
        body: 'select v',
      },
      namingStrategy,
      platform,
      { entityDefinition: 'entitySchema', fileName: (n: string) => n },
    );

    expect(sourceFile.generate()).toMatchInlineSnapshot(`
      "import { Routine } from '@mikro-orm/core';

      export const Echo = new Routine({
        name: 'echo',
        type: 'function',
        params: {
          v: { type: 'text' },
        },
        returns: { runtimeType: 'string', columnType: 'text' },
        body: 'select v',
      });
      "
    `);
  });

  it('emits OUT/INOUT direction and ref: true for procedure params', () => {
    const sourceFile = new RoutineSourceFile(
      {
        name: 'add_record',
        type: 'procedure',
        language: 'plpgsql',
        params: [
          { name: 'p_name', type: 'varchar(255)', direction: 'in' },
          { name: 'p_age', type: 'integer', direction: 'in' },
          { name: 'p_hash', type: 'text', direction: 'inout' },
          { name: 'p_id', type: 'integer', direction: 'out' },
        ],
        body: 'p_hash := md5(p_name);',
      },
      namingStrategy,
      platform,
      { entityDefinition: 'defineEntity', fileName: (n: string) => n },
    );

    expect(sourceFile.generate()).toMatchInlineSnapshot(`
      "import { Routine } from '@mikro-orm/core';

      export const AddRecord = new Routine({
        name: 'add_record',
        type: 'procedure',
        language: 'plpgsql',
        params: {
          p_name: { type: 'varchar(255)' },
          p_age: { type: 'integer' },
          p_hash: { type: 'text', direction: 'inout', ref: true },
          p_id: { type: 'integer', direction: 'out', ref: true },
        },
        body: 'p_hash := md5(p_name);',
      });
      "
    `);
  });

  it('uses a backtick template literal for multi-line bodies', () => {
    const sourceFile = new RoutineSourceFile(
      {
        name: 'multi',
        type: 'procedure',
        language: 'plpgsql',
        params: [],
        body: 'begin\n  insert into t values (1);\n  insert into t values (2);\nend',
      },
      namingStrategy,
      platform,
      { entityDefinition: 'defineEntity', fileName: (n: string) => n },
    );

    expect(sourceFile.generate()).toMatchInlineSnapshot(`
      "import { Routine } from '@mikro-orm/core';

      export const Multi = new Routine({
        name: 'multi',
        type: 'procedure',
        language: 'plpgsql',
        params: {},
        body: \`begin
        insert into t values (1);
        insert into t values (2);
      end\`,
      });
      "
    `);
  });

  it('emits param-level nullable and defaultRaw when present', () => {
    const sourceFile = new RoutineSourceFile(
      {
        name: 'with_defaults',
        type: 'procedure',
        params: [
          { name: 'opt', type: 'text', direction: 'in', nullable: true },
          { name: 'def', type: 'integer', direction: 'in', defaultRaw: '42' },
        ],
        body: 'begin null; end',
      },
      namingStrategy,
      platform,
      { entityDefinition: 'defineEntity', fileName: (n: string) => n },
    );

    expect(sourceFile.generate()).toMatchInlineSnapshot(`
      "import { Routine } from '@mikro-orm/core';

      export const WithDefaults = new Routine({
        name: 'with_defaults',
        type: 'procedure',
        params: {
          opt: { type: 'text', nullable: true },
          def: { type: 'integer', defaultRaw: '42' },
        },
        body: 'begin null; end',
      });
      "
    `);
  });

  it('escapes backslashes and quotes when the body is emitted as a single-quoted string', () => {
    const sourceFile = new RoutineSourceFile(
      {
        name: 'tricky',
        type: 'function',
        params: [],
        returns: { type: 'text', runtimeType: 'string' },
        body: "select 'a\\b' || ''''",
      },
      namingStrategy,
      platform,
      { entityDefinition: 'defineEntity', fileName: (n: string) => n },
    );

    expect(sourceFile.generate()).toMatchInlineSnapshot(`
      "import { Routine } from '@mikro-orm/core';

      export const Tricky = new Routine({
        name: 'tricky',
        type: 'function',
        params: {},
        returns: { runtimeType: 'string', columnType: 'text' },
        body: 'select \\'a\\\\b\\' || \\'\\'\\'\\'',
      });
      "
    `);
  });

  it('uses backticks for bodies that contain newlines (template-literal-safe escaping)', () => {
    const sourceFile = new RoutineSourceFile(
      {
        name: 'with_dollars',
        type: 'function',
        params: [],
        returns: { type: 'text', runtimeType: 'string' },
        body: "select format('hello %s', $1)\nfrom (select 1) t",
      },
      namingStrategy,
      platform,
      { entityDefinition: 'defineEntity', fileName: (n: string) => n },
    );

    expect(sourceFile.generate()).toMatchInlineSnapshot(`
      "import { Routine } from '@mikro-orm/core';

      export const WithDollars = new Routine({
        name: 'with_dollars',
        type: 'function',
        params: {},
        returns: { runtimeType: 'string', columnType: 'text' },
        body: \`select format('hello %s', $1)
      from (select 1) t\`,
      });
      "
    `);
  });

  it('escapes ${} interpolation in body even on a single line', () => {
    const sourceFile = new RoutineSourceFile(
      {
        name: 'dollar_brace',
        type: 'function',
        params: [],
        returns: { type: 'text', runtimeType: 'string' },
        body: "select '${injected}' as v",
      },
      namingStrategy,
      platform,
      { entityDefinition: 'defineEntity', fileName: (n: string) => n },
    );

    expect(sourceFile.generate()).toMatchInlineSnapshot(`
      "import { Routine } from '@mikro-orm/core';

      export const DollarBrace = new Routine({
        name: 'dollar_brace',
        type: 'function',
        params: {},
        returns: { runtimeType: 'string', columnType: 'text' },
        body: \`select '\\\${injected}' as v\`,
      });
      "
    `);
  });

  it('quotes param names that are not valid JS identifiers', () => {
    const sourceFile = new RoutineSourceFile(
      {
        name: 'weird',
        type: 'function',
        params: [{ name: '1bad-name', type: 'text', direction: 'in' }],
        returns: { type: 'text', runtimeType: 'string' },
        body: 'select null',
      },
      namingStrategy,
      platform,
      { entityDefinition: 'defineEntity', fileName: (n: string) => n },
    );

    expect(sourceFile.generate()).toMatchInlineSnapshot(`
      "import { Routine } from '@mikro-orm/core';

      export const Weird = new Routine({
        name: 'weird',
        type: 'function',
        params: {
          '1bad-name': { type: 'text' },
        },
        returns: { runtimeType: 'string', columnType: 'text' },
        body: 'select null',
      });
      "
    `);
  });

  it('emits schema, security, deterministic, comment, and expression metadata when present', () => {
    const sourceFile = new RoutineSourceFile(
      {
        name: 'meta',
        schema: 'analytics',
        type: 'function',
        language: 'sql',
        security: 'definer',
        deterministic: true,
        comment: 'aggregated rollup',
        params: [],
        returns: { type: 'text', runtimeType: 'string' },
        expression: 'CREATE FUNCTION analytics.meta() RETURNS text LANGUAGE sql AS $$ select null $$',
      },
      namingStrategy,
      platform,
      { entityDefinition: 'defineEntity', fileName: (n: string) => n },
    );

    expect(sourceFile.generate()).toMatchInlineSnapshot(`
      "import { Routine } from '@mikro-orm/core';

      export const Meta = new Routine({
        name: 'meta',
        type: 'function',
        schema: 'analytics',
        language: 'sql',
        security: 'definer',
        deterministic: true,
        comment: 'aggregated rollup',
        params: {},
        returns: { runtimeType: 'string', columnType: 'text' },
        expression: 'CREATE FUNCTION analytics.meta() RETURNS text LANGUAGE sql AS $$ select null $$',
      });
      "
    `);
  });

  it('escapes control chars in single-quoted strings (comment with embedded newline)', () => {
    const sourceFile = new RoutineSourceFile(
      {
        name: 'with_comment',
        type: 'function',
        params: [],
        returns: { type: 'integer', runtimeType: 'number' },
        body: 'select 1',
        comment: 'line one\nline two\twith tab',
      },
      namingStrategy,
      platform,
      { entityDefinition: 'defineEntity', fileName: (n: string) => n },
    );

    expect(sourceFile.generate()).toMatchInlineSnapshot(`
      "import { Routine } from '@mikro-orm/core';

      export const WithComment = new Routine({
        name: 'with_comment',
        type: 'function',
        comment: 'line one\\nline two\\twith tab',
        params: {},
        returns: { runtimeType: 'number', columnType: 'integer' },
        body: 'select 1',
      });
      "
    `);
  });

  it("narrows runtimeType to 'any' when getMappedType reports a value outside the routine runtime-type union", () => {
    const oddPlatform = { getMappedType: () => ({ runtimeType: 'unknown' }) } as unknown as Platform;
    const sourceFile = new RoutineSourceFile(
      {
        name: 'oddly_typed',
        type: 'function',
        params: [],
        returns: { type: 'tsvector' },
        body: "select 'x'::tsvector",
      },
      namingStrategy,
      oddPlatform,
      { entityDefinition: 'decorators', fileName: (n: string) => n },
    );

    expect(sourceFile.generate()).toMatchInlineSnapshot(`
      "import { Routine } from '@mikro-orm/core';

      export const OddlyTyped = new Routine({
        name: 'oddly_typed',
        type: 'function',
        params: {},
        returns: { runtimeType: 'any', columnType: 'tsvector' },
        body: 'select \\'x\\'::tsvector',
      });
      "
    `);
  });

  it('snake_case routine names become PascalCase class names', () => {
    const sourceFile = new RoutineSourceFile(
      {
        name: 'compute_user_score',
        type: 'function',
        params: [],
        returns: { type: 'integer', runtimeType: 'number' },
        body: 'select 0',
      },
      namingStrategy,
      platform,
      { entityDefinition: 'decorators', fileName: (n: string) => n },
    );

    expect(sourceFile.getClassName()).toBe('ComputeUserScore');
    expect(sourceFile.generate()).toMatchInlineSnapshot(`
      "import { Routine } from '@mikro-orm/core';

      export const ComputeUserScore = new Routine({
        name: 'compute_user_score',
        type: 'function',
        params: {},
        returns: { runtimeType: 'number', columnType: 'integer' },
        body: 'select 0',
      });
      "
    `);
  });

  it('digit-leading routine names get an underscore prefix so the emitted identifier is valid', () => {
    const sourceFile = new RoutineSourceFile(
      {
        name: '2fa_check',
        type: 'function',
        params: [],
        returns: { type: 'boolean', runtimeType: 'boolean' },
        body: 'select true',
      },
      namingStrategy,
      platform,
      { entityDefinition: 'decorators', fileName: (n: string) => n },
    );

    expect(sourceFile.getClassName()).toBe('_2faCheck');
  });
});
