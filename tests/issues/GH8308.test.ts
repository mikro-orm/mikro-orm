import { defineEntity, p } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

const Questionnaire = defineEntity({
  name: 'Questionnaire',
  properties: {
    id: p.integer().primary(),
    name: p.json<{ en: string }>(),
  },
});

const ContributingEntity = defineEntity({
  name: 'ContributingEntity',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

const Contributor = defineEntity({
  name: 'Contributor',
  properties: {
    id: p.integer().primary(),
  },
});

const Task = defineEntity({
  name: 'Task',
  properties: {
    id: p.integer().primary(),
    questionnaire: () => p.manyToOne(Questionnaire),
    contributingEntity: () => p.manyToOne(ContributingEntity),
    contributingEntityId: p.integer().persist(false),
    assignedContributors: () => p.manyToMany(Contributor),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Task, Questionnaire, ContributingEntity, Contributor],
    dbName: ':memory:',
  });
  await orm.schema.create();
  const contributor = orm.em.create(Contributor, { id: 1 });
  orm.em.create(Task, {
    id: 1,
    questionnaire: { id: 1, name: { en: 'b' } },
    contributingEntity: { id: 1, name: 'a' },
    assignedContributors: [contributor],
  });
  orm.em.create(Task, {
    id: 2,
    questionnaire: { id: 2, name: { en: 'a' } },
    contributingEntity: { id: 2, name: 'b' },
    assignedContributors: [contributor],
  });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

test('GH #8308 paginated orderBy on a relation next to a populated relation with a same-named json property', async () => {
  const mock = mockLogger(orm);
  const tasks = await orm.em.fork().find(
    Task,
    { assignedContributors: { id: { $in: [1] } } },
    {
      limit: 1,
      orderBy: { contributingEntity: { name: 'ASC' } },
      populate: ['questionnaire'],
    },
  );
  expect(tasks.map(t => t.id)).toEqual([1]);
  expect(mock.mock.calls[0][0]).toMatch('order by min(`c3`.`name`) asc limit 1');
});

test('GH #8308 paginated orderBy on a persist(false) property mapped to a relation column', async () => {
  const mock = mockLogger(orm);
  const tasks = await orm.em.fork().find(
    Task,
    { assignedContributors: { id: { $in: [1] } } },
    {
      limit: 1,
      orderBy: { contributingEntityId: 'DESC' },
      populate: ['questionnaire'],
    },
  );
  expect(tasks.map(t => t.id)).toEqual([2]);
  expect(mock.mock.calls[0][0]).toMatch('order by min(`contributing_entity_id`) desc limit 1');
});
