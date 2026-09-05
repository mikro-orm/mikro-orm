import { DataloaderType, defineEntity, MikroORM, QueryOrder } from '@mikro-orm/sqlite';

const Competency = defineEntity({
  name: 'Competency',
  properties: p => ({
    id: p.integer().primary(),
    name: p.string(),
  }),
  orderBy: {
    name: QueryOrder.ASC,
    id: QueryOrder.ASC,
  },
});

const Step = defineEntity({
  name: 'Step',
  properties: p => ({
    id: p.integer().primary(),
    competencies: () => p.manyToMany(Competency).pivotEntity(() => StepCompetency),
  }),
});

const StepCompetency = defineEntity({
  name: 'StepCompetency',
  properties: p => ({
    step: () => p.manyToOne(Step).primary(),
    competency: () => p.manyToOne(Competency).primary(),
  }),
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Step, Competency, StepCompetency],
    dbName: ':memory:',
    dataloader: DataloaderType.ALL,
  });
  await orm.schema.refresh();

  const em = orm.em.fork();
  await em.insertMany(Competency, [
    { id: 1, name: 'b' },
    { id: 2, name: 'a' },
    { id: 3, name: 'c' },
  ]);
  await em.insert(Step, { id: 1 });
  await em.insertMany(StepCompetency, [
    { step: 1, competency: 1 },
    { step: 1, competency: 2 },
    { step: 1, competency: 3 },
  ]);
});

afterAll(async () => {
  await orm.close(true);
});

test('M:N loadItems with dataloader respects target entity default orderBy', async () => {
  const em = orm.em.fork();
  const step = await em.findOneOrFail(Step, 1);
  const items = await step.competencies.loadItems();
  expect(items.map(c => c.id)).toEqual([2, 1, 3]);
});

test('M:N loadItems with dataloader respects explicit orderBy option', async () => {
  const em = orm.em.fork();
  const step = await em.findOneOrFail(Step, 1);
  const items = await step.competencies.loadItems({ orderBy: { id: QueryOrder.DESC } });
  expect(items.map(c => c.id)).toEqual([3, 2, 1]);
});
