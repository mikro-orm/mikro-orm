import { OptionalProps, MikroORM, Collection, Opt } from '@mikro-orm/postgresql';

import { Entity, Enum, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
export enum CommentObjectTypeEnum {
  comment = 'comment',
  post = 'post',
}

abstract class BaseEntity {

  [OptionalProps]?: 'createdAt' | 'updatedAt';

  @PrimaryKey()
  id!: number;

  @Property({ defaultRaw: 'now()' })
  createdAt = new Date();

  @Property({ defaultRaw: 'now()', onUpdate: () => new Date() })
  updatedAt = new Date();

}

@Entity({ tableName: 'authors' })
class Author extends BaseEntity {

  @Property()
  name!: string;

  @Property({ nullable: true })
  biography?: string;

  @OneToMany(() => Post, post => post.author)
  posts = new Collection<Post>(this);

}

@Entity({ tableName: 'posts' })
class Post extends BaseEntity {

  @Property()
  title!: string;

  @Property()
  content!: string;

  @Property()
  published!: boolean;

  @ManyToOne({
    entity: () => Author,
    deleteRule: 'cascade',
    updateRule: 'cascade',
  })
  author!: Author;

  @Property({ persist: false })
  authorId?: number;

  @OneToMany({
    entity: () => Comment,
    mappedBy: 'post',
    where: {
      objectType: CommentObjectTypeEnum.post,
    },
  })
  comments = new Collection<Comment>(this);

}

@Entity({ tableName: 'comments' })
class Comment {

  @Enum({
    items: () => CommentObjectTypeEnum,
    nativeEnumName: 'comment_object_type_enum',
    primary: true,
  })
  objectType!: string;

  @Property({ persist: false })
  objectId!: number & Opt;

  @Property()
  content!: string;

  @Property()
  createdAt? = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt? = new Date();

  @ManyToOne({
    entity: () => Post,
    name: 'object_id',
    primary: true,
  })
  post!: Post;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: '5445',
    entities: [Author, Post, Comment],
  });
  await orm.schema.refresh();

  const author = orm.em.create(Author, {
    id: 3,
    name: 'author name',
    biography: 'author bio',
  });
  orm.em.create(Post, {
    id: 5,
    title: 'post title',
    content: 'post content',
    published: true,
    author,
  });
  orm.em.create(Comment, {
    objectType: CommentObjectTypeEnum.post,
    post: 5,
    content: 'comment content',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  orm.em.create(Comment, {
    objectType: CommentObjectTypeEnum.comment,
    post: 5,
    content: 'bad comment content',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('define joined columns in leftJoinAndSelect()', async () => {
  const posts = await orm.em
    .createQueryBuilder(Post, 'post')
    .leftJoinAndSelect('post.author', 'author', {}, [
      'id',
      'name',
      'biography',
    ])
    .leftJoinAndSelect('post.comments', 'comments', {}, [
      'comments.content',
      'comments.created_at',
      'comments.updated_at',
    ])
    .where({ id: 5 })
    .getResult();

  expect(posts[0].comments).toBeDefined();
  expect(posts[0].comments.length).toBe(1);
});

test('em.find', async () => {
  const posts = await orm.em
    .find(Post, { id: 5 }, {
      populate: ['author', 'comments'],
      fields: ['author.name', 'author.biography'],
    });

  expect(posts[0].comments).toBeDefined();
  expect(posts[0].comments.length).toBe(1);
});
