import { MikroORM, SchemaComparator } from '@mikro-orm/sqlite';
import { DatabaseSchema, type SqlRoutineDef } from '@mikro-orm/sql';
import { Routine, raw, RoutineMetadata } from '@mikro-orm/core';

describe('stored routines — comparator unit tests', () => {
  let orm: MikroORM;
  let comparator: SchemaComparator;

  const makeRoutine = (overrides: Partial<SqlRoutineDef> = {}): SqlRoutineDef => ({
    name: 'test_routine',
    type: 'function',
    body: 'select 1',
    params: [],
    returns: { type: 'integer' },
    ...overrides,
  });

  const compare = (from: SqlRoutineDef, to: SqlRoutineDef): boolean => {
    const fromSchema = new DatabaseSchema(orm.em.getPlatform(), '');
    const toSchema = new DatabaseSchema(orm.em.getPlatform(), '');
    fromSchema.addRoutine(from);
    toSchema.addRoutine(to);
    const diff = comparator.compare(fromSchema, toSchema);
    return Object.keys(diff.changedRoutines).length > 0;
  };

  beforeAll(async () => {
    orm = await MikroORM.init({ dbName: ':memory:', entities: [], discovery: { warnWhenNoEntities: false } });
    comparator = new SchemaComparator(orm.em.getPlatform());
  });

  afterAll(() => orm.close(true));

  describe('diffRoutine', () => {
    it('detects type changes (function -> procedure)', () => {
      expect(compare(makeRoutine({ type: 'function' }), makeRoutine({ type: 'procedure' }))).toBe(true);
    });

    it('treats body whitespace as cosmetic', () => {
      expect(compare(makeRoutine({ body: 'select   1' }), makeRoutine({ body: 'select 1' }))).toBe(false);
    });

    it('treats trailing semicolons as cosmetic', () => {
      expect(compare(makeRoutine({ body: 'select 1' }), makeRoutine({ body: 'select 1;;;' }))).toBe(false);
    });

    it('strips outer BEGIN/END wrappers before comparing', () => {
      expect(compare(makeRoutine({ body: 'select 1' }), makeRoutine({ body: 'begin select 1; end' }))).toBe(false);
    });

    it('detects real body changes', () => {
      expect(compare(makeRoutine({ body: 'select 1' }), makeRoutine({ body: 'select 2' }))).toBe(true);
    });

    it('skips body diff when ignoreSchemaChanges includes "body"', () => {
      const to = makeRoutine({ body: 'select 2', ignoreSchemaChanges: ['body'] });
      expect(compare(makeRoutine({ body: 'select 1' }), to)).toBe(false);
    });

    it('skips body diff when either side uses expression escape hatch', () => {
      const to = makeRoutine({
        body: 'select 2',
        expression: 'CREATE FUNCTION test_routine() RETURNS int AS $$ select 2 $$',
      });
      expect(compare(makeRoutine({ body: 'select 1' }), to)).toBe(false);
    });

    it('diffs comment in both directions including removal', () => {
      // Removing a comment from metadata must trigger a diff so the DB-side comment gets dropped.
      expect(compare(makeRoutine({ comment: 'from db' }), makeRoutine({ comment: undefined }))).toBe(true);
      expect(compare(makeRoutine({ comment: 'old' }), makeRoutine({ comment: 'new' }))).toBe(true);
      // Both sides undefined — no diff.
      expect(compare(makeRoutine({ comment: undefined }), makeRoutine({ comment: undefined }))).toBe(false);
    });

    it('only diffs security when metadata side specifies it', () => {
      expect(compare(makeRoutine({ security: 'invoker' }), makeRoutine({ security: undefined }))).toBe(false);
      expect(compare(makeRoutine({ security: 'invoker' }), makeRoutine({ security: 'definer' }))).toBe(true);
    });

    it('only diffs deterministic when metadata side specifies it', () => {
      expect(compare(makeRoutine({ deterministic: false }), makeRoutine({ deterministic: undefined }))).toBe(false);
      expect(compare(makeRoutine({ deterministic: false }), makeRoutine({ deterministic: true }))).toBe(true);
    });

    it('only diffs definer when metadata side specifies it', () => {
      expect(compare(makeRoutine({ definer: 'root' }), makeRoutine({ definer: undefined }))).toBe(false);
      expect(compare(makeRoutine({ definer: 'root' }), makeRoutine({ definer: 'admin' }))).toBe(true);
    });
  });

  describe('diffRoutineParams', () => {
    const p = (name: string, type: string, direction: 'in' | 'out' | 'inout' = 'in', nullable?: boolean) => ({
      name,
      type,
      direction,
      ...(nullable != null ? { nullable } : {}),
    });

    it('detects different param counts', () => {
      expect(compare(makeRoutine({ params: [p('a', 'int')] }), makeRoutine({ params: [] }))).toBe(true);
    });

    it('detects param name change', () => {
      expect(compare(makeRoutine({ params: [p('a', 'int')] }), makeRoutine({ params: [p('b', 'int')] }))).toBe(true);
    });

    it('detects param direction change', () => {
      expect(compare(makeRoutine({ params: [p('a', 'int')] }), makeRoutine({ params: [p('a', 'int', 'inout')] }))).toBe(
        true,
      );
    });

    it('treats int/integer as equivalent param types', () => {
      expect(compare(makeRoutine({ params: [p('a', 'int')] }), makeRoutine({ params: [p('a', 'integer')] }))).toBe(
        false,
      );
    });

    it('treats varchar/character varying as equivalent param types', () => {
      expect(
        compare(
          makeRoutine({ params: [p('a', 'character varying')] }),
          makeRoutine({ params: [p('a', 'varchar(255)')] }),
        ),
      ).toBe(false);
    });

    it('detects nullable change', () => {
      expect(
        compare(
          makeRoutine({ params: [p('a', 'int', 'in', true)] }),
          makeRoutine({ params: [p('a', 'int', 'in', false)] }),
        ),
      ).toBe(true);
    });
  });

  describe('diffRoutineReturns', () => {
    it('treats both-undefined as no change', () => {
      expect(compare(makeRoutine({ returns: undefined }), makeRoutine({ returns: undefined }))).toBe(false);
    });

    it('detects returns added on one side', () => {
      expect(compare(makeRoutine({ returns: undefined }), makeRoutine({ returns: { type: 'integer' } }))).toBe(true);
    });

    it('detects returns removed on one side', () => {
      expect(compare(makeRoutine({ returns: { type: 'integer' } }), makeRoutine({ returns: undefined }))).toBe(true);
    });

    it('normalises return types like params (int/integer)', () => {
      expect(compare(makeRoutine({ returns: { type: 'int' } }), makeRoutine({ returns: { type: 'integer' } }))).toBe(
        false,
      );
    });

    it('detects a real return type change', () => {
      expect(compare(makeRoutine({ returns: { type: 'integer' } }), makeRoutine({ returns: { type: 'text' } }))).toBe(
        true,
      );
    });

    it('only diffs nullable when metadata side specifies it', () => {
      expect(
        compare(
          makeRoutine({ returns: { type: 'integer', nullable: true } }),
          makeRoutine({ returns: { type: 'integer' } }),
        ),
      ).toBe(false);
      expect(
        compare(
          makeRoutine({ returns: { type: 'integer' } }),
          makeRoutine({ returns: { type: 'integer', nullable: true } }),
        ),
      ).toBe(true);
    });
  });

  describe('addRoutinesFromMetadata', () => {
    it('resolves runtimeType aliases through the platform type system', () => {
      const cases = [
        { runtimeType: 'string' as const },
        { runtimeType: 'number' as const },
        { runtimeType: 'bigint' as const },
        { runtimeType: 'boolean' as const },
        { runtimeType: 'Date' as const },
        { runtimeType: 'Buffer' as const },
      ];

      for (const c of cases) {
        const meta = RoutineMetadata.fromConfig({
          name: 'r',
          type: 'function',
          params: { v: { runtimeType: c.runtimeType, type: c.runtimeType.toLowerCase() } },
          returns: { runtimeType: c.runtimeType },
          body: 'select v',
        });

        const schema = new DatabaseSchema(orm.em.getPlatform(), '');
        schema.addRoutinesFromMetadata([meta], orm.em.getPlatform());
        const routine = schema.getRoutines()[0];
        expect(routine.params[0].type).toBeTruthy();
      }
    });

    it('passes through type strings that are not in the alias table', () => {
      const meta = RoutineMetadata.fromConfig({
        name: 'r',
        type: 'function',
        params: { v: { type: 'unknown_sql_type' } },
        returns: { runtimeType: 'string' },
        body: 'select v',
      });

      const schema = new DatabaseSchema(orm.em.getPlatform(), '');
      schema.addRoutinesFromMetadata([meta], orm.em.getPlatform());
      expect(schema.getRoutines()[0].params[0].type).toBe('unknown_sql_type');
    });

    it('handles a body callback that returns a Raw fragment', () => {
      const def = new Routine({
        name: 'r',
        type: 'function',
        params: { v: { type: 'int' } },
        returns: { runtimeType: 'number' },
        body: () => raw('select :v', { v: 1 }),
      });
      const schema = new DatabaseSchema(orm.em.getPlatform(), '');
      schema.addRoutinesFromMetadata([def.meta], orm.em.getPlatform());
      expect(schema.getRoutines()[0].body).toContain('select');
    });

    it('handles a body provided as a Raw fragment directly', () => {
      const def = new Routine({
        name: 'r',
        type: 'function',
        params: { v: { type: 'int' } },
        returns: { runtimeType: 'number' },
        body: raw('select :v', { v: 1 }),
      });
      const schema = new DatabaseSchema(orm.em.getPlatform(), '');
      schema.addRoutinesFromMetadata([def.meta], orm.em.getPlatform());
      expect(schema.getRoutines()[0].body).toContain('select');
    });

    it('leaves body undefined when callback returns an unexpected value', () => {
      const def = new Routine({
        name: 'r',
        type: 'function',
        params: { v: { type: 'int' } },
        returns: { runtimeType: 'number' },
        body: (() => 42 as any) as any,
      });
      const schema = new DatabaseSchema(orm.em.getPlatform(), '');
      schema.addRoutinesFromMetadata([def.meta], orm.em.getPlatform());
      expect(schema.getRoutines()[0].body).toBeUndefined();
    });

    it('handles a routine without a body (e.g. bodyJs-only function for SQLite)', () => {
      const def = new Routine({
        name: 'r',
        type: 'function',
        params: { v: { type: 'int' } },
        returns: { runtimeType: 'number' },
        bodyJs: ({ v }: { v: number }) => v,
      });
      const schema = new DatabaseSchema(orm.em.getPlatform(), '');
      schema.addRoutinesFromMetadata([def.meta], orm.em.getPlatform());
      expect(schema.getRoutines()[0].body).toBeUndefined();
    });

    it('omits returns when the routine declares a non-runtimeType return shape', () => {
      // Multi-result-set / entity-class returns aren't supported today; they fall through to undefined.
      const meta = RoutineMetadata.fromConfig({
        name: 'r',
        type: 'procedure',
        params: {},
        body: 'BEGIN END',
        returns: () => class FakeEntity {} as any,
      });
      const schema = new DatabaseSchema(orm.em.getPlatform(), '');
      schema.addRoutinesFromMetadata([meta], orm.em.getPlatform());
      expect(schema.getRoutines()[0].returns).toBeUndefined();
    });
  });

  describe('compareRoutines (top-level)', () => {
    it('flags routines as new/removed when name keys mismatch', () => {
      const fromSchema = new DatabaseSchema(orm.em.getPlatform(), '');
      const toSchema = new DatabaseSchema(orm.em.getPlatform(), '');
      fromSchema.addRoutine(makeRoutine({ name: 'gone' }));
      toSchema.addRoutine(makeRoutine({ name: 'fresh' }));

      const diff = comparator.compare(fromSchema, toSchema);
      expect(Object.keys(diff.newRoutines)).toEqual(['fresh']);
      expect(Object.keys(diff.removedRoutines)).toEqual(['gone']);
    });

    it('handles schema-qualified routine names independently', () => {
      const fromSchema = new DatabaseSchema(orm.em.getPlatform(), '');
      const toSchema = new DatabaseSchema(orm.em.getPlatform(), '');
      fromSchema.addRoutine(makeRoutine({ name: 'foo', schema: 'public' }));
      toSchema.addRoutine(makeRoutine({ name: 'foo', schema: 'analytics' }));

      const diff = comparator.compare(fromSchema, toSchema);
      expect(Object.keys(diff.newRoutines)).toEqual(['analytics.foo']);
      expect(Object.keys(diff.removedRoutines)).toEqual(['public.foo']);
    });

    it('changedRoutines carries both from and to so DROP can use the old signature', () => {
      // Param-signature change: DROP must reference the OLD params (PG drop is signature-based).
      const from = makeRoutine({
        name: 'foo',
        params: [{ name: 'a', type: 'integer', direction: 'in' }],
      });
      const to = makeRoutine({
        name: 'foo',
        params: [{ name: 'a', type: 'text', direction: 'in' }],
      });

      const fromSchema = new DatabaseSchema(orm.em.getPlatform(), '');
      const toSchema = new DatabaseSchema(orm.em.getPlatform(), '');
      fromSchema.addRoutine(from);
      toSchema.addRoutine(to);

      const diff = comparator.compare(fromSchema, toSchema);
      expect(diff.changedRoutines.foo).toBeDefined();
      expect(diff.changedRoutines.foo.from.params[0].type).toBe('integer');
      expect(diff.changedRoutines.foo.to.params[0].type).toBe('text');
    });
  });
});
