import { MikroORM, Options, QueryOrder, QueryOrderMap, ref, Ref } from '@mikro-orm/core';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { PLATFORMS } from '../../bootstrap.js';

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property({ nullable: true, type: 'integer' })
  rating?: number | null;

  @Property({ nullable: true, type: 'string' })
  name?: string | null;
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author, { ref: true, nullable: true })
  author?: Ref<Author> | null;
}

// A nested group is a keyset of its own, so both of its keys have to be decomposed lexicographically.
// Comparing them independently drops rows whose first key is strictly past the cursor while the second
// one is not, which only shows up once a page boundary lands inside the group.
describe.each(['sqlite', 'mysql', 'postgresql', 'mssql'] as const)(
  'cursor pagination over a nested multi-key group (%s)',
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
        entities: [Author, Book],
        dbName: type === 'sqlite' ? ':memory:' : 'mikro_orm_test_cursor_nested_keyset',
        driver: PLATFORMS[type],
        ...options,
      });
      await orm.schema.refresh();

      // covers both null positions of the group, a tie on the first key, and a missing relation
      const authors = [
        orm.em.create(Author, { id: 1, rating: 5, name: 'A' }),
        orm.em.create(Author, { id: 2, rating: 5, name: 'B' }),
        orm.em.create(Author, { id: 3, rating: 9, name: 'A' }),
        orm.em.create(Author, { id: 4, rating: null, name: 'C' }),
        orm.em.create(Author, { id: 5, rating: 7, name: null }),
      ];
      authors.forEach((author, i) => orm.em.create(Book, { id: i + 1, author: ref(author) }));
      orm.em.create(Book, { id: 6, author: null });

      await orm.em.flush();
      orm.em.clear();
    });

    afterAll(() => orm.close(true));

    afterEach(() => orm.em.clear());

    /** Walks the whole result set one row per page, so every page boundary is a cursor round trip. */
    const walk = async (orderBy: QueryOrderMap<Book>, backwards = false): Promise<number[]> => {
      const ids: number[] = [];
      let cursor: string | undefined;

      // 6 rows, the higher bound only guards against a broken cursor looping
      for (let i = 0; i < 12; i++) {
        const page = await orm.em.findByCursor(Book, {
          ...(backwards ? { last: 1, before: cursor } : { first: 1, after: cursor }),
          orderBy,
          populate: ['author'],
        });

        if (page.items.length === 0) {
          break;
        }

        ids.push(...page.items.map(book => book.id));
        cursor = backwards ? page.startCursor! : page.endCursor!;
        orm.em.clear();

        if (backwards ? !page.hasPrevPage : !page.hasNextPage) {
          break;
        }
      }

      return ids;
    };

    describe.each([
      [QueryOrder.ASC_NULLS_FIRST, QueryOrder.ASC_NULLS_FIRST],
      [QueryOrder.ASC_NULLS_LAST, QueryOrder.DESC_NULLS_FIRST],
      [QueryOrder.DESC_NULLS_LAST, QueryOrder.ASC_NULLS_FIRST],
      [QueryOrder.DESC_NULLS_FIRST, QueryOrder.DESC_NULLS_LAST],
      [QueryOrder.ASC, QueryOrder.DESC_NULLS_LAST],
    ] as const)('ordered by rating %s, name %s', (rating, name) => {
      const orderBy = { author: { rating, name }, id: QueryOrder.ASC } as QueryOrderMap<Book>;

      test('walking one row per page matches the single page', async () => {
        const { items } = await orm.em.findByCursor(Book, { first: 100, orderBy, populate: ['author'] });
        const expected = items.map(book => book.id);
        orm.em.clear();

        expect(expected).toHaveLength(6);
        expect(await walk(orderBy)).toEqual(expected);
        expect(await walk(orderBy, true)).toEqual([...expected].reverse());
      });
    });
  },
);
