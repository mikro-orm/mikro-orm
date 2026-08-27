import { Collection, defineEntity, InferEntity, MikroORM, p, Ref, wrap } from '@mikro-orm/sqlite';

const User = defineEntity({
  name: 'User',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

type IUser = InferEntity<typeof User>;

const Post = defineEntity({
  name: 'Post',
  properties: {
    id: p.integer().primary(),
    author: p
      .manyToOne(User)
      .ref()
      .serializer((author: Ref<IUser>) => author.id),
    authors: p
      .manyToMany(User)
      .pivotTable('post_authors')
      .serializer((users: Collection<IUser>) => users.getIdentifiers())
      .serializedName('userIds'),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User, Post],
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('GH #8214 (serializer callback parameter matches the runtime relation value)', async () => {
  const author1 = orm.em.create(User, { id: 1, name: 'u1' });
  const author2 = orm.em.create(User, { id: 2, name: 'u2' });
  orm.em.create(Post, { id: 1, author: author1, authors: [author1, author2] });
  await orm.em.flush();
  orm.em.clear();

  const post = await orm.em.findOneOrFail(Post, 1, { populate: ['authors'] });
  expect(wrap(post).toObject()).toEqual({ id: 1, author: 1, userIds: [1, 2] });
});
