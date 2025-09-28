import { Entity, MikroORM, ObjectId, PrimaryKey, Property, SerializedPrimaryKey } from '@mikro-orm/mongodb';

@Entity({ collection: 'users' })
class User {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property({ unique: true, nullable: true })
  email?: string;

  @Property({ nullable: true })
  dateOfBirth?: Date;

  @Property({ unique: true, nullable: true })
  phoneNumber?: string;

  @Property({ version: true })
  version!: number;

  constructor(data?: { email?: string; dateOfBirth?: Date; phoneNumber?: string }) {
    if (data) {
      this.email = data.email;
      this.dateOfBirth = data.dateOfBirth;
      this.phoneNumber = data.phoneNumber;
    }
  }

}

@Entity({ collection: 'posts' })
class Post {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  title!: string;

  @Property({ version: true })
  version!: Date;

  constructor(data?: { title?: string }) {
    if (data?.title) {
      this.title = data.title;
    }
  }

}

@Entity({ collection: 'no_version_entities' })
class NoVersionEntity {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  name!: string;

}

describe('MongoDB optimistic locking', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User, Post, NoVersionEntity],
      dbName: 'mikro_orm_test_mongodb_version',
      ensureIndexes: false,
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  beforeEach(async () => {
    await orm.schema.clearDatabase();
  });

  test('version field should be persisted on insert (numeric version)', async () => {
    const user = new User({
      email: 'test@example.com',
      phoneNumber: '+1234567890',
    });

    await orm.em.persistAndFlush(user);
    orm.em.clear();

    const savedUser = await orm.em.findOneOrFail(User, { email: 'test@example.com' });
    expect(savedUser.version).toBe(1);
    expect(savedUser.email).toBe('test@example.com');
    expect(savedUser.phoneNumber).toBe('+1234567890');
  });

  test('version field should be persisted on insert (date version)', async () => {
    const post = new Post({ title: 'Test Post' });
    const beforeTime = new Date();

    await orm.em.persistAndFlush(post);
    orm.em.clear();

    const savedPost = await orm.em.findOneOrFail(Post, { title: 'Test Post' });
    expect(savedPost.version).toBeInstanceOf(Date);
    expect(savedPost.version.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(savedPost.title).toBe('Test Post');
  });

  test('version field should be incremented on update (numeric version)', async () => {
    const user = new User({
      email: 'update-test@example.com',
      phoneNumber: '+1111111111',
    });

    await orm.em.persistAndFlush(user);
    expect(user.version).toBe(1);

    user.email = 'updated@example.com';
    await orm.em.flush();
    expect(user.version).toBe(2); // Should be incremented

    orm.em.clear();
    const updatedUser = await orm.em.findOneOrFail(User, { phoneNumber: '+1111111111' });
    expect(updatedUser.version).toBe(2);
    expect(updatedUser.email).toBe('updated@example.com');
  });

  test('version field should be updated on update (date version)', async () => {
    const post = new Post({ title: 'Update Test Post' });
    await orm.em.persistAndFlush(post);

    const originalVersion = post.version;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    post.title = 'Updated Post Title';
    await orm.em.flush();

    expect(post.version.getTime()).toBeGreaterThan(originalVersion.getTime());

    orm.em.clear();
    const updatedPost = await orm.em.findOneOrFail(Post, { title: 'Updated Post Title' });
    expect(updatedPost.version.getTime()).toBeGreaterThan(originalVersion.getTime());
  });

  test('optimistic locking should prevent concurrent updates (numeric version)', async () => {
    const user = new User({
      email: 'concurrent-test@example.com',
      phoneNumber: '+2222222222',
    });

    await orm.em.persistAndFlush(user);

    const em1 = orm.em.fork();
    const em2 = orm.em.fork();

    const user1 = await em1.findOneOrFail(User, { email: 'concurrent-test@example.com' });
    const user2 = await em2.findOneOrFail(User, { email: 'concurrent-test@example.com' });

    user1.phoneNumber = '+3333333333';
    user2.phoneNumber = '+4444444444';

    // First update should succeed
    await em1.flush();

    // Second update should fail due to version mismatch
    await expect(em2.flush()).rejects.toThrow('The optimistic lock on entity User failed');
  });

  test('optimistic locking should prevent concurrent updates (date version)', async () => {
    const post = new Post({ title: 'Concurrent Test Post' });
    await orm.em.persistAndFlush(post);

    const em1 = orm.em.fork();
    const em2 = orm.em.fork();

    const post1 = await em1.findOneOrFail(Post, { title: 'Concurrent Test Post' });
    const post2 = await em2.findOneOrFail(Post, { title: 'Concurrent Test Post' });

    post1.title = 'Updated by EM1';
    post2.title = 'Updated by EM2';

    // First update should succeed
    await em1.flush();

    // Second update should fail due to version mismatch
    await expect(em2.flush()).rejects.toThrow('The optimistic lock on entity Post failed');
  });

  test('version field should not be overridden if manually set (numeric version)', async () => {
    const user = new User({
      email: 'manual-version@example.com',
      phoneNumber: '+5555555555',
    });

    // Manually set version (should be ignored during insert)
    user.version = 99;

    await orm.em.persistAndFlush(user);

    // Version should still be 1 (auto-initialized, manual value ignored)
    expect(user.version).toBe(1);

    orm.em.clear();
    const savedUser = await orm.em.findOneOrFail(User, { email: 'manual-version@example.com' });
    expect(savedUser.version).toBe(1);
  });

  test('version field should not be overridden if manually set (date version)', async () => {
    const manualDate = new Date('2020-01-01T00:00:00Z');
    const post = new Post({ title: 'Manual Version Post' });

    // Manually set version (should be ignored during insert)
    post.version = manualDate;

    const beforeTime = new Date();
    await orm.em.persistAndFlush(post);

    // Version should be auto-initialized, not the manual value
    expect(post.version.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(post.version.getTime()).not.toBe(manualDate.getTime());

    orm.em.clear();
    const savedPost = await orm.em.findOneOrFail(Post, { title: 'Manual Version Post' });
    expect(savedPost.version.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(savedPost.version.getTime()).not.toBe(manualDate.getTime());
  });

  test('insertMany should initialize version fields for all entities', async () => {
    const users = [
      new User({ email: 'bulk1@example.com', phoneNumber: '+1111111111' }),
      new User({ email: 'bulk2@example.com', phoneNumber: '+2222222222' }),
      new User({ email: 'bulk3@example.com', phoneNumber: '+3333333333' }),
    ];

    await orm.em.persistAndFlush(users);
    orm.em.clear();

    const savedUsers = await orm.em.find(User, { email: { $in: ['bulk1@example.com', 'bulk2@example.com', 'bulk3@example.com'] } });
    expect(savedUsers).toHaveLength(3);

    savedUsers.forEach(user => {
      expect(user.version).toBe(1);
    });
  });

  test('entities without version property should not be affected', async () => {
    const entity = new NoVersionEntity();
    entity.name = 'Test Entity';

    await orm.em.persistAndFlush(entity);
    expect((entity as any).version).toBeUndefined();

    entity.name = 'Updated Test Entity';
    await orm.em.flush();
    expect((entity as any).version).toBeUndefined();
  });

  test('concurrent updates with different fields should still respect version locking', async () => {
    const user = new User({
      email: 'field-test@example.com',
      phoneNumber: '+9999999999',
    });

    await orm.em.persistAndFlush(user);

    const em1 = orm.em.fork();
    const em2 = orm.em.fork();

    const user1 = await em1.findOneOrFail(User, { email: 'field-test@example.com' });
    const user2 = await em2.findOneOrFail(User, { email: 'field-test@example.com' });

    // Update different fields
    user1.email = 'updated-by-em1@example.com';
    user2.phoneNumber = '+8888888888';

    // First update should succeed
    await em1.flush();
    expect(user1.version).toBe(2);

    // Second update should fail despite updating a different field
    await expect(em2.flush()).rejects.toThrow('The optimistic lock on entity User failed');
  });

  test('bulk updates with em.flush should handle version properties (numeric version)', async () => {
    const users = [
      new User({ email: 'bulk-update1@example.com', phoneNumber: '+1111111111' }),
      new User({ email: 'bulk-update2@example.com', phoneNumber: '+2222222222' }),
      new User({ email: 'bulk-update3@example.com', phoneNumber: '+3333333333' }),
    ];

    await orm.em.persistAndFlush(users);
    orm.em.clear();

    // Load users into context and modify them
    const loadedUsers = await orm.em.find(User, {
      email: { $in: ['bulk-update1@example.com', 'bulk-update2@example.com', 'bulk-update3@example.com'] },
    });

    expect(loadedUsers).toHaveLength(3);
    loadedUsers.forEach(user => expect(user.version).toBe(1));

    // Modify multiple entities in the same context
    loadedUsers.forEach((user, index) => {
      user.phoneNumber = `+999999999${index}`;
    });

    // Flush all changes - this should trigger bulk update with version handling
    await orm.em.flush();

    orm.em.clear();

    // Verify versions were incremented
    const updatedUsers = await orm.em.find(User, {
      email: { $in: ['bulk-update1@example.com', 'bulk-update2@example.com', 'bulk-update3@example.com'] },
    });

    updatedUsers.forEach((user, index) => {
      expect(user.version).toBe(2);
      expect(user.phoneNumber).toBe(`+999999999${index}`);
    });
  });

  test('bulk updates with em.flush should handle version properties (date version)', async () => {
    const posts = [
      new Post({ title: 'Bulk Update Post 1' }),
      new Post({ title: 'Bulk Update Post 2' }),
      new Post({ title: 'Bulk Update Post 3' }),
    ];

    await orm.em.persistAndFlush(posts);
    const originalVersions = posts.map(post => post.version);
    orm.em.clear();

    // Load posts into context and modify them
    const loadedPosts = await orm.em.find(Post, {
      title: { $in: ['Bulk Update Post 1', 'Bulk Update Post 2', 'Bulk Update Post 3'] },
    });

    expect(loadedPosts).toHaveLength(3);

    // Modify multiple entities in the same context
    loadedPosts.forEach((post, index) => {
      post.title = `Updated Bulk Post ${index + 1}`;
    });

    // Flush all changes - this should trigger bulk update with version handling
    await orm.em.flush();

    orm.em.clear();

    // Verify versions were updated with new timestamps
    const updatedPosts = await orm.em.find(Post, {
      title: { $in: ['Updated Bulk Post 1', 'Updated Bulk Post 2', 'Updated Bulk Post 3'] },
    });

    updatedPosts.forEach((post, index) => {
      expect(post.version.getTime()).toBeGreaterThan(originalVersions[index].getTime());
      expect(post.title).toBe(`Updated Bulk Post ${index + 1}`);
    });
  });

  test('bulk updates should fail for version mismatch with concurrent modifications', async () => {
    const users = [
      new User({ email: 'bulk-fail1@example.com', phoneNumber: '+1111111111' }),
      new User({ email: 'bulk-fail2@example.com', phoneNumber: '+2222222222' }),
    ];

    await orm.em.persistAndFlush(users);
    orm.em.clear();

    // Create two separate entity managers to simulate concurrent access
    const em1 = orm.em.fork();
    const em2 = orm.em.fork();

    // Load users in both entity managers
    const users1 = await em1.find(User, {
      email: { $in: ['bulk-fail1@example.com', 'bulk-fail2@example.com'] },
    });
    const users2 = await em2.find(User, {
      email: { $in: ['bulk-fail1@example.com', 'bulk-fail2@example.com'] },
    });

    expect(users1).toHaveLength(2);
    expect(users2).toHaveLength(2);

    // Modify users in the first entity manager and flush
    users1.forEach((user, index) => {
      user.phoneNumber = `+111111111${index}`;
    });
    await em1.flush(); // This should succeed and increment versions

    // Now try to modify users in the second entity manager
    users2.forEach((user, index) => {
      user.phoneNumber = `+999999999${index}`;
    });

    // This should fail due to optimistic lock version mismatch
    await expect(em2.flush()).rejects.toThrow('The optimistic lock on entity User failed');
  });
});
