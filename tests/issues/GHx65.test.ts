import { Collection, MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Image {
  @PrimaryKey()
  id!: number;

  @Property()
  url!: string;
}

@Entity()
class Clip {
  @PrimaryKey()
  id!: number;

  @Property()
  src!: string;
}

@Entity()
class Post {
  @PrimaryKey()
  id!: number;

  @ManyToMany({ entity: () => [Image, Clip], pivotTable: 'attachables', discriminator: 'attachable', owner: true })
  attachments = new Collection<Image | Clip>(this);
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Image, Clip, Post],
    dbName: ':memory:',
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

// a union target pivot row is keyed by `[discriminator, ...pk]`
test('persisting a union target M:N collection from a raw payload writes the discriminator', async () => {
  const em = orm.em.fork();
  await em.insertMany(Image, [
    { id: 20, url: 'i1' },
    { id: 21, url: 'i2' },
  ]);
  await em.insert(Clip, { id: 30, src: 'c1' });
  await em.insert(Post, {
    id: 1,
    attachments: [
      ['image', 20],
      ['clip', 30],
    ] as never,
  });

  expect(await em.getConnection().execute('select * from attachables order by attachable_id')).toEqual([
    { post_id: 1, attachable_type: 'image', attachable_id: 20 },
    { post_id: 1, attachable_type: 'clip', attachable_id: 30 },
  ]);

  // a union target is loaded per target table, so the collection is grouped by type, not by pivot order
  const loaded = await em.fork().findOneOrFail(Post, 1, { populate: ['attachments'] });
  expect(loaded.attachments.getIdentifiers().sort((a, b) => (a as number) - (b as number))).toEqual([20, 30]);

  // nativeUpdate replaces the collection rather than appending to it
  await em.nativeUpdate(Post, { id: 1 }, { attachments: [['image', 21]] as never });
  expect(await em.getConnection().execute('select * from attachables')).toEqual([
    { post_id: 1, attachable_type: 'image', attachable_id: 21 },
  ]);
});

test('a bare primary key cannot address a union target', async () => {
  const em = orm.em.fork();
  await em.insert(Image, { id: 40, url: 'i3' });

  await expect(em.insert(Post, { id: 2, attachments: [40] as never })).rejects.toThrow(
    `Cannot resolve the discriminator value of Post.attachments from '40', as the same primary key can exist in any of the target tables. Pass the target as a [discriminator, ...primaryKey] tuple, e.g. ["image",40].`,
  );

  // a PK that happens to equal a discriminator value must not pass as the discriminator itself
  await expect(em.insert(Post, { id: 3, attachments: ['image'] as never })).rejects.toThrow(
    `Cannot resolve the discriminator value of Post.attachments from 'image'`,
  );

  await expect(em.nativeUpdate(Post, { id: 2 }, { attachments: [40] as never })).rejects.toThrow(
    `Cannot resolve the discriminator value of Post.attachments from '40'`,
  );
});
