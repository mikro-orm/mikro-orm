import { MikroORM, QueryOrder, QueryOrderMap } from '@mikro-orm/mongodb';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class User {
  @PrimaryKey({ name: '_id' })
  id!: number;

  @Property({ nullable: true, type: 'integer' })
  age?: number | null;
}

// Mongo sorts null and missing values lowest and cannot be asked for anything else, so a `nulls
// first`/`nulls last` qualifier is accepted and ignored. The cursor condition has to assume the same
// placement the query will actually use, or pagination skips rows at the null boundary.
describe('cursor pagination over a nullable column (mongo)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [User],
      clientUrl: 'mongodb://localhost:27017/mikro-orm-test-cursor-nulls',
    });
    await orm.schema.clear();

    orm.em.create(User, { id: 1, age: 10 });
    orm.em.create(User, { id: 2, age: 20 });
    orm.em.create(User, { id: 3, age: null });
    orm.em.create(User, { id: 4, age: 30 });
    await orm.em.flush();
    orm.em.clear();
  });

  afterAll(async () => {
    await orm.schema.drop();
    await orm.close(true);
  });

  afterEach(() => orm.em.clear());

  /** Walks the whole result set one row per page, so every page boundary is a cursor round trip. */
  const walk = async (orderBy: QueryOrderMap<User>, backwards = false): Promise<number[]> => {
    const ids: number[] = [];
    let cursor: string | undefined;

    // 4 rows, the higher bound only guards against a broken cursor looping
    for (let i = 0; i < 8; i++) {
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

  describe.each([
    [QueryOrder.ASC, [3, 1, 2, 4]],
    [QueryOrder.ASC_NULLS_FIRST, [3, 1, 2, 4]],
    [QueryOrder.ASC_NULLS_LAST, [3, 1, 2, 4]],
    [QueryOrder.DESC, [4, 2, 1, 3]],
    [QueryOrder.DESC_NULLS_FIRST, [4, 2, 1, 3]],
    [QueryOrder.DESC_NULLS_LAST, [4, 2, 1, 3]],
  ] as const)('ordered by %s', (direction, expected) => {
    const orderBy = { age: direction, id: QueryOrder.ASC } as QueryOrderMap<User>;

    test('the nulls qualifier is ignored, nulls sort lowest', async () => {
      const { items } = await orm.em.findByCursor(User, { first: 10, orderBy });
      expect(items.map(user => user.id)).toEqual(expected);
    });

    test('walking one row per page matches the single page', async () => {
      expect(await walk(orderBy)).toEqual(expected);
      expect(await walk(orderBy, true)).toEqual([...expected].reverse());
    });
  });
});
