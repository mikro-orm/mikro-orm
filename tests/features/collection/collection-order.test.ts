import { Collection, MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @OneToMany(() => Book, b => b.author, { orderBy: { title: 'asc' } })
  books = new Collection<Book>(this);

  constructor(name: string) {
    this.name = name;
  }

}

@Entity()
class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Author)
  author!: Author;


  constructor(author: Author, title: string) {
    this.author = author;
    this.title = title;
  }

}


let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Author],
    dbName: ':memory:',
  });

  await orm.schema.createSchema();
  await createEntities();
});

beforeEach(() => orm.em.clear());
afterAll(() => orm.close(true));

async function createEntities() {
  const author = new Author('john');
  author.books.add(
    new Book(author, 'a'),
    new Book(author, 'c'),
    new Book(author, 'b'),
  );
  await orm.em.fork().persistAndFlush(author);
}

describe.each([true, false])('dataloader=%s', dataloader => {
  beforeEach(() => orm.config.set('dataloader', dataloader));

  test('collection is loaded using the default order if orderBy option is not passed', async () => {
    const author = await orm.em.findOneOrFail(Author, { name: 'john' });
    expect((await author.books.loadItems()).map(b => b.title)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });
});
