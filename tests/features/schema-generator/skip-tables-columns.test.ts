import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'users' })
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  email!: string;

  @Property()
  password!: string;

  @Property({ nullable: true })
  phone?: string;

}

@Entity({ tableName: 'posts' })
class Post {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @Property()
  content!: string;

  @Property()
  userId!: number;

}

@Entity({ tableName: 'comments' })
class Comment {

  @PrimaryKey()
  id!: number;

  @Property()
  text!: string;

  @Property()
  postId!: number;

}

let orm: MikroORM;

afterAll(() => orm?.close());

describe('SchemaGenerator skipTables and skipColumns', () => {

  test('should skip tables specified in skipTables option', async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [User, Post, Comment],
      schemaGenerator: {
        skipTables: ['posts', 'comments'],
      },
    });

    const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });

    // Should contain user table
    expect(sql).toContain('create table `users`');

    // Should not contain posts or comments tables
    expect(sql).not.toContain('create table `posts`');
    expect(sql).not.toContain('create table `comments`');

    await orm.close();
  });

  test('should skip columns specified in skipColumns option', async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [User, Post, Comment],
      schemaGenerator: {
        skipColumns: {
          users: ['password', 'phone'],
          posts: ['content'],
        },
      },
    });

    const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });

    // Should contain users table with name and email but not password or phone
    expect(sql).toContain('create table `users`');
    expect(sql).toContain('`name` text not null');
    expect(sql).toContain('`email` text not null');
    expect(sql).not.toContain('`password`');
    expect(sql).not.toContain('`phone`');

    // Should contain posts table with title and userId but not content
    expect(sql).toContain('create table `posts`');
    expect(sql).toContain('`title` text not null');
    expect(sql).toContain('`user_id` integer not null');
    expect(sql).not.toContain('`content`');

    // Should contain comments table normally (no skipColumns specified)
    expect(sql).toContain('create table `comments`');
    expect(sql).toContain('`text` text not null');
    expect(sql).toContain('`post_id` integer not null');

    await orm.close();
  });

  test('should support regex patterns in skipTables', async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [User, Post, Comment],
      schemaGenerator: {
        skipTables: [/^(posts|comments)$/],
      },
    });

    const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });

    // Should contain user table
    expect(sql).toContain('create table `users`');

    // Should not contain posts or comments tables (matched by regex)
    expect(sql).not.toContain('create table `posts`');
    expect(sql).not.toContain('create table `comments`');

    await orm.close();
  });

  test('should support regex patterns in skipColumns', async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [User, Post, Comment],
      schemaGenerator: {
        skipColumns: {
          users: [/^(password|phone)$/],
        },
      },
    });

    const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });

    // Should contain users table with name and email but not password or phone
    expect(sql).toContain('create table `users`');
    expect(sql).toContain('`name` text not null');
    expect(sql).toContain('`email` text not null');
    expect(sql).not.toContain('`password`');
    expect(sql).not.toContain('`phone`');

    await orm.close();
  });

  test('should work with both skipTables and skipColumns together', async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [User, Post, Comment],
      schemaGenerator: {
        skipTables: ['comments'],
        skipColumns: {
          users: ['password'],
          posts: ['content'],
        },
      },
    });

    const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });

    // Should contain users table without password
    expect(sql).toContain('create table `users`');
    expect(sql).toContain('`name` text not null');
    expect(sql).toContain('`email` text not null');
    expect(sql).toContain('`phone` text null');
    expect(sql).not.toContain('`password`');

    // Should contain posts table without content
    expect(sql).toContain('create table `posts`');
    expect(sql).toContain('`title` text not null');
    expect(sql).toContain('`user_id` integer not null');
    expect(sql).not.toContain('`content`');

    // Should not contain comments table
    expect(sql).not.toContain('create table `comments`');

    await orm.close();
  });

});
