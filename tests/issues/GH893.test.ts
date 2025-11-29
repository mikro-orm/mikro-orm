import { MikroORM, Collection } from '@mikro-orm/sqlite';
import { BeforeCreate, Entity, ManyToOne, OneToMany, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
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

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Base, Book, Publisher],
      dbName: ':memory:',
    });
    await orm.schema.createSchema();
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
