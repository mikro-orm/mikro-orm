import { defineEntity, MikroORM, p, Routine } from '@mikro-orm/postgresql';

const Item = defineEntity({
  name: 'Item',
  properties: {
    id: p.integer().primary(),
  },
});

const types = [
  'varchar(20)',
  'character varying(20)',
  'char(3)',
  'character(3)',
  'bit(4)',
  'varbit(8)',
  'bit varying(8)',
  'numeric(12,4)',
  'decimal(12, 4)',
  'time(3)',
  'time(3) with time zone',
  'timetz(3)',
  'timestamp(3)',
  'timestamp(3) without time zone',
  'timestamp(3) with time zone',
  'timestamptz(3)',
  'interval(3)',
  'interval day to second(3)',
  'interval year to month',
  'varchar(20)[]',
  'numeric(12,4)[]',
  'timestamp(3)[]',
];

const routines = types.flatMap((type, i) => [
  new Routine({
    name: `pt_fn_${i}`,
    type: 'function',
    language: 'sql',
    params: { a: { type } },
    returns: { runtimeType: 'string', columnType: type },
    body: 'select a',
  }),
  new Routine({
    name: `pt_proc_${i}`,
    type: 'procedure',
    language: 'plpgsql',
    params: { a: { type }, b: { type, direction: 'inout', ref: true } },
    body: 'b := a;',
  }),
]);

const changes = [
  ['varchar(20)', 'text'],
  ['varchar(20)', 'char(20)'],
  ['integer', 'bigint'],
  ['numeric(12,4)', 'double precision'],
  ['timestamp(3)', 'timestamp(3) with time zone'],
  ['time(3)', 'time(3) with time zone'],
  ['varchar(20)', 'varchar(20)[]'],
  ['bit(4)', 'varbit(4)'],
];

const changed = changes.flatMap(([, type], i) => [
  new Routine({
    name: `pt_changed_param_${i}`,
    type: 'function',
    language: 'sql',
    params: { a: { type } },
    returns: { runtimeType: 'number', columnType: 'integer' },
    body: 'select 1',
  }),
  new Routine({
    name: `pt_changed_return_${i}`,
    type: 'function',
    language: 'plpgsql',
    params: {},
    returns: { runtimeType: 'string', columnType: type },
    body: 'return null;',
  }),
]);

describe('routines with parameterised types produce a stable diff (postgres)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Item],
      routines: [...routines, ...changed],
      dbName: 'mikro_orm_test_routine_parameterised_types',
    });
    await orm.schema.refresh();
  });

  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('type modifiers of parameters and return types do not re-emit the routine', async () => {
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  });

  test('a different parameter or return type is still detected', async () => {
    for (const [i, [type]] of changes.entries()) {
      await orm.schema.execute(`
        drop function pt_changed_param_${i};
        drop function pt_changed_return_${i};
        create function pt_changed_param_${i}(a ${type}) returns integer language sql as 'select 1';
        create function pt_changed_return_${i}() returns ${type} language plpgsql as 'begin return null; end';
      `);
    }

    const sql = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    const names = changed.map(r => r.name);
    expect(names.filter(name => !sql.includes(`function "${name}"`))).toEqual([]);

    await orm.schema.execute(sql);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  });
});
