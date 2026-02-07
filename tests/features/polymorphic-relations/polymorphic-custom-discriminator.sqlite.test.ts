import { Collection, MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class BlogPost {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @OneToMany(() => Activity, a => a.subject)
  activities = new Collection<Activity>(this);

  constructor(title: string) {
    this.title = title;
  }

}

@Entity()
class ForumPost {

  @PrimaryKey()
  id!: number;

  @Property()
  content!: string;

  @OneToMany(() => Activity, a => a.subject)
  activities = new Collection<Activity>(this);

  constructor(content: string) {
    this.content = content;
  }

}

@Entity()
class Activity {

  @PrimaryKey()
  id!: number;

  @Property()
  action!: string;

  // Polymorphic relation with custom discriminator map
  // Using custom values instead of table names
  @ManyToOne(() => [BlogPost, ForumPost], {
    discriminator: 'subject',
    discriminatorMap: {
      blog: 'BlogPost',
      forum: 'ForumPost',
    },
    nullable: true,
  })
  subject!: BlogPost | ForumPost | null;

  constructor(action: string) {
    this.action = action;
  }

}

describe('polymorphic relations with custom discriminator map', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [BlogPost, ForumPost, Activity],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    });
    await orm.schema.create();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  beforeEach(async () => {
    await orm.em.nativeDelete(Activity, {});
    await orm.em.nativeDelete(BlogPost, {});
    await orm.em.nativeDelete(ForumPost, {});
    orm.em.clear();
  });

  test('metadata has custom discriminator map', async () => {
    const meta = orm.getMetadata().get(Activity);
    const subjectProp = meta.properties.subject;

    expect(subjectProp.polymorphic).toBe(true);
    expect(subjectProp.discriminatorMap).toBeDefined();
    expect(subjectProp.discriminatorMap!.blog).toBe(BlogPost);
    expect(subjectProp.discriminatorMap!.forum).toBe(ForumPost);
  });

  test('stores custom discriminator value for BlogPost', async () => {
    const post = new BlogPost('My Blog Post');

    const activity = orm.em.create(Activity, {
      action: 'created',
      subject: post,
    });

    await orm.em.flush();
    orm.em.clear();

    const connection = orm.em.getConnection();
    const [row] = await connection.execute('SELECT * FROM activity WHERE id = ?', [activity.id]);

    expect(row.subject_type).toBe('blog');
    expect(row.subject_id).toBe(post.id);
  });

  test('stores custom discriminator value for ForumPost', async () => {
    const post = new ForumPost('Forum discussion');
    const activity = orm.em.create(Activity, {
      action: 'commented',
      subject: post,
    });

    await orm.em.flush();
    orm.em.clear();

    const connection = orm.em.getConnection();
    const [row] = await connection.execute('SELECT * FROM activity WHERE id = ?', [activity.id]);

    // Should use custom value 'forum' instead of table name 'forum_post'
    expect(row.subject_type).toBe('forum');
    expect(row.subject_id).toBe(post.id);
  });

  test('hydrates correctly using custom discriminator values', async () => {
    const blogPost = new BlogPost('Blog');
    const forumPost = new ForumPost('Forum');
    const blogActivity = orm.em.create(Activity, { action: 'like', subject: blogPost });
    const forumActivity = orm.em.create(Activity, { action: 'share', subject: forumPost });

    await orm.em.flush();
    orm.em.clear();

    const loadedBlogActivity = await orm.em.findOneOrFail(Activity, { id: blogActivity.id });
    const loadedForumActivity = await orm.em.findOneOrFail(Activity, { id: forumActivity.id });

    expect(loadedBlogActivity.subject).toBeInstanceOf(BlogPost);
    expect(loadedForumActivity.subject).toBeInstanceOf(ForumPost);

    await orm.em.populate([loadedBlogActivity, loadedForumActivity], ['subject']);

    expect((loadedBlogActivity.subject as BlogPost).title).toBe('Blog');
    expect((loadedForumActivity.subject as ForumPost).content).toBe('Forum');
  });

  test('inverse collections work with custom discriminator', async () => {
    const blogPost = new BlogPost('My Post');
    const a1 = orm.em.create(Activity, { action: 'view', subject: blogPost });
    const a2 = orm.em.create(Activity, { action: 'like', subject: blogPost });

    await orm.em.flush();
    orm.em.clear();

    const loadedPost = await orm.em.findOneOrFail(
      BlogPost,
      { id: blogPost.id },
      { populate: ['activities'] },
    );

    expect(loadedPost.activities).toHaveLength(2);
    expect(loadedPost.activities.getItems().map(a => a.action).sort()).toEqual(['like', 'view']);
  });

  test('updating between different types with custom discriminator', async () => {
    const blogPost = new BlogPost('Blog');
    const forumPost = new ForumPost('Forum');
    const activity = orm.em.create(Activity, { action: 'test', subject: blogPost });
    orm.em.persist(forumPost);

    await orm.em.flush();
    orm.em.clear();

    const loadedActivity = await orm.em.findOneOrFail(Activity, { id: activity.id });
    const loadedForumPost = await orm.em.findOneOrFail(ForumPost, { id: forumPost.id });

    loadedActivity.subject = loadedForumPost;

    await orm.em.flush();
    orm.em.clear();

    const connection = orm.em.getConnection();
    const [row] = await connection.execute('SELECT * FROM activity WHERE id = ?', [activity.id]);

    expect(row.subject_type).toBe('forum');
    expect(row.subject_id).toBe(forumPost.id);
  });

  test('discriminator map prevents using table names directly', async () => {
    // Insert data with table name instead of custom value
    const connection = orm.em.getConnection();
    await connection.execute(
      "INSERT INTO blog_post (id, title) VALUES (1, 'Test')",
    );
    await connection.execute(
      "INSERT INTO activity (id, action, subject_type, subject_id) VALUES (1, 'test', 'blog_post', 1)",
    );

    // When we try to load, it should throw an error because
    // 'blog_post' is not in the discriminator map (only 'blog' and 'forum' are valid)
    await expect(
      orm.em.findOne(Activity, { id: 1 }),
    ).rejects.toThrow(/Unknown discriminator value 'blog_post' for polymorphic relation 'subject'/);
  });

});
