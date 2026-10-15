import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Recipe {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'string[]' })
  tags!: string[];
}

describe('$in/$nin on ArrayType columns', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Recipe],
      dbName: 'mikro_orm_test_array_in',
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  test('em.find matches whole arrays with $in/$nin', async () => {
    const em = orm.em.fork();
    em.create(Recipe, { tags: ['a', 'b'] });
    em.create(Recipe, { tags: ['c', 'd'] });
    em.create(Recipe, { tags: ['e'] });
    await em.flush();
    em.clear();

    const found = await em.find(Recipe, { tags: { $in: [['a', 'b'], ['e']] } }, { orderBy: { id: 1 } });
    expect(found.map(r => r.tags)).toEqual([['a', 'b'], ['e']]);

    const excluded = await em.find(Recipe, { tags: { $nin: [['a', 'b'], ['e']] } });
    expect(excluded.map(r => r.tags)).toEqual([['c', 'd']]);
  });

  test('$in expands each candidate array into its own array literal', async () => {
    const qb = orm.em
      .createQueryBuilder(Recipe)
      .select('*')
      .where({
        tags: {
          $in: [
            ['a', 'b'],
            ['c', 'd'],
          ],
        },
      });

    expect(qb.getQuery()).toEqual('select "r0".* from "recipe" as "r0" where "r0"."tags" in (?, ?)');
    expect(qb.getFormattedQuery()).toEqual(
      `select "r0".* from "recipe" as "r0" where "r0"."tags" in ('{a,b}', '{c,d}')`,
    );
  });

  test('$nin expands each candidate array into its own array literal', async () => {
    const qb = orm.em
      .createQueryBuilder(Recipe)
      .select('*')
      .where({
        tags: {
          $nin: [
            ['a', 'b'],
            ['c', 'd'],
          ],
        },
      });

    expect(qb.getQuery()).toEqual('select "r0".* from "recipe" as "r0" where "r0"."tags" not in (?, ?)');
    expect(qb.getFormattedQuery()).toEqual(
      `select "r0".* from "recipe" as "r0" where "r0"."tags" not in ('{a,b}', '{c,d}')`,
    );
  });

  test('$in with a single candidate array is still parenthesised', async () => {
    const qb = orm.em
      .createQueryBuilder(Recipe)
      .select('*')
      .where({ tags: { $in: [['a', 'b']] } });

    expect(qb.getFormattedQuery()).toEqual(`select "r0".* from "recipe" as "r0" where "r0"."tags" in ('{a,b}')`);
  });

  test('$contains still emits a single array literal', async () => {
    const qb = orm.em
      .createQueryBuilder(Recipe)
      .select('*')
      .where({ tags: { $contains: ['a', 'b'] } });

    expect(qb.getFormattedQuery()).toEqual(`select "r0".* from "recipe" as "r0" where "r0"."tags" @> '{a,b}'`);
  });
});
