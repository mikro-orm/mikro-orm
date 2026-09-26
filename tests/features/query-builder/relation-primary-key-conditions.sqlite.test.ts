import { type Dictionary, type FilterQuery, MikroORM } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity()
class AuthorProfile {
  @OneToOne({ entity: () => Author, primary: true })
  author!: Author;
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Author)
  author!: Author;

  @ManyToOne(() => AuthorProfile)
  profile!: AuthorProfile;
}

describe('primary key object conditions on relations', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Author, AuthorProfile, Book],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    });
    await orm.schema.create();

    const em = orm.em.fork();
    const a1 = em.create(Author, { id: 1, name: 'a1' });
    const a2 = em.create(Author, { id: 2, name: 'a2' });
    const a3 = em.create(Author, { id: 3, name: 'a3' });
    em.create(Book, { id: 1, title: 'b1', author: a1, profile: em.create(AuthorProfile, { author: a3 }) });
    em.create(Book, { id: 2, title: 'b2', author: a2, profile: em.create(AuthorProfile, { author: a2 }) });
    em.create(Book, { id: 3, title: 'b3', author: a3, profile: em.create(AuthorProfile, { author: a1 }) });
    await em.flush();
  });

  afterAll(() => orm.close(true));

  function sql(where: FilterQuery<Book>) {
    return orm.em
      .createQueryBuilder(Book, 'b')
      .where(where as Dictionary)
      .getFormattedQuery();
  }

  async function titles(where: FilterQuery<Book>) {
    const books = await orm.em.fork().find(Book, where, { orderBy: { title: 'asc' } });
    return books.map(b => b.title);
  }

  test('lists of primary key objects', async () => {
    expect(sql({ author: [{ id: 1 }, { id: 2 }] })).toBe(
      'select `b`.* from `book` as `b` where `b`.`author_id` in (1, 2)',
    );
    await expect(titles({ author: [{ id: 1 }, { id: 2 }] })).resolves.toEqual(['b1', 'b2']);
    // PK objects are not allowed by the `$in` type, but they work at runtime
    await expect(titles({ author: { $in: [{ id: 2 }] } } as Dictionary)).resolves.toEqual(['b2']);
    await expect(titles({ author: { $nin: [{ id: 2 }] } } as Dictionary)).resolves.toEqual(['b1', 'b3']);
  });

  test('negated primary key object', async () => {
    expect(sql({ author: { $not: { id: 1 } } })).toBe(
      'select `b`.* from `book` as `b` where not (`b`.`author_id` = 1)',
    );
    await expect(titles({ author: { $not: { id: 1 } } })).resolves.toEqual(['b2', 'b3']);
    await expect(titles({ author: { $not: { id: { $in: [1, 2] } } } })).resolves.toEqual(['b3']);
  });

  test('negated condition on a relation primary key', async () => {
    await expect(titles({ profile: { $not: { author: 1 } } })).resolves.toEqual(['b1', 'b2']);
    await expect(titles({ profile: { $not: { author: { id: 1 } } } })).resolves.toEqual(['b1', 'b2']);
    await expect(titles({ profile: { $not: { author: { name: 'a3' } } } })).resolves.toEqual(['b2', 'b3']);
  });

  test('negating an empty condition on a relation matches nothing', async () => {
    expect(sql({ author: { $not: {} } })).toBe('select `b`.* from `book` as `b` where 1 = 0');
    await expect(titles({ author: { $not: {} } })).resolves.toEqual([]);
    await expect(titles({ $or: [{ title: 'b1' }, { author: { $not: {} } }] })).resolves.toEqual(['b1']);
  });
});
