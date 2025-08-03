import {
  Collection,
  Entity,
  ManyToMany,
  ManyToOne,
  MikroORM,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Property,
  Rel,
  SimpleLogger,
} from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers';

@Entity()
class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => Book, item => item.author)
  books = new Collection<Book>(this);

  @OneToOne(() => Book, { nullable: true })
  favoriteBook?: Rel<Book>;

  @ManyToOne(() => Test, { nullable: true })
  test?: Rel<Test>;

  @ManyToMany(() => Test)
  tests = new Collection<Test>(this);

}

@Entity()
class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Author)
  author!: Author;

  @ManyToMany(() =>  BookTag)
  tags = new Collection<BookTag>(this);

}

@Entity()
class Test {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => Test, { nullable: true })
  parent?: Test;

}

@Entity()
class BookTag {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany(() =>  Book, b => b.tags)
  books = new Collection<Book>(this);

  @ManyToOne(() => Author, { nullable: true })
  favoriteAuthor?: Author;

}

describe('balanced strategy separates populate queries for to-many relations while joining to-one relations', () => {

  let orm: MikroORM;

  async function createEntities() {
    const a1 = orm.em.create(Author, { id: 1, name: 'a1' });
    const a2 = orm.em.create(Author, { id: 2, name: 'a2' });
    const a3 = orm.em.create(Author, { id: 3, name: 'a3' });
    const t1 = orm.em.create(BookTag, { id: 1, name: 'tag1', favoriteAuthor: 2 });
    const t2 = orm.em.create(BookTag, { id: 2, name: 'tag2', favoriteAuthor: 2 });
    const t3 = orm.em.create(BookTag, { id: 3, name: 'tag3' });
    const t4 = orm.em.create(BookTag, { id: 4, name: 'tag4', favoriteAuthor: 1 });
    const t5 = orm.em.create(BookTag, { id: 5, name: 'tag5', favoriteAuthor: 3 });
    const tt1 = orm.em.create(Test, { id: 1, name: 'test1' });
    const tt2 = orm.em.create(Test, { id: 2, name: 'test2', parent: 1 });
    const tt3 = orm.em.create(Test, { id: 3, name: 'test3', parent: 2 });
    const tt4 = orm.em.create(Test, { id: 4, name: 'test4', parent: 3 });
    const tt5 = orm.em.create(Test, { id: 5, name: 'test5', parent: 4 });
    const b1 = orm.em.create(Book, { id: 1, title: 'b1', author: 1, tags: [1, 4, 5] });
    const b2 = orm.em.create(Book, { id: 2, title: 'b2', author: 1, tags: [2, 3] });
    const b3 = orm.em.create(Book, { id: 3, title: 'b3', author: 1, tags: [1, 2, 3, 4] });
    orm.em.assign(a1, { favoriteBook: 3, test: 1, tests: [tt1, tt2, tt3] });
    orm.em.assign(a2, { favoriteBook: 2, test: 2, tests: [tt1, tt5] });
    orm.em.assign(a3, { favoriteBook: 1, test: 1, tests: [tt2, tt3, tt4] });
    await orm.em.flush();
    orm.em.clear();
  }

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Author, Book, BookTag],
      dbName: ':memory:',
      loadStrategy: 'balanced',
      ensureDatabase: { create: true },
      loggerFactory: SimpleLogger.create,
    });
  });

  beforeEach(async () => {
    await orm.schema.clearDatabase();
    await createEntities();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('loading multiple complex paths', async () => {
    const mock = mockLogger(orm);
    const books = await orm.em.findAll(Book, {
      populate: [
        'author.favoriteBook.tags.favoriteAuthor',
        'tags.favoriteAuthor.tests.parent',
      ],
    });
    expect(books).toHaveLength(3);
    expect(books[0].tags.getIdentifiers()).toEqual([1, 4, 5]);
    expect(books[1].tags.getIdentifiers()).toEqual([2, 3]);
    expect(books[2].tags.getIdentifiers()).toEqual([1, 2, 3, 4]);
    expect(mock.mock.calls).toEqual([
      // author.favoriteBook
      ['[query] select `b0`.*, `a1`.`id` as `a1__id`, `a1`.`name` as `a1__name`, `a1`.`favorite_book_id` as `a1__favorite_book_id`, `a1`.`test_id` as `a1__test_id`, `f2`.`id` as `f2__id`, `f2`.`title` as `f2__title`, `f2`.`author_id` as `f2__author_id` from `book` as `b0` left join `author` as `a1` on `b0`.`author_id` = `a1`.`id` left join `book` as `f2` on `a1`.`favorite_book_id` = `f2`.`id`'],
      // author.favoriteBook.tags.favoriteAuthor
      ['[query] select `b0`.`book_tag_id`, `b0`.`book_id`, `b1`.`id` as `b1__id`, `b1`.`name` as `b1__name`, `b1`.`favorite_author_id` as `b1__favorite_author_id`, `f2`.`id` as `f2__id`, `f2`.`name` as `f2__name`, `f2`.`favorite_book_id` as `f2__favorite_book_id`, `f2`.`test_id` as `f2__test_id` from `book_tags` as `b0` inner join `book_tag` as `b1` on `b0`.`book_tag_id` = `b1`.`id` left join `author` as `f2` on `b1`.`favorite_author_id` = `f2`.`id` where `b0`.`book_id` in (3)'],
      // tags.favoriteAuthor
      ['[query] select `b0`.`book_tag_id`, `b0`.`book_id`, `b1`.`id` as `b1__id`, `b1`.`name` as `b1__name`, `b1`.`favorite_author_id` as `b1__favorite_author_id`, `f2`.`id` as `f2__id`, `f2`.`name` as `f2__name`, `f2`.`favorite_book_id` as `f2__favorite_book_id`, `f2`.`test_id` as `f2__test_id` from `book_tags` as `b0` inner join `book_tag` as `b1` on `b0`.`book_tag_id` = `b1`.`id` left join `author` as `f2` on `b1`.`favorite_author_id` = `f2`.`id` where `b0`.`book_id` in (1, 2)'],
      // tags.favoriteAuthor.tests.parent
      ['[query] select `a0`.`test_id`, `a0`.`author_id`, `t1`.`id` as `t1__id`, `t1`.`name` as `t1__name`, `t1`.`parent_id` as `t1__parent_id`, `p2`.`id` as `p2__id`, `p2`.`name` as `p2__name`, `p2`.`parent_id` as `p2__parent_id` from `author_tests` as `a0` inner join `test` as `t1` on `a0`.`test_id` = `t1`.`id` left join `test` as `p2` on `t1`.`parent_id` = `p2`.`id` where `a0`.`author_id` in (2, 1, 3)'],
    ]);
  });

  test('loading m:1 -> 1:1 -> m:n -> m:1', async () => {
    const mock = mockLogger(orm);
    const books = await orm.em.findAll(Book, {
      populate: [
        'author.favoriteBook.tags.favoriteAuthor.test',
      ],
    });
    expect(books).toHaveLength(3);
    expect(books[0].author.favoriteBook!.tags.getIdentifiers()).toEqual([1, 2, 3, 4]);
    expect(books[0].author.favoriteBook!.tags[0].favoriteAuthor!.test!.name).toBe('test2');
    expect(mock.mock.calls).toEqual([
      // author.favoriteBook
      ['[query] select `b0`.*, `a1`.`id` as `a1__id`, `a1`.`name` as `a1__name`, `a1`.`favorite_book_id` as `a1__favorite_book_id`, `a1`.`test_id` as `a1__test_id`, `f2`.`id` as `f2__id`, `f2`.`title` as `f2__title`, `f2`.`author_id` as `f2__author_id` from `book` as `b0` left join `author` as `a1` on `b0`.`author_id` = `a1`.`id` left join `book` as `f2` on `a1`.`favorite_book_id` = `f2`.`id`'],
      // author.favoriteBook.tags.favoriteAuthor.test
      ['[query] select `b0`.`book_tag_id`, `b0`.`book_id`, `b1`.`id` as `b1__id`, `b1`.`name` as `b1__name`, `b1`.`favorite_author_id` as `b1__favorite_author_id`, `f2`.`id` as `f2__id`, `f2`.`name` as `f2__name`, `f2`.`favorite_book_id` as `f2__favorite_book_id`, `f2`.`test_id` as `f2__test_id`, `t3`.`id` as `t3__id`, `t3`.`name` as `t3__name`, `t3`.`parent_id` as `t3__parent_id` from `book_tags` as `b0` inner join `book_tag` as `b1` on `b0`.`book_tag_id` = `b1`.`id` left join `author` as `f2` on `b1`.`favorite_author_id` = `f2`.`id` left join `test` as `t3` on `f2`.`test_id` = `t3`.`id` where `b0`.`book_id` in (3)'],
    ]);
  });

});
