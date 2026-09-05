import { MikroORM, Options, QueryOrderMap } from '@mikro-orm/core';
import { Entity, Formula, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { PLATFORMS } from '../../bootstrap.js';

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ nullable: true, type: 'integer' })
  age?: number | null;

  // the expression yields null for small and missing ages, yet the metadata does not declare it nullable
  @Formula(alias => `(case when ${alias}.age > 15 then ${alias}.age else null end)`, { type: 'integer' })
  bigAge?: number | null;

  @Formula(alias => `(case when ${alias}.age > 15 then ${alias}.age else null end)`, {
    type: 'integer',
    nullable: true,
  })
  bigAgeNullable?: number | null;
}

describe.each(['sqlite', 'mysql', 'postgresql', 'mssql'] as const)(
  'cursor pagination over a formula column (%s)',
  type => {
    let orm: MikroORM;

    beforeAll(async () => {
      const options: Partial<Options> = {};

      if (type === 'mysql') {
        options.port = 3308;
      }

      if (type === 'mssql') {
        options.password = 'Root.Root';
      }

      orm = await MikroORM.init({
        metadataProvider: ReflectMetadataProvider,
        entities: [User],
        dbName: type === 'sqlite' ? ':memory:' : 'mikro_orm_test_cursor_formula_nulls',
        driver: PLATFORMS[type],
        ...options,
      });
      await orm.schema.refresh();

      orm.em.create(User, { id: 1, name: 'User 1', age: 10 });
      orm.em.create(User, { id: 2, name: 'User 2', age: 20 });
      orm.em.create(User, { id: 3, name: 'User 3', age: null });
      orm.em.create(User, { id: 4, name: 'User 4', age: 12 });
      orm.em.create(User, { id: 5, name: 'User 5', age: 30 });

      await orm.em.flush();
      orm.em.clear();
    });

    afterAll(() => orm.close(true));

    afterEach(() => orm.em.clear());

    /** Walks the whole result set one row per page, so every page boundary is a cursor round trip. */
    const walk = async (orderBy: QueryOrderMap<User>, backwards = false): Promise<number[]> => {
      const ids: number[] = [];
      let cursor: string | undefined;

      // the data set has 5 rows, a higher bound only guards against a broken cursor looping
      for (let i = 0; i < 10; i++) {
        const page = await orm.em.findByCursor(User, {
          ...(backwards ? { last: 1, before: cursor } : { first: 1, after: cursor }),
          orderBy,
        });

        if (page.items.length === 0) {
          break;
        }

        ids.push(...page.items.map(user => user.id));
        cursor = backwards ? page.startCursor! : page.endCursor!;
        orm.em.clear();

        if (backwards ? !page.hasPrevPage : !page.hasNextPage) {
          break;
        }
      }

      return ids;
    };

    test('the formula property is not declared nullable', async () => {
      expect(orm.getMetadata().get(User).properties.bigAge.nullable).toBeFalsy();
      expect(orm.getMetadata().get(User).properties.bigAgeNullable.nullable).toBe(true);
    });

    // an unqualified direction follows the platform's own placement, the same one a plain `em.find` gets
    const nullsLowest = type !== 'postgresql';
    const nonNull = { asc: [2, 5], desc: [5, 2] };
    const nulls = [1, 3, 4];
    const order = (dir: 'asc' | 'desc') =>
      nullsLowest === (dir === 'asc') ? [...nulls, ...nonNull[dir]] : [...nonNull[dir], ...nulls];

    describe.each([
      ['bigAge', 'asc'],
      ['bigAge', 'desc'],
      ['bigAgeNullable', 'asc'],
      ['bigAgeNullable', 'desc'],
    ] as const)('ordered by %s %s', (prop, dir) => {
      const expected = order(dir);
      const orderBy = { [prop]: dir, id: 'asc' } as QueryOrderMap<User>;

      test('a single page returns every row', async () => {
        const { items } = await orm.em.findByCursor(User, { first: 100, orderBy });
        expect(items.map(user => user.id)).toEqual(expected);
      });

      test('paginating forward crosses the null boundary', async () => {
        expect(await walk(orderBy)).toEqual(expected);
      });

      test('paginating backward crosses the null boundary', async () => {
        expect(await walk(orderBy, true)).toEqual([...expected].reverse());
      });
    });
  },
);
