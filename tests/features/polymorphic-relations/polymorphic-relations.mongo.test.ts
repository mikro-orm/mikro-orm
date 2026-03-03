import { Collection } from '@mikro-orm/core';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
  SerializedPrimaryKey,
} from '@mikro-orm/decorators/legacy';
import { MikroORM, ObjectId } from '@mikro-orm/mongodb';

@Entity()
class Post {
  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  title!: string;

  @OneToMany(() => UserLike, like => like.likeable)
  likes = new Collection<UserLike>(this);
}

@Entity()
class Comment {
  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  text!: string;

  @OneToMany(() => UserLike, like => like.likeable)
  likes = new Collection<UserLike>(this);
}

@Entity()
class UserLike {
  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @ManyToOne(() => [Post, Comment], { nullable: true })
  likeable!: Post | Comment | null;
}

describe('polymorphic relations in mongodb', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Post, Comment, UserLike],
      clientUrl: 'mongodb://localhost:27017/mikro-orm-test-polymorphic',
      metadataProvider: ReflectMetadataProvider,
    });
  });

  beforeEach(async () => {
    await orm.schema.clear();
    orm.em.clear();
  });

  afterAll(async () => {
    await orm.schema.drop();
    await orm.close(true);
  });

  test('can persist and load polymorphic relation to Post', async () => {
    const post = orm.em.create(Post, { title: 'Test Post' });
    const like = orm.em.create(UserLike, { likeable: post });
    await orm.em.flush();
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(UserLike, like.id);
    expect(loaded.likeable).toBeDefined();
    expect(loaded.likeable!.constructor.name).toBe('Post');
  });

  test('can persist and load polymorphic relation to Comment', async () => {
    const comment = orm.em.create(Comment, { text: 'Test Comment' });
    const like = orm.em.create(UserLike, { likeable: comment });
    await orm.em.flush();
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(UserLike, like.id);
    expect(loaded.likeable).toBeDefined();
    expect(loaded.likeable!.constructor.name).toBe('Comment');
  });

  test('can populate polymorphic relation', async () => {
    const post = orm.em.create(Post, { title: 'Populated Post' });
    const comment = orm.em.create(Comment, { text: 'Populated Comment' });
    const like1 = orm.em.create(UserLike, { likeable: post });
    const like2 = orm.em.create(UserLike, { likeable: comment });
    await orm.em.flush();
    orm.em.clear();

    const likes = await orm.em.find(UserLike, {}, { populate: ['likeable'] });
    expect(likes).toHaveLength(2);

    const postLike = likes.find(l => l.id === like1.id)!;
    const commentLike = likes.find(l => l.id === like2.id)!;

    expect(postLike.likeable).toBeInstanceOf(Post);
    expect((postLike.likeable as Post).title).toBe('Populated Post');

    expect(commentLike.likeable).toBeInstanceOf(Comment);
    expect((commentLike.likeable as Comment).text).toBe('Populated Comment');
  });

  test('inverse side loading works', async () => {
    const post = orm.em.create(Post, { title: 'Post with likes' });
    orm.em.create(UserLike, { likeable: post });
    orm.em.create(UserLike, { likeable: post });
    const comment = orm.em.create(Comment, { text: 'Comment' });
    orm.em.create(UserLike, { likeable: comment });
    await orm.em.flush();
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(Post, post.id, { populate: ['likes'] });
    expect(loaded.likes).toHaveLength(2);
  });

  test('null polymorphic relation', async () => {
    const like = orm.em.create(UserLike, { likeable: null });
    await orm.em.flush();
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(UserLike, like.id);
    expect(loaded.likeable).toBeNull();
  });

  test('tuple format in native insert', async () => {
    const post = orm.em.create(Post, { title: 'Tuple test' });
    await orm.em.flush();
    orm.em.clear();

    // Insert via em.insert with tuple format [discriminator, id]
    await orm.em.insert(UserLike, {
      likeable: ['post', post._id.toHexString()] as any,
    });
    orm.em.clear();

    const likes = await orm.em.find(UserLike, {}, { populate: ['likeable'] });
    const like = likes.find(l => l.likeable && (l.likeable as Post).title === 'Tuple test');
    expect(like).toBeDefined();
    expect(like!.likeable).toBeInstanceOf(Post);
  });

  test('can update polymorphic relation between types', async () => {
    const post = orm.em.create(Post, { title: 'Original' });
    const like = orm.em.create(UserLike, { likeable: post });
    await orm.em.flush();
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(UserLike, like.id, { populate: ['likeable'] });
    expect(loaded.likeable).toBeInstanceOf(Post);

    const comment = orm.em.create(Comment, { text: 'New target' });
    loaded.likeable = comment;
    await orm.em.flush();
    orm.em.clear();

    const updated = await orm.em.findOneOrFail(UserLike, like.id, { populate: ['likeable'] });
    expect(updated.likeable).toBeInstanceOf(Comment);
    expect((updated.likeable as Comment).text).toBe('New target');
  });
});
