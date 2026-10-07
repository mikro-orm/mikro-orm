import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

const Child = defineEntity({
  name: 'Child',
  properties: {
    id: p.integer().primary(),
    parent: () => p.manyToOne(Parent),
    title: p.string(),
    // Property with JsonType (which defines convertToJSValueSQL) AND formula
    jsonFormula: p.json<{ titleUpper: string }>().formula(cols => `json_object('titleUpper', upper(${cols.title}))`),
  },
});

const Parent = defineEntity({
  name: 'Parent',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    children: () => p.oneToMany(Child).mappedBy('parent'),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Parent, Child],
    dbName: ':memory:',
  });
  await orm.schema.refresh();

  const parent = orm.em.create(Parent, {
    id: 1,
    name: 'Parent 1',
    children: [
      { id: 1, title: 'child item 1' },
      { id: 2, title: 'child item 2' },
    ],
  });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('formula property with customType (JsonType) works in joined populate and query builder', async () => {
  const mock = mockLogger(orm);

  // 1. Test joined populate strategy (invokes mapPropToFieldNames)
  const parents = await orm.em.find(
    Parent,
    { id: 1 },
    {
      populate: ['children'],
      strategy: 'joined',
    },
  );

  expect(parents).toHaveLength(1);
  expect(parents[0].children).toHaveLength(2);
  expect(parents[0].children[0].jsonFormula).toEqual({ titleUpper: 'CHILD ITEM 1' });
  expect(parents[0].children[1].jsonFormula).toEqual({ titleUpper: 'CHILD ITEM 2' });

  // 2. Test QueryBuilder joined select directly
  const qb = orm.em.createQueryBuilder(Parent, 'p').select('*').leftJoinAndSelect('p.children', 'c');
  const sql = qb.getFormattedQuery();

  // Formula should be evaluated as SQL expression rather than selecting non-existent column "c"."json_formula"
  expect(sql).toContain(`json_object('titleUpper', upper(c.title)) as \`c__json_formula\``);
  expect(sql).not.toContain('`c`.`json_formula`');
});
