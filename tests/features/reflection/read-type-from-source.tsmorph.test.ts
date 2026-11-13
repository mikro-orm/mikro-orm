import { JsonType, type EntityMetadata, type EntityProperty } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

@Entity()
class Post {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @Property()
  views!: string;

  @Property()
  stats!: object;
}

// reads `views` and `stats` from elsewhere, the rest from the source file as usual
class OverridingProvider extends TsMorphMetadataProvider {
  static readonly read: string[] = [];

  protected override readTypeFromSource(meta: EntityMetadata, prop: EntityProperty) {
    OverridingProvider.read.push(`${meta.className}.${prop.name}`);

    if (prop.name === 'views') {
      return { type: 'number', optional: true };
    }

    if (prop.name === 'stats') {
      return { type: 'Record<string, number>' };
    }

    return super.readTypeFromSource(meta, prop);
  }
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Post],
    dbName: ':memory:',
    metadataProvider: OverridingProvider,
    metadataCache: { enabled: false },
  });
});

afterAll(async () => {
  await orm.close(true);
});

test('a subclass can read property types itself and keep the normalization', () => {
  const meta = orm.getMetadata().get(Post);

  expect(OverridingProvider.read).toEqual(expect.arrayContaining(['Post.title', 'Post.views', 'Post.stats']));
  expect(meta.properties.title.type).toBe('string');
  expect(meta.properties.views.type).toBe('number');
  expect(meta.properties.views.optional).toBe(true);
  expect(meta.properties.stats.customType).toBeInstanceOf(JsonType);
});
