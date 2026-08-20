import { Collection, MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Tag {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany(() => Post, post => post.tags)
  posts = new Collection<Post>(this);

  @ManyToMany(() => Video, video => video.tags)
  videos = new Collection<Video>(this);
}

@Entity()
class Post {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToMany(() => Tag, tag => tag.posts, {
    pivotTable: 'taggables',
    discriminator: 'taggable',
    fixedOrderColumn: 'sort_order',
    owner: true,
  })
  tags = new Collection<Tag>(this);
}

@Entity()
class Video {
  @PrimaryKey()
  id!: number;

  @Property()
  url!: string;

  @ManyToMany(() => Tag, tag => tag.videos, {
    pivotTable: 'taggables',
    discriminator: 'taggable',
    fixedOrderColumn: 'sort_order',
    owner: true,
  })
  tags = new Collection<Tag>(this);
}

describe('polymorphic M:N with a non-unique fixed order column', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Tag, Post, Video],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    });

    // the pivot table is managed externally, so the order column is not a unique autoincrement PK
    await orm.schema.execute(`
      create table tag (id integer primary key, name text not null);
      create table post (id integer primary key, title text not null);
      create table video (id integer primary key, url text not null);
      create table taggables (
        taggable_type text not null,
        taggable_id integer not null,
        tag_id integer not null,
        sort_order integer not null,
        primary key (taggable_type, taggable_id, tag_id)
      );
      insert into tag (id, name) values (1, 'Shared'), (2, 't2'), (3, 't3');
      insert into post (id, title) values (1, 'p1'), (2, 'p2');
      insert into video (id, url) values (1, 'v1'), (2, 'v2');
      insert into taggables (taggable_type, taggable_id, tag_id, sort_order) values
        ('post', 1, 1, 1), ('post', 1, 2, 2),
        ('post', 2, 1, 1), ('post', 2, 3, 2),
        ('video', 1, 1, 1), ('video', 2, 1, 1);
    `);
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('populating the owner side keeps shared tags on every owner', async () => {
    const posts = await orm.em.fork().find(Post, {}, { populate: ['tags'], orderBy: { id: 'asc' } });

    expect(posts.map(post => post.tags.getItems().map(tag => tag.id))).toEqual([
      [1, 2],
      [1, 3],
    ]);
  });

  test('populating the inverse side keeps owners of the same type distinct', async () => {
    const tag = await orm.em.fork().findOneOrFail(Tag, 1, { populate: ['posts', 'videos'] });

    expect(tag.posts.getItems().map(post => post.id)).toEqual([1, 2]);
    expect(tag.videos.getItems().map(video => video.id)).toEqual([1, 2]);
  });
});
