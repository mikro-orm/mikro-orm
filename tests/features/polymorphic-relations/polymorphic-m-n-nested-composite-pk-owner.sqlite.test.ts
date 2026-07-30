import { Collection, MikroORM, PrimaryKeyProp } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
class Param {
  [PrimaryKeyProp]?: ['bar', 'baz'];

  @PrimaryKey()
  bar!: number;

  @PrimaryKey()
  baz!: number;
}

// the owner's composite PK contains a relation to another composite PK entity, so the pivot
// FK is nested while the owner PKs are flat - the two only line up when both get flattened
@Entity()
class NestedTag {
  [PrimaryKeyProp]?: ['param', 'qux'];

  @ManyToOne(() => Param, { joinColumns: ['param_bar', 'param_baz'], primary: true })
  param!: Param;

  @PrimaryKey()
  qux!: number;

  @ManyToMany(() => Post, post => post.tags)
  posts = new Collection<Post>(this);
}

@Entity()
class Post {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToMany(() => NestedTag, tag => tag.posts, {
    pivotTable: 'taggables',
    discriminator: 'taggable',
    owner: true,
  })
  tags = new Collection<NestedTag>(this);
}

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
class NestedPost {
  [PrimaryKeyProp]?: ['param', 'qux'];

  @ManyToOne(() => Param, { joinColumns: ['param_bar', 'param_baz'], primary: true })
  param!: Param;

  @PrimaryKey()
  qux!: number;

  @ManyToMany({
    entity: () => [Image, Clip],
    pivotTable: 'attachables',
    discriminator: 'attachable',
    owner: true,
  })
  attachments = new Collection<Image | Clip>(this);
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Param, NestedTag, Post, Image, Clip, NestedPost],
    dbName: ':memory:',
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('inverse side of polymorphic M:N with nested composite PK owner', async () => {
  const em = orm.em.fork();
  await em.insert(Param, { bar: 1, baz: 2 });
  await em.insert(NestedTag, { param: [1, 2], qux: 3 });
  await em.insert(NestedTag, { param: [1, 2], qux: 4 });
  await em.insert(Post, { id: 10, title: 'p1', tags: [[1, 2, 3]] });
  await em.insert(Post, { id: 11, title: 'p2', tags: [[1, 2, 4]] });

  const tags = await em.fork().find(NestedTag, { param: [1, 2] }, { populate: ['posts'], orderBy: { qux: 'asc' } });
  expect(tags.map(t => t.posts.getIdentifiers())).toEqual([[10], [11]]);
});

test('union target polymorphic M:N with nested composite PK owner', async () => {
  const em = orm.em.fork();
  await em.insert(Param, { bar: 5, baz: 6 });
  await em.insert(Image, { id: 20, url: 'i1' });
  await em.insert(Clip, { id: 21, src: 'c1' });
  await em.insert(NestedPost, { param: [5, 6], qux: 7 });
  await em.insert(NestedPost, { param: [5, 6], qux: 8 });
  // written directly, as persisting a union target pivot from a nested composite PK owner
  // drops the trailing PK columns - a separate bug on the write path
  await em
    .getConnection()
    .execute(
      'insert into attachables (nested_post_param_bar, nested_post_param_baz, nested_post_qux, attachable_type, attachable_id) values (5, 6, 7, ?, 20), (5, 6, 8, ?, 21)',
      ['image', 'clip'],
    );

  const posts = await em
    .fork()
    .find(NestedPost, { param: [5, 6] }, { populate: ['attachments'], orderBy: { qux: 'asc' } });
  expect(posts.map(p => p.attachments.getIdentifiers())).toEqual([[20], [21]]);
});
