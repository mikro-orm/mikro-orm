import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';
import { mockLogger } from '../bootstrap';

@Entity()
export class Author {

  @PrimaryKey()
  id!: number;

  @Property({ length: 42 })
  name!: string;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @OneToMany(() => Book, book => book.author)
  books = new Collection<Book>(this);

  constructor(name: string) {
    this.name = name;
  }

}

@Entity()
export class Book {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author)
  author!: Author;

  @Property({ length: 42 })
  name!: string;

  constructor(name: string) {
    this.name = name;
  }

}

describe('GH issue 1927', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Author, Book],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`GH issue 1927`, async () => {
    await orm.em.nativeInsert(Author, { name: 'a1' });
    await orm.em.nativeInsert(Book, { name: 'b1', author: 1 });
    await orm.em.nativeInsert(Book, { name: 'b2', author: 1 });
    await orm.em.nativeInsert(Book, { name: 'b3', author: 1 });
    const result = await orm.em.execute('SELECT * FROM "book"');
    const books = result.map(data => orm.em.map(Book, data));
    await orm.em.populate(books, ['author']);

    const mock = mockLogger(orm);
    await orm.em.flush();
    expect(mock.mock.calls).toHaveLength(0);
  });

});
