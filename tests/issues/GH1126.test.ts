import { Collection, Entity, LoadStrategy, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

@Entity()
export class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany({
    entity: 'Book',
    mappedBy: 'author',
    eager: true,
    orphanRemoval: true,
  })
  books = new Collection<Book>(this);

}

@Entity()
export class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  title: string;

  @ManyToOne(() => Author)
  author!: Author;

  @OneToMany({
    entity: 'Page',
    mappedBy: 'book',
    eager: true,
    orphanRemoval: true,
  })
  pages = new Collection<Page>(this);

  constructor(title: string) {
    this.title = title;
  }

}

@Entity()
export class Page {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Book)
  book!: Book;

  @Property()
  text: string;

  constructor(text: string) {
    this.text = text;
  }

}

async function createEntities(orm: MikroORM) {
  const author = new Author();
  author.name = 'John';

  const page = new Page('p1');
  const book = new Book('b1');
  book.pages.set([page]);
  author.books.set([book]);

  await orm.em.persistAndFlush(author);
  orm.em.clear();
}

describe('GH issue 1126', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: ':memory:',
      entities: [Author, Book, Page],
      loadStrategy: LoadStrategy.JOINED,
    });
  });

  afterAll(async () => {
    await orm.close(true);
  });

  beforeEach(async () => {
    await orm.schema.dropSchema();
    await orm.schema.createSchema();
  });

  test(`1/3`, async () => {
    await createEntities(orm);
    const mock = mockLogger(orm, ['query']);

    {
      const author = await orm.em.findOneOrFail(Author, 1);
      const book = new Book('b2');
      const oldPages = author.books[0].pages.getItems();
      book.pages.set(oldPages);
      author.books.set([book]);
      await orm.em.flush();
      orm.em.clear();
    }

    expect(mock.mock.calls[0][0]).toMatch('select `a0`.*, `b1`.`id` as `b1__id`, `b1`.`title` as `b1__title`, `b1`.`author_id` as `b1__author_id`, `p2`.`id` as `p2__id`, `p2`.`book_id` as `p2__book_id`, `p2`.`text` as `p2__text` from `author` as `a0` left join `book` as `b1` on `a0`.`id` = `b1`.`author_id` left join `page` as `p2` on `b1`.`id` = `p2`.`book_id` where `a0`.`id` = ?');
    expect(mock.mock.calls[1][0]).toMatch('begin');
    expect(mock.mock.calls[2][0]).toMatch('insert into `book` (`title`, `author_id`) values (?, ?)');
    expect(mock.mock.calls[3][0]).toMatch('update `page` set `book_id` = ? where `id` = ?');
    expect(mock.mock.calls[4][0]).toMatch('delete from `book` where `id` in (?)');
    expect(mock.mock.calls[5][0]).toMatch('commit');

    {
      const author = await orm.em.findOneOrFail(Author, 1);
      expect(author.books[0].pages).toHaveLength(1);
    }
  });

  test(`2/3`, async () => {
    await createEntities(orm);
    const mock = mockLogger(orm, ['query']);

    {
      const author = await orm.em.findOneOrFail(Author, 1);
      const book = new Book('b2');
      const page2 = new Page('p2');
      book.pages.set([page2]);
      author.books.removeAll();
      author.books.add(book);
      await orm.em.flush();
      orm.em.clear();
    }

    expect(mock.mock.calls[0][0]).toMatch('select `a0`.*, `b1`.`id` as `b1__id`, `b1`.`title` as `b1__title`, `b1`.`author_id` as `b1__author_id`, `p2`.`id` as `p2__id`, `p2`.`book_id` as `p2__book_id`, `p2`.`text` as `p2__text` from `author` as `a0` left join `book` as `b1` on `a0`.`id` = `b1`.`author_id` left join `page` as `p2` on `b1`.`id` = `p2`.`book_id` where `a0`.`id` = ?');
    expect(mock.mock.calls[1][0]).toMatch('begin');
    expect(mock.mock.calls[2][0]).toMatch('insert into `book` (`title`, `author_id`) values (?, ?) returning `id`');
    expect(mock.mock.calls[3][0]).toMatch('insert into `page` (`book_id`, `text`) values (?, ?) returning `id`');
    expect(mock.mock.calls[4][0]).toMatch('delete from `page` where `id` in (?)');
    expect(mock.mock.calls[5][0]).toMatch('delete from `book` where `id` in (?)');
    expect(mock.mock.calls[6][0]).toMatch('commit');

    {
      const author = await orm.em.findOneOrFail(Author, 1);
      expect(author.books[0].pages).toHaveLength(1);
    }
  });

  test(`3/3`, async () => {
    await createEntities(orm);
    const mock = mockLogger(orm, ['query']);

    {
      const author = await orm.em.findOneOrFail(Author, 1);
      const book = new Book('b2');
      const page2 = new Page('p2');
      book.pages.set([page2]);
      author.books.set([book]);
      await orm.em.flush();
      orm.em.clear();
    }

    expect(mock.mock.calls[0][0]).toMatch('select `a0`.*, `b1`.`id` as `b1__id`, `b1`.`title` as `b1__title`, `b1`.`author_id` as `b1__author_id`, `p2`.`id` as `p2__id`, `p2`.`book_id` as `p2__book_id`, `p2`.`text` as `p2__text` from `author` as `a0` left join `book` as `b1` on `a0`.`id` = `b1`.`author_id` left join `page` as `p2` on `b1`.`id` = `p2`.`book_id` where `a0`.`id` = ?');
    expect(mock.mock.calls[1][0]).toMatch('begin');
    expect(mock.mock.calls[2][0]).toMatch('insert into `book` (`title`, `author_id`) values (?, ?)');
    expect(mock.mock.calls[3][0]).toMatch('insert into `page` (`book_id`, `text`) values (?, ?)');
    expect(mock.mock.calls[4][0]).toMatch('delete from `page` where `id` in (?)');
    expect(mock.mock.calls[5][0]).toMatch('delete from `book` where `id` in (?)');
    expect(mock.mock.calls[6][0]).toMatch('commit');

    {
      const author = await orm.em.findOneOrFail(Author, 1);
      expect(author.books[0].pages).toHaveLength(1);
    }
  });

});
