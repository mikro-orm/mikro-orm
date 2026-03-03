import { Collection, MikroORM } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => Book, b => b.author)
  books = new Collection<Book>(this);

  @OneToMany(() => Book, b => b.author, { where: { isFavorite: true } })
  favoriteBooks = new Collection<Book>(this);
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @Property()
  isFavorite!: boolean;

  @ManyToOne()
  author!: Author;
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

test('declarative partial loading disables propagation (GH #6734)', async () => {
  const authorId = await orm.em.insert(Author, { name: 'Foo' });
  await orm.em.insertMany(
    Book,
    Array.from(Array(1)).map(_ => ({ title: 'Foo', author: authorId, isFavorite: false })),
  );
  await orm.em.insertMany(
    Book,
    Array.from(Array(1)).map(_ => ({ title: 'Foo', author: authorId, isFavorite: true })),
  );
  orm.em.clear();

  const author = (await orm.em.findOne(Author, { id: authorId }))!;
  await orm.em.populate(author, ['favoriteBooks']);
  await orm.em.populate(author, ['books']);
  author.favoriteBooks.getItems().forEach(b => expect(b.isFavorite).toBeTruthy());
});
