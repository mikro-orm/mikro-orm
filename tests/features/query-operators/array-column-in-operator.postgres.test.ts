import { MikroORM, type Options } from '@mikro-orm/postgresql';
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
      connect: false,
    } as Options);
  });

  afterAll(() => orm.close(true));

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
