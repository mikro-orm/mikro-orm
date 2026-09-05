import { MikroORM, QueryOrder, QueryOrderMap, ref, Ref } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ nullable: true, type: 'integer' })
  age?: number | null;
}

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ nullable: true, type: 'integer' })
  rating?: number | null;
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author, { ref: true, nullable: true })
  author?: Ref<Author> | null;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [User, Author, Book],
    dbName: ':memory:',
  });
  await orm.schema.refresh();

  orm.em.create(User, { id: 1, name: 'User 1', age: 10 });
  orm.em.create(User, { id: 2, name: 'User 2', age: 20 });
  orm.em.create(User, { id: 3, name: 'User 3', age: null });
  orm.em.create(User, { id: 4, name: 'User 4', age: null });

  const author1 = orm.em.create(Author, { id: 1, name: 'Author A', rating: 5 });
  const author2 = orm.em.create(Author, { id: 2, name: 'Author B', rating: null });

  orm.em.create(Book, { id: 1, author: ref(author1) });
  orm.em.create(Book, { id: 2, author: ref(author2) });
  // an unset relation makes every joined column null, even the non-nullable ones
  orm.em.create(Book, { id: 3, author: null });

  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

afterEach(() => orm.em.clear());

/** Walks the whole result set one row per page, so every page boundary is a cursor round trip. */
const walk = async <T extends User | Book>(
  entity: { new (): T },
  orderBy: QueryOrderMap<T>,
  backwards = false,
): Promise<number[]> => {
  const ids: number[] = [];
  let cursor: string | undefined;

  // the data sets have at most 4 rows, a higher bound only guards against a broken cursor looping
  for (let i = 0; i < 8; i++) {
    const page = await orm.em.findByCursor(entity, {
      ...(backwards ? { last: 1, before: cursor } : { first: 1, after: cursor }),
      orderBy: orderBy as QueryOrderMap<T>,
      populate: ['*'],
    });

    if (page.items.length === 0) {
      break;
    }

    ids.push(...page.items.map(item => item.id));
    cursor = backwards ? page.startCursor! : page.endCursor!;
    orm.em.clear();

    if (backwards ? !page.hasPrevPage : !page.hasNextPage) {
      break;
    }
  }

  return ids;
};

describe.each([
  [QueryOrder.ASC_NULLS_LAST, [1, 2, 3, 4]],
  [QueryOrder.ASC_NULLS_FIRST, [3, 4, 1, 2]],
  [QueryOrder.DESC_NULLS_LAST, [2, 1, 3, 4]],
  [QueryOrder.DESC_NULLS_FIRST, [3, 4, 2, 1]],
] as const)('cursor pagination over a nullable column ordered by %s', (direction, expected) => {
  const orderBy = { age: direction, id: QueryOrder.ASC } as QueryOrderMap<User>;

  test('the requested nulls placement is honored', async () => {
    const { items } = await orm.em.findByCursor(User, { first: 10, orderBy });
    expect(items.map(u => u.id)).toEqual(expected);
  });

  test('paginating forward crosses the null boundary', async () => {
    expect(await walk(User, orderBy)).toEqual(expected);
  });

  test('paginating backward crosses the null boundary', async () => {
    expect(await walk(User, orderBy, true)).toEqual([...expected].reverse());
  });
});

describe('cursor pagination ordered by a nullable relation', () => {
  test('a missing relation sorts as null even for a non-nullable column', async () => {
    const orderBy = { author: { name: QueryOrder.ASC }, id: QueryOrder.ASC } as QueryOrderMap<Book>;

    expect(await walk(Book, orderBy)).toEqual([1, 2, 3]);
    expect(await walk(Book, orderBy, true)).toEqual([3, 2, 1]);
  });

  test('several nullable columns of the same relation', async () => {
    const orderBy = {
      author: { rating: QueryOrder.ASC, name: QueryOrder.ASC },
      id: QueryOrder.ASC,
    } as QueryOrderMap<Book>;

    expect(await walk(Book, orderBy)).toEqual([1, 2, 3]);
    expect(await walk(Book, orderBy, true)).toEqual([3, 2, 1]);
  });
});
