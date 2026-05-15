// When a composite index has `columns` overriding a subset of the columns
// listed in `properties`, the schema generator dropped the property columns
// that were not mentioned in `columns` instead of merging the overrides into
// the full property column list.
import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

const Client = defineEntity({
  name: 'ClientGHx51',
  tableName: 'client_ghx51',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

const Job = defineEntity({
  name: 'JobGHx51',
  tableName: 'job_ghx51',
  indexes: [
    {
      name: 'job_ghx51_client_closed_at_idx',
      properties: ['client', 'closedAt'],
      columns: [{ name: 'closedAt', sort: 'DESC' }],
    },
  ],
  properties: {
    id: p.integer().primary(),
    client: () => p.manyToOne(Client),
    closedAt: p.datetime().nullable(),
  },
});

describe('GHx51', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: ':memory:',
      entities: [Client, Job],
    });
  });

  afterAll(() => orm.close(true));

  test('schema generator keeps property columns when index columns customize another column', async () => {
    const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });

    expect(sql).toContain(
      'create index `job_ghx51_client_closed_at_idx` on `job_ghx51` (`client_id`, `closed_at` DESC);',
    );
  });
});
