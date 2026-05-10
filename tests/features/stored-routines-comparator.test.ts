import { MikroORM, SchemaComparator } from '@mikro-orm/sqlite';
import { DatabaseSchema, type SqlRoutineDef } from '@mikro-orm/sql';

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

    it('only diffs comment when metadata side specifies it', () => {
      expect(compare(makeRoutine({ comment: 'from db' }), makeRoutine({ comment: undefined }))).toBe(false);
      expect(compare(makeRoutine({ comment: 'old' }), makeRoutine({ comment: 'new' }))).toBe(true);
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
  });
});
