import { MikroORM, Collection } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, OneToMany, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @OneToMany({ type: 'Article', mappedBy: 'author' })
  articles = new Collection<Article>(this);

}

@Entity()
class Article {

  @PrimaryKey()
  id!: number;

  @ManyToOne({ type: 'User' })
  author!: User;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Article, User],
    dbName: ':memory:',
    forceEntityConstructor: true,
  });
  await orm.schema.createSchema();

  await orm.em.insert(User, { id: 1 });
  await orm.em.insert(Article, { id: 1, author: 1 });
});

afterAll(() => orm.close(true));

test('GH #5972', async () => {
  const user1 = await orm.em.fork().findOneOrFail(User, { id: 1 }, { populate: ['articles'] });
  expect(user1.articles).toHaveLength(1);

  const user2 = await orm.em.fork().findOneOrFail(User, { id: 1 }, { populate: ['articles'], strategy: 'select-in' });
  expect(user2.articles).toHaveLength(1);

  const user3 = await orm.em.fork().findOneOrFail(User, { id: 1 });
  await orm.em.populate(user3, ['articles']);
  expect(user3.articles).toHaveLength(1);

  const user4 = await orm.em.fork().findOneOrFail(User, { id: 1 });
  await user4.articles.loadItems();
  expect(user4.articles).toHaveLength(1);
});
