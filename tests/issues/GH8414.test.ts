import { defineEntity, MikroORM, p, Type } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

class UpperType extends Type<string, string> {
  getColumnType() {
    return 'text';
  }

  convertToJSValueSQL(key: string) {
    return `upper(${key})`;
  }
}

const Child = defineEntity({
  name: 'Child',
  properties: {
    id: p.integer().primary(),
    parent: () => p.manyToOne(Parent),
    title: p.string(),
    jsonFormula: p.json<{ titleUpper: string }>().formula(cols => `json_object('titleUpper', upper(${cols.title}))`),
  },
});

const Parent = defineEntity({
  name: 'Parent',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    bio: p.text().lazy().nullable(),
    upperFormula: p
      .type(UpperType)
      .formula(cols => `${cols.name} || '-x'`)
      .$type<string>(),
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

  orm.em.create(Parent, {
    id: 1,
    name: 'Parent 1',
    children: [
      { id: 1, title: 'child item 1' },
      { id: 2, title: 'child item 2' },
    ],
  });
  await orm.em.flush();
});

afterAll(async () => {
  await orm.close(true);
});

test('formula with a custom type is selected as the formula expression in joined queries', async () => {
  const em = orm.em.fork();
  const parents = await em.find(Parent, { id: 1 }, { populate: ['children'], strategy: 'joined' });

  expect(parents).toHaveLength(1);
  expect(parents[0].children).toHaveLength(2);
  expect(parents[0].children[0].jsonFormula).toEqual({ titleUpper: 'CHILD ITEM 1' });
  expect(parents[0].children[1].jsonFormula).toEqual({ titleUpper: 'CHILD ITEM 2' });

  const sql = em.createQueryBuilder(Parent, 'p').select('*').leftJoinAndSelect('p.children', 'c').getFormattedQuery();
  expect(sql).toContain(`json_object('titleUpper', upper(c.title)) as \`c__json_formula\``);
  expect(sql).not.toContain('`c`.`json_formula`');
});

test('formula with a custom type is selected only once next to lazy properties', async () => {
  const em = orm.em.fork();
  const mock = mockLogger(orm);
  const parent = await em.findOneOrFail(Parent, 1);

  expect(parent.upperFormula).toBe('Parent 1-x');
  expect(mock.mock.calls[0][0].match(/as `upper_formula`/g)).toHaveLength(1);
});
