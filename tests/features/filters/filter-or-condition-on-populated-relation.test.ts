import { Collection, MikroORM, Ref } from '@mikro-orm/sqlite';
import {
  Entity,
  Filter,
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

  @OneToMany(() => Book, b => b.author)
  books = new Collection<Book>(this);
}

@Entity()
class Publisher {
  @PrimaryKey()
  id!: number;

  @Property()
  open!: boolean;
}

@Entity()
@Filter({ name: 'visible', cond: { $or: [{ title: 'keep' }, { publisher: { open: true } }] }, default: true })
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Author, { ref: true, nullable: true })
  author?: Ref<Author>;

  @ManyToOne(() => Publisher, { ref: true })
  publisher!: Ref<Publisher>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Author, Publisher, Book],
    dbName: ':memory:',
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.refresh();

  const em = orm.em.fork();
  await em.insertMany(Author, [{ id: 1 }]);
  await em.insertMany(Publisher, [
    { id: 10, open: true },
    { id: 11, open: false },
  ]);
  await em.insertMany(Book, [
    { id: 100, title: 'keep', author: 1, publisher: 11 }, // matches the `title` branch only
    { id: 101, title: 'drop', author: 1, publisher: 10 }, // matches the `publisher` branch only
    { id: 102, title: 'drop', author: 1, publisher: 11 }, // matches neither branch
  ]);
});

afterAll(async () => {
  await orm.close(true);
});

test('filter with `$or` spanning a to-one relation is not bypassed on joined populate', async () => {
  const em = orm.em.fork();
  const authors = await em.find(Author, {}, { populate: ['books'], strategy: 'joined' });
  expect(authors[0].books.getIdentifiers().sort()).toEqual([100, 101]);
});

test('filter with `$or` spanning a to-one relation applies on select-in populate', async () => {
  const em = orm.em.fork();
  const authors = await em.find(Author, {}, { populate: ['books'], strategy: 'select-in' });

  expect(authors[0].books.getIdentifiers().sort()).toEqual([100, 101]);
});
