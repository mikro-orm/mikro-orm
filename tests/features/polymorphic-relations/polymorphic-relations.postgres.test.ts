import { Collection, MikroORM } from '@mikro-orm/postgresql';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
class Post {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @Property()
  content!: string;

  @OneToMany(() => Like, like => like.likeable)
  likes = new Collection<Like>(this);

  constructor(title: string, content: string) {
    this.title = title;
    this.content = content;
  }
}

@Entity()
class Comment {
  @PrimaryKey()
  id!: number;

  @Property()
  text!: string;

  @OneToMany(() => Like, like => like.likeable)
  likes = new Collection<Like>(this);

  constructor(text: string) {
    this.text = text;
  }
}

@Entity()
class Like {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => [Post, Comment])
  likeable!: Post | Comment;

  @Property({ nullable: true })
  createdAt?: Date;
}

describe('polymorphic relations in PostgreSQL', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Post, Comment, Like],
      dbName: 'mikro_orm_test_polymorphic',
      metadataProvider: ReflectMetadataProvider,
    });
    await orm.schema.refresh();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  beforeEach(async () => {
    await orm.schema.clear();
  });

  test('can create and persist polymorphic relation to Post', async () => {
    const post = new Post('Hello World', 'This is a test post');
    const like = orm.em.create(Like, { likeable: post });

    await orm.em.flush();
    orm.em.clear();

    const loadedLike = await orm.em.findOneOrFail(Like, { id: like.id });
    expect(loadedLike.likeable).toBeInstanceOf(Post);
    await orm.em.populate(loadedLike, ['likeable']);
    expect((loadedLike.likeable as Post).title).toBe('Hello World');
  });

  test('can create and persist polymorphic relation to Comment', async () => {
    const comment = new Comment('Great post!');
    const like = orm.em.create(Like, { likeable: comment });

    await orm.em.flush();
    orm.em.clear();

    const loadedLike = await orm.em.findOneOrFail(Like, { id: like.id });
    expect(loadedLike.likeable).toBeInstanceOf(Comment);
    await orm.em.populate(loadedLike, ['likeable']);
    expect((loadedLike.likeable as Comment).text).toBe('Great post!');
  });

  test('can update polymorphic relation from Post to Comment', async () => {
    const post = new Post('Post', 'Content');
    const comment = new Comment('Comment');
    const like = orm.em.create(Like, { likeable: post });
    orm.em.persist(comment);

    await orm.em.flush();
    orm.em.clear();

    const loadedLike = await orm.em.findOneOrFail(Like, { id: like.id });
    const loadedComment = await orm.em.findOneOrFail(Comment, { id: comment.id });
    loadedLike.likeable = loadedComment;

    await orm.em.flush();
    orm.em.clear();

    const reloadedLike = await orm.em.findOneOrFail(Like, { id: like.id });
    expect(reloadedLike.likeable).toBeInstanceOf(Comment);
    await orm.em.populate(reloadedLike, ['likeable']);
    expect((reloadedLike.likeable as Comment).text).toBe('Comment');
  });

  test('can populate inverse side (OneToMany) for Post', async () => {
    const post = new Post('Post', 'Content');
    const like1 = orm.em.create(Like, { likeable: post });
    const like2 = orm.em.create(Like, { likeable: post });

    await orm.em.flush();
    orm.em.clear();

    const loadedPost = await orm.em.findOneOrFail(Post, { id: post.id }, { populate: ['likes'] });
    expect(loadedPost.likes).toHaveLength(2);
    expect(
      loadedPost.likes
        .getItems()
        .map(l => l.id)
        .sort(),
    ).toEqual([like1.id, like2.id].sort());
  });

  test('can populate inverse side (OneToMany) for Comment', async () => {
    const comment = new Comment('Comment');
    const like1 = orm.em.create(Like, { likeable: comment });
    const like2 = orm.em.create(Like, { likeable: comment });

    await orm.em.flush();
    orm.em.clear();

    const loadedComment = await orm.em.findOneOrFail(Comment, { id: comment.id }, { populate: ['likes'] });
    expect(loadedComment.likes).toHaveLength(2);
  });

  test('inverse side only includes likes for that specific entity type', async () => {
    const post = new Post('Post', 'Content');
    const comment = new Comment('Comment');
    const postLike = orm.em.create(Like, { likeable: post });
    const commentLike = orm.em.create(Like, { likeable: comment });

    await orm.em.flush();
    orm.em.clear();

    const loadedPost = await orm.em.findOneOrFail(Post, { id: post.id }, { populate: ['likes'] });
    const loadedComment = await orm.em.findOneOrFail(Comment, { id: comment.id }, { populate: ['likes'] });

    expect(loadedPost.likes).toHaveLength(1);
    expect(loadedPost.likes[0].id).toBe(postLike.id);

    expect(loadedComment.likes).toHaveLength(1);
    expect(loadedComment.likes[0].id).toBe(commentLike.id);
  });

  test('can remove entity with polymorphic relations', async () => {
    const post = new Post('Post', 'Content');
    const like = orm.em.create(Like, { likeable: post });

    await orm.em.flush();
    orm.em.clear();

    const loadedLike = await orm.em.findOneOrFail(Like, { id: like.id });
    orm.em.remove(loadedLike);

    await orm.em.flush();

    const count = await orm.em.count(Like, {});
    expect(count).toBe(0);
  });

  test('metadata is correctly initialized', async () => {
    const meta = orm.getMetadata().get(Like);
    const likeableProp = meta.properties.likeable;

    expect(likeableProp.polymorphic).toBe(true);
    expect(likeableProp.polymorphTargets).toHaveLength(2);
    expect(likeableProp.discriminator).toBe('likeable');
    expect(likeableProp.discriminatorMap).toBeDefined();
    expect(likeableProp.createForeignKeyConstraint).toBe(false);
    expect(likeableProp.fieldNames).toContain('likeable_type');
    expect(likeableProp.fieldNames).toContain('likeable_id');
  });

  test('schema has correct columns', async () => {
    const sql = await orm.schema.getCreateSchemaSQL();
    const likeTable = sql.split('\n').find(s => s.includes('create table "like"'));

    expect(likeTable).toBeDefined();
    expect(likeTable).toContain('likeable_type');
  });

  test('can handle multiple polymorphic relations to same target', async () => {
    const post = new Post('Post', 'Content');
    const like1 = orm.em.create(Like, { likeable: post });
    const like2 = orm.em.create(Like, { likeable: post });
    const like3 = orm.em.create(Like, { likeable: post });

    await orm.em.flush();
    orm.em.clear();

    const loadedPost = await orm.em.findOneOrFail(Post, { id: post.id }, { populate: ['likes'] });
    expect(loadedPost.likes).toHaveLength(3);
  });
});
