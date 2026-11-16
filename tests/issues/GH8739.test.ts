import { Collection, MikroORM } from '@mikro-orm/postgresql';
import { Entity, ManyToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Tag {
  @PrimaryKey()
  id!: number;

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
    dbName: '8739',
  });
  await orm.schema.refresh();
  orm.em.create(Post, {
    id: 1,
    tags: [
      { id: 1, meta: { color: 'red' } },
      { id: 2, meta: { color: 'blue' } },
    ],
  });
  await orm.em.flush();
});

afterAll(() => orm.close(true));

function changeSets(em: typeof orm.em) {
  em.getUnitOfWork().computeChangeSets();
  return em
    .getUnitOfWork()
    .getChangeSets()
    .map(cs => cs.payload);
}

test('collection.load()', async () => {
  const em = orm.em.fork();
  const post = await em.findOneOrFail(Post, 1);
  await post.tags.load();
  expect(changeSets(em)).toEqual([]);
});

test('collection.init()', async () => {
  const em = orm.em.fork();
  const post = await em.findOneOrFail(Post, 1);
  await post.tags.init();
  expect(changeSets(em)).toEqual([]);
});

test.each(['select-in', 'joined'] as const)('populate with refresh: true (%s)', async strategy => {
  const em = orm.em.fork();
  await em.find(Post, {}, { populate: ['tags'], strategy, refresh: true });
  expect(changeSets(em)).toEqual([]);
});

test('refresh still updates the snapshot to the reloaded values', async () => {
  const em = orm.em.fork();
  const post = await em.findOneOrFail(Post, 1, { populate: ['tags'] });
  await em.nativeUpdate(Tag, 1, { meta: { color: 'green' } });

  await post.tags.init();
  const tag = em.getReference(Tag, 1);
  expect(tag.meta).toEqual({ color: 'green' });
  expect(changeSets(em)).toEqual([]);

  tag.meta = { color: 'red' };
  expect(changeSets(em)).toEqual([{ meta: '{"color":"red"}' }]);
});
