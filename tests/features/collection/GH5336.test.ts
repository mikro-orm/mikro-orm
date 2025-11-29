import { Collection, MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ unique: true })
  email!: string;

  @OneToMany({ entity: () => Book, mappedBy: 'author' })
  books = new Collection<Book>(this);

}

@Entity()
class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne({ entity: () => User })
  author!: User;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User, Book],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('5336', async () => {
  const author = orm.em.create(User, { name: 'Foo', email: 'foo' });
  orm.em.create(Book, { name: 'Foo1', author });
  orm.em.create(Book, { name: 'Foo2', author });
  await orm.em.flush();

  const user2 = await orm.em.fork().findOneOrFail(User, { name: 'Foo' }, { populate: ['books:ref'] });
  const user1 = await orm.em.fork().findOneOrFail(User, { name: 'Foo' }, { populate: ['books'] });
  expect(user1.books).toHaveLength(2);
  expect(user2.books).toHaveLength(2);
});
