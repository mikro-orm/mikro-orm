import { MikroORM } from '@mikro-orm/sqlite';
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
    dbName: ':memory:',
  });
  await orm.schema.create();
  await orm.em.insertMany(Recipe, [{ tags: ['a', 'b'] }, { tags: ['c', 'd'] }, { tags: ['e'] }]);
});

afterAll(() => orm.close(true));

test('`$in`/`$nin` on an array column bind one marshalled value per candidate', async () => {
  const em = orm.em.fork();
  const sql = em
    .createQueryBuilder(Recipe)
    .where({ tags: { $nin: [['a', 'b'], ['e']] } })
    .getFormattedQuery();
  expect(sql).toBe("select `r0`.* from `recipe` as `r0` where `r0`.`tags` not in ('a,b', 'e')");

  const found = await em.find(Recipe, { tags: { $in: [['a', 'b'], ['e']] } }, { orderBy: { id: 'asc' } });
  expect(found.map(r => r.tags)).toEqual([['a', 'b'], ['e']]);

  const shorthand = await em.find(Recipe, { tags: ['c', 'd'] });
  expect(shorthand.map(r => r.tags)).toEqual([['c', 'd']]);
});
