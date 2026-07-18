import { Collection, LoadStrategy } from '@mikro-orm/core';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class Author {
  @PrimaryKey({ autoincrement: false })
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => Book, b => b.author)
  books = new Collection<Book>(this);

  @OneToMany(() => Review, r => r.author)
  reviews = new Collection<Review>(this);
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author, { mapToPk: true })
  author!: number;

  @Property()
  title!: string;
}

@Entity()
class Review {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author)
  author!: Author;

  @Property()
  body!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Author, Book, Review],
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.refresh();

  await orm.em.insert(Author, { id: 0, name: 'a0' });
  await orm.em.insert(Book, { id: 1, author: 0, title: 'b1' });
  await orm.em.insert(Review, { id: 1, author: 0, body: 'r1' });
  orm.em.clear();
});

afterAll(() => orm.close(true));

// GH #8000 - `initializeOneToMany` grouped children with `if (fk)`, so children whose
// FK is a falsy-but-valid PK (`0`) were skipped and the collection hydrated empty.
test('1:m collections of a parent with PK 0 are populated (select-in, mapToPk)', async () => {
  const author = await orm.em.findOneOrFail(
    Author,
    { id: 0 },
    {
      populate: ['books'],
      strategy: LoadStrategy.SELECT_IN,
    },
  );

  expect(author.books).toHaveLength(1);
  expect(author.books[0].title).toBe('b1');
});

test('1:m collections of a parent with PK 0 are populated (select-in, entity reference)', async () => {
  orm.em.clear();
  const author = await orm.em.findOneOrFail(
    Author,
    { id: 0 },
    {
      populate: ['reviews'],
      strategy: LoadStrategy.SELECT_IN,
    },
  );

  expect(author.reviews).toHaveLength(1);
  expect(author.reviews[0].body).toBe('r1');
});
