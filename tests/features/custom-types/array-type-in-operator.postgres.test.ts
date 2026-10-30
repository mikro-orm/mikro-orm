import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Recipe {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'string[]' })
  tags!: string[];
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Recipe],
    dbName: 'mikro_orm_array_type_in_operator',
  });
  await orm.schema.refresh();
  await orm.em.insertMany(Recipe, [{ tags: ['a', 'b'] }, { tags: ['c', 'd'] }, { tags: ['e'] }, { tags: ['b', 'a'] }]);
});

afterAll(() => orm.close(true));

test('`$in`/`$nin` on an array column bind one array literal per candidate', async () => {
  const em = orm.em.fork();
  const sql = em
    .createQueryBuilder(Recipe)
    .where({
      tags: {
        $in: [
          ['a', 'b'],
          ['c', 'd'],
        ],
      },
    })
    .getFormattedQuery();
  expect(sql).toBe(`select "r0".* from "recipe" as "r0" where "r0"."tags" in ('{a,b}', '{c,d}')`);

  const found = await em.find(
    Recipe,
    {
      tags: {
        $in: [
          ['a', 'b'],
          ['c', 'd'],
        ],
      },
    },
    { orderBy: { id: 'asc' } },
  );
  expect(found.map(r => r.tags)).toEqual([
    ['a', 'b'],
    ['c', 'd'],
  ]);

  const notFound = await em.find(Recipe, { tags: { $nin: [['a', 'b'], ['e']] } }, { orderBy: { id: 'asc' } });
  expect(notFound.map(r => r.tags)).toEqual([
    ['c', 'd'],
    ['b', 'a'],
  ]);
});

test('a flat list on an array column matches any of its elements', async () => {
  const em = orm.em.fork();
  const sql = em
    .createQueryBuilder(Recipe)
    .where({ tags: ['a', 'b'] })
    .getFormattedQuery();
  expect(sql).toBe(`select "r0".* from "recipe" as "r0" where "r0"."tags" && '{a,b}'`);

  const shorthand = await em.find(Recipe, { tags: ['a', 'b'] }, { orderBy: { id: 'asc' } });
  expect(shorthand.map(r => r.tags)).toEqual([
    ['a', 'b'],
    ['b', 'a'],
  ]);

  const flatIn = await em.find(Recipe, { tags: { $in: ['c', 'e'] } }, { orderBy: { id: 'asc' } });
  expect(flatIn.map(r => r.tags)).toEqual([['c', 'd'], ['e']]);

  const flatNin = await em.find(Recipe, { tags: { $nin: ['a', 'b'] } }, { orderBy: { id: 'asc' } });
  expect(flatNin.map(r => r.tags)).toEqual([['c', 'd'], ['e']]);

  const exact = await em.find(Recipe, { tags: { $eq: ['a', 'b'] } });
  expect(exact.map(r => r.tags)).toEqual([['a', 'b']]);
});
