import { helper, MikroORM } from '@mikro-orm/sqlite';

import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ unique: true })
  email!: string;

}

@Entity()
class Post {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => User)
  author!: User;

}

let orm: MikroORM;

beforeEach(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User, Post],
  });
  await orm.schema.refreshDatabase();
});

afterEach(async () => {
  await orm.close(true);
});

test('find through relation', async () => {
  const user = orm.em.create(User, { name: 'Foo', email: 'bar@example.com' });
  const post = orm.em.create(Post, { title: 'Hello', author: user });
  await orm.em.flush();
  orm.em.clear();

  const userEmailOnlyThroughPost = await orm.em.findOneOrFail(
    Post,
    { id: post.id },
    { fields: ['author.email'] },
  );
  const userEmailOnly = userEmailOnlyThroughPost.author;

  expect(userEmailOnly.email).toBe('bar@example.com');
  expect(helper(userEmailOnly).__loadedProperties.has('name')).toBe(false);

  const userNameOnly = await orm.em.findOneOrFail(
    User,
    { id: user.id },
    { fields: ['name'] },
  );

  expect(userNameOnly.name).toBe('Foo');
  expect(helper(userEmailOnly).__loadedProperties.has('name')).toBe(true);
});
