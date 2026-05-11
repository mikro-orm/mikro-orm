import { type NamingStrategy, type Platform, UnderscoreNamingStrategy } from '@mikro-orm/core';
import { RoutineSourceFile } from '@mikro-orm/entity-generator';

describe('RoutineSourceFile', () => {
  const namingStrategy: NamingStrategy = new UnderscoreNamingStrategy();
  // Platform is only consulted to derive `runtimeType` when one isn't provided by
  // introspection; all tests below supply it explicitly, so a stub is enough.
  const platform = { getMappedType: () => ({ runtimeType: 'string' }) } as unknown as Platform;

  it('emits a @Routine-decorated class for the decorator entity definition', () => {
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
      { entityDefinition: 'decorators', decorators: 'legacy', fileName: (n: string) => n },
    );

    const out = sourceFile.generate();
    expect(out).toContain(`import { Routine } from '@mikro-orm/decorators/legacy';`);
    expect(out).toMatch(/@Routine\(/);
    expect(out).toMatch(/export class SqlHash \{\}/);
    expect(out).toContain(`name: 'sql_hash'`);
    expect(out).toContain(`type: 'function'`);
    expect(out).toContain(`language: 'sql'`);
    expect(out).toContain(`name: { type: 'varchar(255)' }`);
    expect(out).toContain(`age: { type: 'integer' }`);
    expect(out).toContain(`columnType: 'text'`);
    expect(out).toContain(`runtimeType: 'string'`);
    expect(out).toContain(`nullable: true`);
    expect(sourceFile.getBaseName()).toBe('SqlHash.ts');
  });

  it('emits ES decorator import when decorators=es', () => {
    const sourceFile = new RoutineSourceFile(
      {
        name: 'noop',
        type: 'procedure',
        params: [],
        body: '',
      },
      namingStrategy,
      platform,
      { entityDefinition: 'decorators', decorators: 'es', fileName: (n: string) => n },
    );

    expect(sourceFile.generate()).toContain(`from '@mikro-orm/decorators/es'`);
  });

  it('emits defineRoutine() for the defineEntity mode', () => {
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

    const out = sourceFile.generate();
    expect(out).toContain(`import { defineRoutine } from '@mikro-orm/core';`);
    expect(out).toMatch(/export const Pi = defineRoutine\(/);
    expect(out).toContain(`params: {}`);
  });

  it('emits new RoutineSchema() for the entitySchema mode', () => {
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

    const out = sourceFile.generate();
    expect(out).toContain(`import { RoutineSchema } from '@mikro-orm/core';`);
    expect(out).toMatch(/export const Echo = new RoutineSchema\(/);
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

    const out = sourceFile.generate();
    expect(out).toContain(`p_name: { type: 'varchar(255)' }`);
    expect(out).toContain(`p_hash: { type: 'text', direction: 'inout', ref: true }`);
    expect(out).toContain(`p_id: { type: 'integer', direction: 'out', ref: true }`);
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

    const out = sourceFile.generate();
    expect(out).toContain('body: `begin');
    expect(out).toContain('insert into t values (2);');
    expect(out).toMatch(/end`,/);
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

    const out = sourceFile.generate();
    expect(out).toContain(`opt: { type: 'text', nullable: true }`);
    expect(out).toContain(`def: { type: 'integer', defaultRaw: '42' }`);
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

    expect(sourceFile.generate()).toContain(`'1bad-name': { type: 'text' }`);
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

    const out = sourceFile.generate();
    expect(out).toContain(`schema: 'analytics'`);
    expect(out).toContain(`security: 'definer'`);
    expect(out).toContain(`deterministic: true`);
    expect(out).toContain(`comment: 'aggregated rollup'`);
    expect(out).toContain(`expression:`);
    expect(out).not.toContain(`body:`);
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
      { entityDefinition: 'decorators', decorators: 'legacy', fileName: (n: string) => n },
    );

    expect(sourceFile.getClassName()).toBe('ComputeUserScore');
    expect(sourceFile.generate()).toContain('export class ComputeUserScore');
  });
});
