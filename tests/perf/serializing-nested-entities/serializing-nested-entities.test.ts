import { MikroORM } from '@mikro-orm/sqlite';
import { Filter, FilterValue, Project, Risk } from './entities';
import { DatabaseSeeder } from './seeder';

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Project, Risk, Filter, FilterValue],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
  const seeder = new DatabaseSeeder();
  await seeder.run(orm.em);
  orm.em.clear();
});

afterAll(() => orm.close(true));

test('perf: serialize nested entities', async () => {
  const risks = await orm.em.find(Risk, {}, { populate: ['*'] });
  const project = await orm.em.findOneOrFail(Project, { id: 1 });

  // Serialize a collection of 150 entities
  console.time('perf: serialize risks');
  const stringRisks1 = JSON.stringify(risks);
  console.timeEnd('perf: serialize risks');

  // Serialize an entity with the same collection of 150 entities as above
  // Next extract the 150 entities, giving the same result as stringRisks above
  console.time('perf: serialize project');
  const stringProject = JSON.stringify(project);
  const stringRisks2 = JSON.stringify(JSON.parse(stringProject).risks);
  console.timeEnd('perf: serialize project');

  // See that the stringified results are the same
  expect(stringRisks1).toBe(stringRisks2);
});
