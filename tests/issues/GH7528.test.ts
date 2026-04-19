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
class Author7528 {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => Book7528, b => b.author)
  books = new Collection<Book7528>(this);
}

@Entity()
class Book7528 {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Author7528)
  author!: Author7528;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Author7528, Book7528],
    dbName: ':memory:',
  });
  await orm.schema.create();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #7528 - transactional({ clear: true }) should not overwrite loaded entities with uninitialized references', async () => {
  const author = orm.em.create(Author7528, { name: 'John' });
  const book = orm.em.create(Book7528, { title: 'Book 1', author });
  await orm.em.flush();

  // Author is fully loaded in parent context
  expect(author.name).toBe('John');

  await orm.em.transactional(
    async em => {
      // Inside the fork, use getReference() to get an uninitialized proxy
      const ref = em.getReference(Author7528, author.id);
      // Use the reference in an update (typical pattern: assigning FK without loading)
      const b = await em.findOneOrFail(Book7528, book.id);
      b.title = 'Updated';
      b.author = ref;
    },
    { clear: true },
  );

  // After transaction, the parent entity should still be fully loaded
  expect(author.name).toBe('John');
});
