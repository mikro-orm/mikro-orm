import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity({ tableName: 'avatars' })
class Avatar {
  @PrimaryKey()
  id!: number;

  @Property()
  nickname!: string;
}

@Entity({ tableName: 'posts' })
class Post {
  @PrimaryKey()
  id!: number;

  @Property()
  content!: string;
}

@Entity({ tableName: 'comments' })
class Comment {
  @PrimaryKey()
  id!: number;

  @Property()
  content!: string;
}

@Entity({ tableName: 'likes', inheritance: 'tpt' })
abstract class Like {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Avatar, { deleteRule: 'cascade' })
  avatar!: Avatar;
}

@Entity({ tableName: 'post_likes' })
class PostLike extends Like {
  @ManyToOne(() => Post, { deleteRule: 'cascade' })
  post!: Post;
}

@Entity({ tableName: 'comment_likes' })
class CommentLike extends Like {
  @ManyToOne(() => Comment, { deleteRule: 'cascade' })
  comment!: Comment;
}

test('GH #7609: TPT subclass is linked even when registered before its abstract parent', async () => {
  // mirrors glob-based discovery where alphabetical file order can place a child
  // (e.g. comment-like.entity.js) before its abstract parent (like.entity.js)
  const orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Avatar, Comment, CommentLike, Like, PostLike, Post],
    metadataProvider: ReflectMetadataProvider,
  });

  const sql = await orm.schema.getCreateSchemaSQL();
  expect(sql).toContain('create table `likes`');
  expect(sql).toContain('create table `post_likes`');
  expect(sql).toContain('create table `comment_likes`');

  const commentLikeMeta = orm.getMetadata().get(CommentLike);
  expect(commentLikeMeta.inheritanceType).toBe('tpt');
  expect(commentLikeMeta.tptParent?.class).toBe(Like);

  await orm.close(true);
});
