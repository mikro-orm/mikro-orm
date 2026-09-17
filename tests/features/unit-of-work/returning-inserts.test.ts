import { defineEntity, MikroORM, p, Utils } from '@mikro-orm/sql';
import type { AbstractSqlDriver } from '@mikro-orm/sql';
import { PLATFORMS } from '../../bootstrap.js';
import { mockLogger } from '../../helpers.js';

const Customer = defineEntity({
  name: 'ReturningCustomer',
  properties: {
    id: p.integer().primary().autoincrement(),
    name: p.string().trim().returning(),
    code: p.string().uppercase().fieldName('normalized_code').returning(),
    email: p.string().lowercase().returning(),
    unreturned: p.string().trim(),
    disabled: p.string().trim().returning(false),
    optional: p.string().nullable().returning(),
    counter: p.integer().defaultRaw('42'),
  },
});

const options = {
  postgresql: { dbName: 'mikro_orm_returning_inserts' },
  sqlite: { dbName: ':memory:' },
  mssql: { dbName: 'mikro_orm_returning_inserts', password: 'Root.Root' },
};

const input = {
  name: ' Example ',
  code: 'Abc',
  email: 'Alice@EXAMPLE.COM',
  unreturned: ' Unreturned ',
  disabled: ' Disabled ',
};

const normalized = {
  name: 'Example',
  code: 'ABC',
  email: 'alice@example.com',
  optional: null,
  counter: 42,
};

const inputs = [input, { ...input, name: ' Another ', code: 'Xyz', email: 'Bob@EXAMPLE.COM' }];
const expected = [normalized, { ...normalized, name: 'Another', code: 'XYZ', email: 'bob@example.com' }];

describe.each(Utils.keys(options))('returning properties on insert [%s]', type => {
  let orm: MikroORM<AbstractSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init<AbstractSqlDriver>({
      entities: [Customer],
      driver: PLATFORMS[type],
      ...options[type],
    });
    await orm.schema.refresh();
  });

  let useBatchInserts: boolean;

  beforeEach(() => {
    useBatchInserts = orm.config.get('useBatchInserts');
    return orm.schema.clear();
  });
  afterEach(() => orm.config.set('useBatchInserts', useBatchInserts));
  afterAll(() => orm.close(true));

  const returning = {
    postgresql: 'returning "id", "name", "normalized_code", "email", "optional", "counter"',
    sqlite: 'returning `id`, `name`, `normalized_code`, `email`, `optional`, `counter`',
    mssql:
      'output inserted.[id], inserted.[name], inserted.[normalized_code], inserted.[email], inserted.[optional], inserted.[counter]',
  }[type];

  test.each([
    { count: 1, useBatchInserts: true },
    { count: 2, useBatchInserts: true },
    { count: 2, useBatchInserts: false },
  ])(
    'hydrates supplied properties on flush ($count entities, batching=$useBatchInserts)',
    async ({ count, useBatchInserts }) => {
      orm.config.set('useBatchInserts', useBatchInserts);
      const em = orm.em.fork();
      const customers = inputs.slice(0, count).map(data => em.create(Customer, data));
      const mock = mockLogger(orm);

      await em.flush();

      const queries = mock.mock.calls.map(([query]) => query as string);
      const inserts = queries.filter(query => query.includes('insert into'));
      expect(inserts).toHaveLength(useBatchInserts ? 1 : count);
      expect(queries.filter(query => /\bselect\b/i.test(query))).toEqual([]);
      for (const query of inserts) {
        expect(query).toContain(returning);
      }
      for (const [i, customer] of customers.entries()) {
        expect(customer).toMatchObject({ ...expected[i], unreturned: input.unreturned, disabled: input.disabled });
      }

      mock.mockClear();
      await em.flush();
      expect(mock).not.toHaveBeenCalled();

      const reloaded = await em.fork().find(Customer, {}, { orderBy: { id: 'asc' } });
      expect(reloaded).toHaveLength(count);
      for (const [i, customer] of reloaded.entries()) {
        expect(customer).toMatchObject({ ...expected[i], unreturned: 'Unreturned', disabled: 'Disabled' });
      }
    },
  );

  test.each([1, 2])('returns supplied properties for QueryBuilder inserts (%s rows)', async count => {
    const data = count === 1 ? input : inputs;
    const qb = orm.em.createQueryBuilder(Customer).insert(data);

    expect(qb.getQuery()).toContain(returning);
    const result = await qb.execute('run');
    expect(result.row).toMatchObject({
      name: 'Example',
      normalized_code: 'ABC',
      email: 'alice@example.com',
      optional: null,
      counter: 42,
    });
    expect(result.row).not.toHaveProperty('unreturned');
    expect(result.row).not.toHaveProperty('disabled');
    expect(await orm.em.count(Customer)).toBe(count);
  });

  test('respects an explicit QueryBuilder returning list', async () => {
    const result = await orm.em.createQueryBuilder(Customer).insert(input).returning(['id']).execute('run');

    expect(result.row).toEqual({ id: expect.any(Number) });
  });
});
