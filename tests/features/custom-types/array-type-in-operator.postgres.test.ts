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
  await orm.em.insertMany(Recipe, [{ tags: ['a', 'b'] }, { tags: ['c', 'd'] }, { tags: ['e'] }]);
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

  const notFound = await em.find(Recipe, { tags: { $nin: [['a', 'b'], ['e']] } });
  expect(notFound.map(r => r.tags)).toEqual([['c', 'd']]);
});

test('a flat list on an array column is a single candidate', async () => {
  const em = orm.em.fork();
  const sql = em
    .createQueryBuilder(Recipe)
    .where({ tags: ['a', 'b'] })
    .getFormattedQuery();
  expect(sql).toBe(`select "r0".* from "recipe" as "r0" where "r0"."tags" in ('{a,b}')`);

  const shorthand = await em.find(Recipe, { tags: ['a', 'b'] });
  expect(shorthand.map(r => r.tags)).toEqual([['a', 'b']]);

  const flatIn = await em.find(Recipe, { tags: { $in: ['c', 'd'] } });
  expect(flatIn.map(r => r.tags)).toEqual([['c', 'd']]);
});
