import { Collection, MikroORM } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../helpers.js';

@Entity()
class Tag {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @Property()
  keywords!: string[];

  @ManyToMany(() => Tag)
  tags = new Collection<Tag>(this);

  @OneToMany(() => Chapter, c => c.book)
  chapters = new Collection<Chapter>(this);
}

@Entity()
class Chapter {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Book)
  book!: Book;
}

describe('$all operator [sqlite]', () => {
  let orm: MikroORM;
  let tagA: Tag;
  let tagB: Tag;
  let tagC: Tag;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Tag, Book, Chapter],
      dbName: ':memory:',
    });
    await orm.schema.refresh();

    tagA = orm.em.create(Tag, { name: 'a' });
    tagB = orm.em.create(Tag, { name: 'b' });
    tagC = orm.em.create(Tag, { name: 'c' });

    const book1 = orm.em.create(Book, { title: 'book1', keywords: ['foo'], tags: [tagA, tagB, tagC] });
    const book2 = orm.em.create(Book, { title: 'book2', keywords: ['foo'], tags: [tagA, tagB] });
    orm.em.create(Book, { title: 'book3', keywords: ['foo'], tags: [tagA] });

    orm.em.create(Chapter, { title: 'intro', book: book1 });
    orm.em.create(Chapter, { title: 'outro', book: book1 });
    orm.em.create(Chapter, { title: 'intro', book: book2 });

    await orm.em.flush();
  });

  beforeEach(() => orm.em.clear());
  afterAll(() => orm.close(true));

  test('$all on m:n collection expands to intersecting sub-queries', async () => {
    const mock = mockLogger(orm, ['query']);

    const both = await orm.em.find(Book, { tags: { $all: [tagA.id, tagB.id] } }, { orderBy: { id: 1 } });
    expect(both.map(b => b.title)).toEqual(['book1', 'book2']);

    expect(mock.mock.calls[0][0]).toMatch(
      /where `b0`\.`id` in \(select .* where `b2`\.`tag_id` = \?\) and `b0`\.`id` in \(select .* where `b2`\.`tag_id` = \?\)/,
    );

    const allThree = await orm.em.find(Book, { tags: { $all: [tagA.id, tagB.id, tagC.id] } });
    expect(allThree.map(b => b.title)).toEqual(['book1']);

    const none = await orm.em.find(Book, { tags: { $all: [tagB.id, 123] } });
    expect(none).toHaveLength(0);
  });

  test('$all accepts conditions, not just primary keys', async () => {
    const books = await orm.em.find(Book, { tags: { $all: [{ name: 'a' }, { name: 'c' }] } });
    expect(books.map(b => b.title)).toEqual(['book1']);
  });

  test('$all on 1:m collection', async () => {
    const books = await orm.em.find(
      Book,
      { chapters: { $all: [{ title: 'intro' }, { title: 'outro' }] } },
      { orderBy: { id: 1 } },
    );
    expect(books.map(b => b.title)).toEqual(['book1']);
  });

  test('an empty $all matches nothing, same as in mongo', async () => {
    const mock = mockLogger(orm, ['query']);

    const books = await orm.em.find(Book, { tags: { $all: [] } });
    expect(books).toHaveLength(0);
    expect(mock.mock.calls[0][0]).toMatch(/where 1 = 0/);
  });

  test('$all on a non-collection property throws a descriptive error', async () => {
    await expect(orm.em.find(Book, { keywords: { $all: ['foo'] } })).rejects.toThrow(
      'The `$all` operator is supported only on collection properties in SQL drivers, use `$contains` for array columns instead.',
    );
  });
});
