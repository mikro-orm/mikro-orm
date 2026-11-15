import { MikroORM } from '@mikro-orm/sqlite';
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
    dbName: ':memory:',
  });
  await orm.schema.create();
});

afterAll(() => orm.close(true));

test('string arrays keep trailing empty strings (#8719)', async () => {
  const tags = [['a,b', ''], [''], ['a', ''], ['x,y', 'a', ''], ['', ''], ['', 'a,b'], []];
  tags.forEach((t, i) => orm.em.create(Post, { id: i + 1, tags: t }));
  await orm.em.flush();
  orm.em.clear();

  const posts = await orm.em.find(Post, {}, { orderBy: { id: 'asc' } });
  expect(posts.map(p => p.tags)).toEqual(tags);

  const platform = orm.em.getPlatform();
  expect(platform.unmarshallArray('"a,b",')).toEqual(['a,b', '']);
  expect(platform.unmarshallArray('"x,y",a,')).toEqual(['x,y', 'a', '']);
});
