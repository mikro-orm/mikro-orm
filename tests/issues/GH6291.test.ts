import { Collection, MikroORM, Ref } from '@mikro-orm/sqlite';
import { Entity, Filter, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @OneToMany(() => Book, book => book.author)
  books = new Collection<Book>(this);

  @OneToMany(() => Fan, fan => fan.favoriteAuthor)
  fans = new Collection<Fan>(this);

  constructor(name: string) {
    this.name = name;
  }

}

@Entity()
class Fan {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @ManyToOne(() => Author, { ref: true })
  favoriteAuthor!: Ref<Author>;

  constructor(name: string) {
    this.name = name;
  }

}

@Entity()
@Filter({
  name: 'soft-delete',
  cond: { deletedAt: null },
  default: true,
})
class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  title: string;

  @ManyToOne(() => Author, { ref: true })
  author!: Ref<Author>;

  @Property({ nullable: true })
  deletedAt: Date | null = null;

  constructor(title: string) {
    this.title = title;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Author, Book],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #6291', async () => {
  const author = orm.em.create(Author, { name: 'Stephen King' });
  orm.em.create(Fan, { favoriteAuthor: author, name: 'David' });
  orm.em.create(Fan, { favoriteAuthor: author, name: 'Jeremy' });
  orm.em.create(Book, { author, title: 'Book 1', deletedAt: null });
  orm.em.create(Book, { author, title: 'Book 2', deletedAt: null });
  await orm.em.flush();
  orm.em.clear();

  const [items, count] = await orm.em.findAndCount(Fan, {}, { populate: ['favoriteAuthor.books'] });
  expect(items).toHaveLength(2);
  expect(count).toBe(2);
});
