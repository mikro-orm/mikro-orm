import {
  Collection,
  Entity,
  Formula,
  ManyToOne,
  MikroORM,
  OneToMany,
  OptionalProps,
  PrimaryKey,
  Property,
  Ref,
  wrap,
} from '@mikro-orm/sqlite';

@Entity()
class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => Book, book => book.author)
  books = new Collection<Book>(this);

}

@Entity()
class Book {

  [OptionalProps]?: 'upperTitle';

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @Formula(alias => `UPPER(${alias}.title)`, { lazy: true })
  upperTitle?: string;

  @ManyToOne(() => Author, { ref: true })
  author!: Ref<Author>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Author, Book],
  });

  await orm.schema.createSchema();

  const em = orm.em.fork();
  const author = em.create(Author, { name: 'Author 1' });
  em.create(Book, {
    title: 'Book 1',
    author,
  });

  await em.flush();
  em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('lazy formula an qb.joinAndSelect()', async () => {
    const qb = orm.em
      .createQueryBuilder(Author, 'a')
      .select(['a.id'])
      .leftJoinAndSelect('a.books', 'b', undefined, [
        'b.id',
        'b.title',
        'b.upperTitle',
      ]);

    const result = await qb.getResultList();
    expect(result[0].books.$.getItems()[0].upperTitle).toBe('BOOK 1');
});
