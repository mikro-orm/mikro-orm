import { Entity, MikroORM, ObjectId, PrimaryKey, Property, SerializedPrimaryKey } from '@mikro-orm/mongodb';
import { initORMMongo } from '../../bootstrap';

@Entity({ collection: 'users' })
export class User {
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
export class Post {
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

describe('MongoDB optimistic locking', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await initORMMongo(false, {
      entities: [User, Post],
      dbName: 'mikro_orm_test_mongodb_version',
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
});