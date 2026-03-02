import { MikroORM, type AbstractSqlDriver } from '@mikro-orm/sql';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Author, cteEntities, cteMetadataProvider, cteIntegrationTests } from './cte-shared.js';

let orm: MikroORM<AbstractSqlDriver>;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: cteEntities,
    metadataProvider: cteMetadataProvider,
    driver: PostgreSqlDriver,
    dbName: `mikro_orm_test_cte_${(Math.random() + 1).toString(36).substring(2)}`,
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.schema.dropDatabase();
  await orm.close(true);
});

cteIntegrationTests(() => orm);

test('MATERIALIZED hint executes', async () => {
  orm.em.create(Author, { name: 'Mat', age: 25 });
  await orm.em.flush();
  orm.em.clear();

  const sub = orm.em.createQueryBuilder(Author, 'a').select('*').where({ name: 'Mat' });
  const qb = orm.em.createQueryBuilder(Author, 'a2')
    .with('cte', sub, { materialized: true })
    .select('*')
    .where({ name: 'Mat' });

  const results = await qb.getResultList();
  expect(results).toHaveLength(1);
  expect(results[0].name).toBe('Mat');

  await orm.em.nativeDelete(Author, {});
});

test('NOT MATERIALIZED hint executes', async () => {
  orm.em.create(Author, { name: 'NMat', age: 25 });
  await orm.em.flush();
  orm.em.clear();

  const sub = orm.em.createQueryBuilder(Author, 'a').select('*').where({ name: 'NMat' });
  const qb = orm.em.createQueryBuilder(Author, 'a2')
    .with('cte', sub, { materialized: false })
    .select('*')
    .where({ name: 'NMat' });

  const results = await qb.getResultList();
  expect(results).toHaveLength(1);
  expect(results[0].name).toBe('NMat');

  await orm.em.nativeDelete(Author, {});
});
