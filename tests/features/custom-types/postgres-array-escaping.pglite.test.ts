import { MikroORM } from '@mikro-orm/pglite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Post {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'string[]' })
  tags!: string[];
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Post],
    dbName: 'memory://',
  });
  await orm.schema.create();
});

afterAll(() => orm.close(true));

test('postgres string arrays keep NULL strings, surrounding whitespace and control characters', async () => {
  const tags = [
    ['NULL', 'null', 'Null'],
    [' padded ', 'a b', '\t'],
    ['a,b\nc', 'tab\there', 'back\\slash', 'quote"d'],
    ['', '{}', 'plain'],
  ];
  tags.forEach((t, i) => orm.em.create(Post, { id: i + 1, tags: t }));
  await orm.em.flush();
  orm.em.clear();

  const posts = await orm.em.find(Post, {}, { orderBy: { id: 'asc' } });
  expect(posts.map(p => p.tags)).toEqual(tags);

  const platform = orm.em.getPlatform();
  expect(platform.marshallArray(['NULL', ' a ', 'a\nb', 'x"y\\z', 'plain'])).toBe('{"NULL"," a ","a\nb","x\\"y\\\\z",plain}');
});
