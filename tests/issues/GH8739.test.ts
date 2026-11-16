import { Collection, MikroORM } from '@mikro-orm/postgresql';
import { Entity, ManyToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Tag {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ type: 'json' })
  meta!: { color: string };
}

@Entity()
class Post {
  @PrimaryKey()
  id!: number;

  @ManyToMany(() => Tag)
  tags = new Collection<Tag>(this);
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Post, Tag],
    dbName: 'mikro_orm_test_gh8739',
  });
  await orm.schema.refresh();
  orm.em.create(Post, {
    id: 1,
    tags: [
      { id: 1, name: 'a', meta: { color: 'red' } },
      { id: 2, name: 'b', meta: { color: 'blue' } },
    ],
  });
  await orm.em.flush();
});

afterAll(() => orm.close(true));

function changeSets(em: MikroORM['em']) {
  em.getUnitOfWork().computeChangeSets();
  return em
    .getUnitOfWork()
    .getChangeSets()
    .map(cs => cs.payload);
}

test('collection.load() does not mark m:n items with custom types as dirty', async () => {
  const em = orm.em.fork();
  const post = await em.findOneOrFail(Post, 1);
  await post.tags.load();
  expect(changeSets(em)).toEqual([]);
});

test('collection.init() does not mark m:n items with custom types as dirty', async () => {
  const em = orm.em.fork();
  const post = await em.findOneOrFail(Post, 1);
  await post.tags.init();
  expect(post.tags.getItems().map(t => t.meta)).toEqual([{ color: 'red' }, { color: 'blue' }]);
  expect(changeSets(em)).toEqual([]);
});

test.each(['select-in', 'joined'] as const)(
  'populating m:n with refresh does not mark items with custom types as dirty (%s)',
  async strategy => {
    const em = orm.em.fork();
    await em.find(Post, {}, { populate: ['tags'], strategy, refresh: true });
    expect(changeSets(em)).toEqual([]);

    // refreshing already loaded items
    await em.find(Post, {}, { populate: ['tags'], strategy, refresh: true });
    expect(changeSets(em)).toEqual([]);
  },
);

test.each(['select-in', 'joined'] as const)(
  'refreshing m:n items keeps user changes of not reloaded properties detectable (%s)',
  async strategy => {
    const em = orm.em.fork();
    const post = await em.findOneOrFail(Post, 1, { populate: ['tags'], strategy });
    post.tags[0].name = 'changed';
    await em.populate(post, ['tags'], { fields: ['tags.meta'], strategy, refresh: true });
    expect(changeSets(em)).toEqual([{ name: 'changed' }]);
  },
);
