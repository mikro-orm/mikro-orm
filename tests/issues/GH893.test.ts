import {
  Entity,
  MikroORM,
  PrimaryKey,
  OneToMany,
  ManyToOne,
  Collection,
  BeforeCreate,
} from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { v4 } from 'uuid';

abstract class Base {

  @PrimaryKey()
  id!: string;

  @BeforeCreate()
  definePrimaryKey() {
    this.id = v4();
  }

}

@Entity()
class Publisher extends Base {

  @OneToMany('Book', (b: Book) => b.publisher)
  books = new Collection<Book>(this);

}

@Entity()
class Book extends Base {

  @ManyToOne(() => Publisher, { nullable: true })
  publisher?: Publisher;

}

describe('GH issue 893', () => {
  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Base, Book, Publisher],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`GH issue 893`, async () => {
    const publisher = new Publisher();
    const book = new Book();
    publisher.books.add(book);
    await orm.em.persistAndFlush(publisher);
    orm.em.clear();
    const reloadedBook = await orm.em.findOne(Book, { id: book.id });
    expect(reloadedBook?.publisher).not.toBeNull();
  });
});
