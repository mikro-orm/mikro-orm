import { Collection } from '@mikro-orm/core';
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
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author, { mapToPk: true })
  author!: number;
}

// `ChangeSetComputer.processProperty()` used a truthiness check on the unwrapped property
// value, so a `mapToPk` FK holding a falsy but valid raw PK value (`0`) recursed forever.
test('flushing an entity with a mapToPk FK of 0 does not recurse infinitely', async () => {
  const orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Author, Book],
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.refresh();

  await orm.em.insert(Author, { id: 0, name: 'a0' });
  orm.em.create(Book, { id: 1, author: 0 });
  await orm.em.flush();
  orm.em.clear();

  const books = await orm.em.find(Book, {});
  expect(books).toHaveLength(1);
  expect(books[0].author).toBe(0);

  await orm.close(true);
});
