import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/sqlite';
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

  constructor(title: string) {
    this.title = title;
  }

}

async function createEntities(orm: MikroORM) {
  const author = new Author();
  author.name = 'John';

  const book = new Book('b1');
  author.books.set([book]);

  await orm.em.persistAndFlush(author);
  orm.em.clear();
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Book],
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test(`GH 3360`, async () => {
  await createEntities(orm);

  // Removing all children from the created entity
  const author = await orm.em.findOneOrFail(Author, 1);
  author.books.removeAll();

  const mock = mockLogger(orm, ['query']);
  await orm.em.transactional(async () => {
    // will create a fork with the same context and flush it
  });

  expect(mock.mock.calls[0][0]).toMatch('begin');
  expect(mock.mock.calls[1][0]).toMatch('delete from `book` where `id` in (?)');
  expect(mock.mock.calls[2][0]).toMatch('commit');

  const author2 = await orm.em.fork().findOneOrFail(Author, 1);
  expect(author2.books.getItems()).toHaveLength(0);
});
