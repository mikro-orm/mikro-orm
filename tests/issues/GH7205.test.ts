import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

const Target7205 = defineEntity({
  name: 'Target7205',
  properties: {
    name: p.string().primary(),
    lostAttribute: p.string(),
  },
});

const Step7205 = defineEntity({
  name: 'Step7205',
  properties: {
    name: p.string().primary(),
    target: () => p.oneToOne(Target7205).owner().primary(),
  },
});

const User7205 = defineEntity({
  name: 'User7205',
  properties: {
    name: p.string(),
    step: () => p.manyToOne(Step7205).primary(),
    direct: () => p.manyToOne(Target7205).primary(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = new MikroORM({
    entities: [User7205, Step7205, Target7205],
    dbName: ':memory:',
  });
  await orm.schema.create();

  const target1 = orm.em.create(Target7205, { name: 'test-target1', lostAttribute: 'target1' });
  const target2 = orm.em.create(Target7205, { name: 'test-target2', lostAttribute: 'target2' });
  const target3 = orm.em.create(Target7205, { name: 'test-target3', lostAttribute: 'target3' });
  const step1 = orm.em.create(Step7205, { name: 'Step1', target: target1 });
  const step2 = orm.em.create(Step7205, { name: 'Step2', target: target3 });
  orm.em.create(User7205, { name: 'User1', direct: target2, step: step1 });
  orm.em.create(User7205, { name: 'User2', direct: target1, step: step2 });

  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

test('GH #7205 - fields from different relation paths should not clobber each other', async () => {
  const users = await orm.em.fork().find(
    User7205,
    {},
    {
      fields: [
        'direct.name',
        'direct.lostAttribute',
        'step.name',
        'step.target.name', // load target through step, but without lostAttribute
      ],
      orderBy: [{ name: 'asc' }],
    },
  );

  // All users should have direct.lostAttribute populated
  const allDirectAttributes = users.map(u => u.direct.lostAttribute);
  expect(allDirectAttributes).toEqual(['target2', 'target1']);
});

test('GH #7205 - fields from different relation paths should not clobber each other (desc order)', async () => {
  const users = await orm.em.fork().find(
    User7205,
    {},
    {
      fields: [
        'direct.name',
        'direct.lostAttribute',
        'step.name',
        'step.target.name',
      ],
      orderBy: [{ name: 'desc' }],
    },
  );

  // All users should have direct.lostAttribute populated regardless of order
  const allDirectAttributes = users.map(u => u.direct.lostAttribute);
  expect(allDirectAttributes).toEqual(['target1', 'target2']);
});
