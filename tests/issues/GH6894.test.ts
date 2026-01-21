import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, PrimaryKeyProp, Property, ReflectMetadataProvider, wrap } from '@mikro-orm/sqlite';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @PrimaryKey()
  email!: string;

  @OneToMany(() => Post, post => post.user)
  posts = new Collection<Post>(this);

  constructor(id: number, email: string) {
    this.id = id;
    this.email = email;
  }

}

@Entity()
class Post {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => User, { primary: true })
  user!: User;

  @Property()
  title!: string;

  @OneToMany(() => Comment, comment => comment.post)
  comments = new Collection<Comment>(this);

  [PrimaryKeyProp]?: ['id', 'user'];

  constructor(id: number, user: User) {
    this.id = id;
    this.user = user;
  }

}

@Entity()
class Comment {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Post, { primary: true })
  post!: Post;

  @Property()
  text!: string;

  @OneToMany(() => Tag, tag => tag.comment)
  tags = new Collection<Tag>(this);

  [PrimaryKeyProp]?: ['id', 'post'];

  constructor(id: number, post: Post) {
    this.id = id;
    this.post = post;
  }

}

@Entity()
class Tag {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Comment, { primary: true })
  comment!: Comment;

  @Property()
  name!: string;

  [PrimaryKeyProp]?: ['id', 'comment'];

  constructor(id: number, comment: Comment) {
    this.id = id;
    this.comment = comment;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User, Post, Comment, Tag],
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close();
});

test('GH6894 - cascading create with composite PKs via em.create()', async () => {
  const em = orm.em.fork();

  // Create deeply nested structure with em.create()
  const user = em.create(User, {
    id: 1,
    email: 'user1@example.com',
    posts: [{
      id: 1,
      title: 'Post 1',
      comments: [{
        id: 1,
        text: 'Comment 1',
        tags: [{
          id: 1,
          name: 'Tag 1',
        }],
      }],
    }],
  });

  await em.flush();

  // Verify everything was persisted
  const loadedUser = await em.findOneOrFail(User, { id: 1, email: 'user1@example.com' }, {
    populate: ['posts.comments.tags'],
  });

  expect(loadedUser.posts).toHaveLength(1);
  expect(loadedUser.posts[0].comments).toHaveLength(1);
  expect(loadedUser.posts[0].comments[0].tags).toHaveLength(1);
  expect(loadedUser.posts[0].comments[0].tags[0].name).toBe('Tag 1');
});

test('GH6894 - cascading create with composite PKs via assign()', async () => {
  const em = orm.em.fork();

  // Create a user and post first
  const user = em.create(User, { id: 2, email: 'user2@example.com' });
  await em.flush();

  // Now assign nested data
  wrap(user).assign({
    posts: [{
      id: 2,
      title: 'Post 2',
      comments: [{
        id: 2,
        text: 'Comment 2',
        tags: [{
          id: 2,
          name: 'Tag 2',
        }],
      }],
    }],
  });

  await em.flush();

  // Verify everything was persisted
  const loadedUser = await em.findOneOrFail(User, { id: 2, email: 'user2@example.com' }, {
    populate: ['posts.comments.tags'],
  });

  expect(loadedUser.posts).toHaveLength(1);
  expect(loadedUser.posts[0].comments).toHaveLength(1);
  expect(loadedUser.posts[0].comments[0].tags).toHaveLength(1);
  expect(loadedUser.posts[0].comments[0].tags[0].name).toBe('Tag 2');
});

test('GH6894 - cascading create with 4-level deep nesting via persist on leaf entity', async () => {
  const em = orm.em.fork();

  // Manually create all entities with proper references
  const user = new User(3, 'user3@example.com');
  const post = new Post(3, user);
  post.title = 'Post 3';
  user.posts.add(post);
  const comment = new Comment(3, post);
  comment.text = 'Comment 3';
  post.comments.add(comment);
  const tag = new Tag(3, comment);
  tag.name = 'Tag 3';
  comment.tags.add(tag);

  // Persisting the user should cascade to all nested entities
  em.persist(user);
  await em.flush();

  // Clear the EM to ensure we're loading from DB
  em.clear();

  // Verify everything was persisted
  const loadedUser = await em.findOneOrFail(User, { id: 3, email: 'user3@example.com' }, {
    populate: ['posts.comments.tags'],
  });

  expect(loadedUser.posts).toHaveLength(1);
  expect(loadedUser.posts[0].comments).toHaveLength(1);
  expect(loadedUser.posts[0].comments[0].tags).toHaveLength(1);
  expect(loadedUser.posts[0].comments[0].tags[0].name).toBe('Tag 3');
});
