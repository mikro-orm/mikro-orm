import { MikroORM as MySqlMikroORM, MySqlSchemaHelper } from '@mikro-orm/mysql';
import { MikroORM as PgMikroORM, PostgreSqlSchemaHelper } from '@mikro-orm/postgresql';
import { MikroORM as MsSqlMikroORM, MsSqlSchemaHelper } from '@mikro-orm/mssql';
import { MikroORM as OracleMikroORM, OracleSchemaHelper } from '@mikro-orm/oracledb';
import { stripStatementNewlines, type SqlRoutineDef } from '@mikro-orm/sql';

const baseRoutine: SqlRoutineDef = {
  name: 'r',
  type: 'function',
  params: [{ name: 'x', type: 'int', direction: 'in' }],
  body: 'select 1',
  returns: { type: 'integer' },
};

describe('stored routines — dialect helper unit tests', () => {
  describe('stripStatementNewlines', () => {
    it('replaces only `;\\n` boundaries, preserving line comments and string-literal newlines', () => {
      const body = `-- header comment
SET x = 1;
SET y = 'hello
world';
SELECT y`;
      const out = stripStatementNewlines(body);
      expect(out).toContain('SET x = 1; SET y');
      // line-comment newline preserved — otherwise the comment would swallow the next statement.
      expect(out).toContain('-- header comment\nSET x = 1');
      expect(out).toContain("'hello\nworld'");
    });
  });

  describe('MySQL', () => {
    let helper: MySqlSchemaHelper;
    let orm: MySqlMikroORM;

    beforeAll(async () => {
      orm = await MySqlMikroORM.init({
        dbName: 'x',
        port: 3308,
        user: 'root',
        entities: [],
        discovery: { warnWhenNoEntities: false },
      });
      helper = orm.em.getPlatform().getSchemaHelper()! as MySqlSchemaHelper;
    });

    afterAll(() => orm.close(true));

    it('createRoutine renders all dataAccess modes', () => {
      const cases: { input: SqlRoutineDef['dataAccess']; expected: string }[] = [
        { input: 'no-sql', expected: 'no sql' },
        { input: 'reads-sql-data', expected: 'reads sql data' },
        { input: 'modifies-sql-data', expected: 'modifies sql data' },
        { input: 'contains-sql', expected: 'contains sql' },
      ];

      for (const { input, expected } of cases) {
        const sql = helper.createRoutine({ ...baseRoutine, dataAccess: input });
        expect(sql).toContain(expected);
      }
    });

    it('createRoutine omits dataAccess clause when unspecified', () => {
      const sql = helper.createRoutine({ ...baseRoutine, dataAccess: undefined });
      expect(sql).not.toMatch(/no sql|reads sql|modifies sql|contains sql/);
    });

    it('createRoutine emits comment clause when provided', () => {
      const sql = helper.createRoutine({ ...baseRoutine, comment: 'hello' });
      expect(sql).toContain("comment 'hello'");
    });

    it('createRoutine emits "not deterministic" for deterministic=false', () => {
      const sql = helper.createRoutine({ ...baseRoutine, deterministic: false });
      expect(sql).toContain('not deterministic');
    });

    it('createRoutine returns the raw expression when one is provided', () => {
      const sql = helper.createRoutine({ ...baseRoutine, expression: 'CREATE FUNCTION raw() RETURNS int RETURN 1' });
      expect(sql).toBe('CREATE FUNCTION raw() RETURNS int RETURN 1');
    });

    it('createRoutine uses default `text` return type when none specified', () => {
      const sql = helper.createRoutine({ ...baseRoutine, returns: undefined });
      expect(sql).toMatch(/returns text/i);
    });

    it('createRoutine for procedure emits IN/OUT/INOUT prefixes on params', () => {
      const sql = helper.createRoutine({
        ...baseRoutine,
        type: 'procedure',
        params: [
          { name: 'i', type: 'int', direction: 'in' },
          { name: 'o', type: 'int', direction: 'out' },
          { name: 'io', type: 'int', direction: 'inout' },
        ],
      });
      expect(sql).toContain('IN `i` int');
      expect(sql).toContain('OUT `o` int');
      expect(sql).toContain('INOUT `io` int');
    });

    it('dropRoutine emits drop function/procedure based on type', () => {
      expect(helper.dropRoutine(baseRoutine)).toMatch(/drop function if exists/i);
      expect(helper.dropRoutine({ ...baseRoutine, type: 'procedure' })).toMatch(/drop procedure if exists/i);
    });

    it('createRoutine emits security definer/invoker clauses', () => {
      expect(helper.createRoutine({ ...baseRoutine, security: 'definer' })).toContain('sql security definer');
      expect(helper.createRoutine({ ...baseRoutine, security: 'invoker' })).toContain('sql security invoker');
    });

    it('createRoutine emits "deterministic" for deterministic=true', () => {
      const sql = helper.createRoutine({ ...baseRoutine, deterministic: true });
      expect(sql).toContain(' deterministic');
      expect(sql).not.toContain('not deterministic');
    });

    it('createRoutine omits clauses when corresponding options are unset', () => {
      const sql = helper.createRoutine({
        ...baseRoutine,
        deterministic: undefined,
        security: undefined,
        comment: undefined,
        dataAccess: undefined,
      });
      expect(sql).not.toMatch(/deterministic/);
      expect(sql).not.toMatch(/sql security/);
      expect(sql).not.toMatch(/comment/);
    });
  });

  describe('PostgreSQL', () => {
    let helper: PostgreSqlSchemaHelper;
    let orm: PgMikroORM;

    beforeAll(async () => {
      orm = await PgMikroORM.init({
        dbName: 'x',
        entities: [],
        discovery: { warnWhenNoEntities: false },
      });
      helper = orm.em.getPlatform().getSchemaHelper()! as PostgreSqlSchemaHelper;
    });

    afterAll(() => orm.close(true));

    it('createRoutine emits security definer/invoker clauses', () => {
      const def = helper.createRoutine({ ...baseRoutine, security: 'definer' });
      const inv = helper.createRoutine({ ...baseRoutine, security: 'invoker' });
      expect(def).toContain('security definer');
      expect(inv).toContain('security invoker');
    });

    it('createRoutine emits immutable/volatile for deterministic flag', () => {
      expect(helper.createRoutine({ ...baseRoutine, deterministic: true })).toContain('immutable');
      expect(helper.createRoutine({ ...baseRoutine, deterministic: false })).toContain('volatile');
    });

    it('createRoutine returns the raw expression when one is provided', () => {
      const sql = helper.createRoutine({
        ...baseRoutine,
        expression: 'CREATE FUNCTION raw() RETURNS int LANGUAGE sql AS $$ select 1 $$',
      });
      expect(sql).toBe('CREATE FUNCTION raw() RETURNS int LANGUAGE sql AS $$ select 1 $$');
    });

    it('createRoutine emits procedure DDL distinct from function DDL', () => {
      const proc = helper.createRoutine({ ...baseRoutine, type: 'procedure' });
      expect(proc).toMatch(/create or replace procedure/i);
    });

    it('dropRoutine emits the argument type signature', () => {
      const sql = helper.dropRoutine({
        ...baseRoutine,
        params: [
          { name: 'a', type: 'int', direction: 'in' },
          { name: 'b', type: 'text', direction: 'in' },
        ],
      });
      expect(sql).toMatch(/drop function if exists .+\(int, text\)/i);
    });

    it('createRoutine omits security/determinism when unset', () => {
      const sql = helper.createRoutine({ ...baseRoutine, security: undefined, deterministic: undefined });
      expect(sql).not.toContain('security');
      expect(sql).not.toMatch(/immutable|volatile/);
    });

    it('createRoutine preserves a body that already starts with BEGIN/END', () => {
      const sql = helper.createRoutine({
        ...baseRoutine,
        type: 'procedure',
        language: 'plpgsql',
        body: 'BEGIN insert into t values (1); END',
      });
      // Should not double-wrap — the body must appear once between $$ markers.
      expect(sql.match(/begin/gi)?.length).toBe(1);
      expect(sql.match(/end/gi)?.length).toBe(1);
    });

    it('createRoutine emits schema-qualified name when routine.schema differs from default', () => {
      const sql = helper.createRoutine({
        ...baseRoutine,
        schema: 'analytics',
      });
      expect(sql).toContain('"analytics"."r"');
    });

    it('dropRoutine emits schema-qualified name when routine.schema differs from default', () => {
      const sql = helper.dropRoutine({
        ...baseRoutine,
        schema: 'analytics',
      });
      expect(sql).toContain('"analytics"."r"');
    });

    it('createRoutine emits OUT/INOUT direction prefixes for procedures', () => {
      const sql = helper.createRoutine({
        ...baseRoutine,
        type: 'procedure',
        params: [
          { name: 'i', type: 'int', direction: 'in' },
          { name: 'o', type: 'int', direction: 'out' },
          { name: 'io', type: 'int', direction: 'inout' },
        ],
      });
      expect(sql).toContain('OUT "o"');
      expect(sql).toContain('INOUT "io"');
    });

    it('createRoutine emits param `default` clause when defaultRaw is provided', () => {
      const sql = helper.createRoutine({
        ...baseRoutine,
        params: [{ name: 'x', type: 'int', direction: 'in', defaultRaw: '42' }],
      });
      expect(sql).toContain('default 42');
    });
  });

  describe('MSSQL', () => {
    let helper: MsSqlSchemaHelper;
    let orm: MsSqlMikroORM;

    beforeAll(async () => {
      orm = await MsSqlMikroORM.init({
        dbName: 'x',
        password: 'Root.Root',
        entities: [],
        discovery: { warnWhenNoEntities: false },
      });
      helper = orm.em.getPlatform().getSchemaHelper()! as MsSqlSchemaHelper;
    });

    afterAll(() => orm.close(true));

    it('routineParamReference prefixes the param name with @', () => {
      expect(helper.routineParamReference('foo')).toBe('@foo');
    });

    it('createRoutine emits OUTPUT on out/inout params for procedures', () => {
      const sql = helper.createRoutine({
        ...baseRoutine,
        type: 'procedure',
        params: [
          { name: 'i', type: 'int', direction: 'in' },
          { name: 'o', type: 'int', direction: 'out' },
        ],
      });
      expect(sql).toContain('@i int');
      expect(sql).toContain('@o int OUTPUT');
    });

    it('createRoutine returns the raw expression when one is provided', () => {
      const sql = helper.createRoutine({
        ...baseRoutine,
        expression: 'CREATE FUNCTION raw() RETURNS int AS BEGIN RETURN 1 END',
      });
      expect(sql).toBe('CREATE FUNCTION raw() RETURNS int AS BEGIN RETURN 1 END');
    });

    it('dropRoutine emits drop procedure/function based on type', () => {
      expect(helper.dropRoutine(baseRoutine)).toMatch(/drop function if exists/i);
      expect(helper.dropRoutine({ ...baseRoutine, type: 'procedure' })).toMatch(/drop procedure if exists/i);
    });

    it('normaliseRoutineParamDirection folds OUT into INOUT (T-SQL has no distinct OUT-only direction)', () => {
      expect(helper.normaliseRoutineParamDirection('in')).toBe('in');
      expect(helper.normaliseRoutineParamDirection('out')).toBe('inout');
      expect(helper.normaliseRoutineParamDirection('inout')).toBe('inout');
    });
  });

  describe('Oracle', () => {
    let helper: OracleSchemaHelper;
    let orm: OracleMikroORM;

    beforeAll(async () => {
      orm = await OracleMikroORM.init({
        dbName: 'x',
        password: 'oracle123',
        entities: [],
        discovery: { warnWhenNoEntities: false },
      });
      helper = orm.em.getPlatform().getSchemaHelper()! as OracleSchemaHelper;
    });

    afterAll(() => orm.close(true));

    it('createRoutine strips length/precision from PL/SQL formal param types', () => {
      const sql = helper.createRoutine({
        ...baseRoutine,
        params: [{ name: 'x', type: 'varchar2(255)', direction: 'in' }],
      });
      expect(sql).toMatch(/IN varchar2/i);
      expect(sql).not.toContain('varchar2(255)');
    });

    it('createRoutine emits IN/OUT/IN OUT direction keywords', () => {
      const sql = helper.createRoutine({
        ...baseRoutine,
        type: 'procedure',
        params: [
          { name: 'i', type: 'number', direction: 'in' },
          { name: 'o', type: 'number', direction: 'out' },
          { name: 'io', type: 'number', direction: 'inout' },
        ],
      });
      expect(sql).toMatch(/"I" IN number/i);
      expect(sql).toMatch(/"O" OUT number/i);
      expect(sql).toMatch(/"IO" IN OUT number/i);
    });

    it('createRoutine emits no-arg signature when params list is empty', () => {
      const sql = helper.createRoutine({ ...baseRoutine, params: [], returns: undefined });
      expect(sql).not.toContain('()');
      expect(sql).toMatch(/return VARCHAR2 as/i);
    });

    it('createRoutine returns the raw expression when one is provided', () => {
      const sql = helper.createRoutine({
        ...baseRoutine,
        expression: 'CREATE OR REPLACE FUNCTION raw RETURN NUMBER AS BEGIN RETURN 1; END;',
      });
      expect(sql).toBe('CREATE OR REPLACE FUNCTION raw RETURN NUMBER AS BEGIN RETURN 1; END;');
    });

    it('dropRoutine emits uppercase routine name with if-exists guard', () => {
      const sql = helper.dropRoutine(baseRoutine);
      expect(sql).toMatch(/drop function if exists "R"/i);
    });
  });
});
