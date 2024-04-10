import {
  OptionalProps,
  Entity,
  MikroORM,
  PrimaryKey,
  Property,
  OneToMany,
  ManyToOne,
  Enum,
  Collection,
  Opt,
} from '@mikro-orm/postgresql';

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

export enum CommentObjectTypeEnum {
  comment = 'comment',
  post = 'post',
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: '5445',
    entities: [Author, Post, Comment],
  });
  await orm.schema.refreshDatabase();

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
      'author.id',
      'author.name',
      'author.biography',
    ])
    .leftJoinAndSelect(
      'post.comments',
      'comments',
      {
        objectType: CommentObjectTypeEnum.post,
        content: { $ne: null },
      },
      [
        'comments.content',
        'comments.createdAt',
        'comments.updatedAt',
      ],
    )
    .where({ id: 5 })
    .getResult();

  expect(posts[0].id).toBe(5);
  expect(posts[0].author).toBeDefined();
  expect(posts[0].author.id).toBe(3);
  expect(posts[0].author.name).toBe('author name');
  expect(posts[0].author.biography).toBe('author bio');
  expect(posts[0].comments).toBeDefined();
  expect(posts[0].comments![0]).toBeDefined();
  expect(posts[0].comments![0].content).toBe('comment content');
  expect(posts[0].comments![0].createdAt).toBeDefined();
  expect(posts[0].comments![0].updatedAt).toBeDefined();
});

test('use subquery for comments', async () => {
  const commentsSubQuery = orm.em
    .createQueryBuilder(Comment, 'comments')
    .select([
      'post',
      'objectType',
      'content',
      'createdAt',
      'updatedAt',
    ]);

  const posts = await orm.em
    .createQueryBuilder(Post, 'post')
    .leftJoinAndSelect('post.author', 'author')
    .leftJoinAndSelect(['post.comments', commentsSubQuery], 'comments', {
      objectType: CommentObjectTypeEnum.post,
      content: { $ne: null },
    })
    .where({ id: 5 })
    .getResult();
});
