import { defineEntity, p } from '@mikro-orm/core';
import { InferDBFromKysely, InferKyselyDB } from '@mikro-orm/knex';
import { MikroORM } from '@mikro-orm/sqlite';

describe('InferKyselyDB', () => {
  test('infer table and column', async () => {
    const User = defineEntity({
      name: 'User',
      properties: {
        fullName: p.string().primary(),
        email: p.string().nullable(),
        firstName: p.string(),
        lastName: p.string().fieldName('the_last_name'),
        profile: () => p.oneToOne(UserProfile),
      },
    });

    const UserProfile = defineEntity({
      name: 'UserProfile',
      properties: {
        user: () => p.oneToOne(User).owner(true).primary(),
        bio: p.string().nullable(),
        avatar: p.string().nullable(),
        location: p.string().nullable(),
      },
    });

    const Post = defineEntity({
      name: 'Post',
      properties: {
        id: p.integer().primary().autoincrement(),
        title: p.string(),
        description: p.text(),
        author: () => p.manyToOne(User),
      },
    });

    const orm = MikroORM.initSync({
      entities: [User, UserProfile, Post],
      dbName: ':memory:',
    });

    const generator = orm.schema;
    const createDump = await generator.getCreateSchemaSQL();
    expect(createDump).toMatchInlineSnapshot(`
      "create table \`user_profile\` (\`user_full_name\` text not null primary key, \`bio\` text null, \`avatar\` text null, \`location\` text null, constraint \`user_profile_user_full_name_foreign\` foreign key (\`user_full_name\`) references \`user\` (\`full_name\`) on update cascade on delete cascade);

      create table \`user\` (\`full_name\` text not null primary key, \`email\` text null, \`first_name\` text not null, \`the_last_name\` text not null, \`profile_user_full_name\` text not null, constraint \`user_profile_user_full_name_foreign\` foreign key (\`profile_user_full_name\`) references \`user_profile\` (\`user_full_name\`) on update cascade);
      create unique index \`user_profile_user_full_name_unique\` on \`user\` (\`profile_user_full_name\`);

      create table \`post\` (\`id\` integer not null primary key autoincrement, \`title\` text not null, \`description\` text not null, \`author_full_name\` text not null, constraint \`post_author_full_name_foreign\` foreign key (\`author_full_name\`) references \`user\` (\`full_name\`) on update cascade);
      create index \`post_author_full_name_index\` on \`post\` (\`author_full_name\`);
      "
    `);

    type KyselyDB = InferKyselyDB<typeof User | typeof UserProfile | typeof Post, {}>;
    type UserTable = KyselyDB['user'];
    expectTypeOf<UserTable>().toEqualTypeOf<{
      full_name: string;
      email: string | null;
      first_name: string;
      the_last_name: string;
    }>();
    type UserProfileTable = KyselyDB['user_profile'];
    expectTypeOf<UserProfileTable>().toEqualTypeOf<{
      user_full_name: string;
      bio: string | null;
      avatar: string | null;
      location: string | null;
  }>();
    type PostTable = KyselyDB['post'];
    expectTypeOf<PostTable>().toEqualTypeOf<{
      id: Generated<number>;
      title: string;
      description: string;
      author_full_name: string;
  }>();
  });

  test('infer pivot table', async () => {
    const User = defineEntity({
      name: 'User',
      properties: {
        name: p.string().primary(),
        email: p.string().nullable(),
        viewedPosts: () => p.manyToMany(Post).owner().pivotEntity(() => UserViewedPosts),
      },
    });

    const Post = defineEntity({
      name: 'Post',
      properties: {
        id: p.integer().primary().autoincrement(),
        title: p.string(),
        description: p.text(),
        author: () => p.manyToOne(User),
        viewers: () => p.manyToMany(User),
      },
    });

    const UserViewedPosts = defineEntity({
      name: 'UserViewedPosts',
      properties: {
        user: () => p.manyToOne(User).primary(),
        post: () => p.manyToOne(Post).primary(),
        viewedAt: p.datetime().onUpdate(() => new Date()),
      },
    });

    const orm = MikroORM.initSync({
      entities: [User, Post, UserViewedPosts],
      dbName: ':memory:',
    });
    const generator = orm.schema;
    const createDump = await generator.getCreateSchemaSQL();
    expect(createDump).toMatchInlineSnapshot(`
      "create table \`user\` (\`name\` text not null primary key, \`email\` text null);

      create table \`post\` (\`id\` integer not null primary key autoincrement, \`title\` text not null, \`description\` text not null, \`author_name\` text not null, constraint \`post_author_name_foreign\` foreign key (\`author_name\`) references \`user\` (\`name\`) on update cascade);
      create index \`post_author_name_index\` on \`post\` (\`author_name\`);

      create table \`post_viewers\` (\`post_id\` integer not null, \`user_name\` text not null, primary key (\`post_id\`, \`user_name\`), constraint \`post_viewers_post_id_foreign\` foreign key (\`post_id\`) references \`post\` (\`id\`) on update cascade on delete cascade, constraint \`post_viewers_user_name_foreign\` foreign key (\`user_name\`) references \`user\` (\`name\`) on update cascade on delete cascade);
      create index \`post_viewers_post_id_index\` on \`post_viewers\` (\`post_id\`);
      create index \`post_viewers_user_name_index\` on \`post_viewers\` (\`user_name\`);

      create table \`user_viewed_posts\` (\`user_name\` text not null, \`post_id\` integer not null, \`viewed_at\` datetime not null, primary key (\`user_name\`, \`post_id\`), constraint \`user_viewed_posts_user_name_foreign\` foreign key (\`user_name\`) references \`user\` (\`name\`) on update cascade, constraint \`user_viewed_posts_post_id_foreign\` foreign key (\`post_id\`) references \`post\` (\`id\`) on update cascade);
      create index \`user_viewed_posts_user_name_index\` on \`user_viewed_posts\` (\`user_name\`);
      create index \`user_viewed_posts_post_id_index\` on \`user_viewed_posts\` (\`post_id\`);
      "
    `);


    const kysely = orm.em.getKysely();
    type KyselyDB = InferDBFromKysely<typeof kysely>;
    type UserTable = KyselyDB['user'];
    expectTypeOf<UserTable>().toEqualTypeOf<{
      name: string;
      email: string | null;
    }>();
    type PostTable = KyselyDB['post'];
    expectTypeOf<PostTable>().toEqualTypeOf<{
      id: Generated<number>;
      title: string;
      description: string;
      author_name: string;
    }>();
    type UserViewedPostsTable = KyselyDB['user_viewed_posts'];
    expectTypeOf<UserViewedPostsTable>().toEqualTypeOf<{
      user_name: string;
      post_id: number;
      viewed_at: Date;
    }>();
  });

  describe('custom kysely plugin', () => {
    const User = defineEntity({
      name: 'User',
      properties: {
        id: p.integer().primary(),
        email: p.string().nullable(),
        firstName: p.string(),
        lastName: p.string().fieldName('the_last_name'),
        profile: () => p.oneToOne(UserProfile).nullable(),
      },
    });

    const UserProfile = defineEntity({
      name: 'UserProfile',
      properties: {
        user: () => p.oneToOne(User).owner(true).primary(),
        bio: p.string().nullable(),
        avatar: p.string().nullable(),
        location: p.string().nullable(),
      },
    });

    const Post = defineEntity({
      name: 'Post',
      properties: {
        id: p.integer().primary().autoincrement(),
        title: p.string(),
        description: p.text(),
        author: () => p.manyToOne(User),
      },
    });

    test('tableNamingStrategy: entity', async () => {
      const orm = MikroORM.initSync({
        entities: [User, UserProfile, Post],
        dbName: ':memory:',
      });
      await orm.getSchemaGenerator().createSchema();
      const kysely = orm.em.getKysely({
        tableNamingStrategy: 'entity',
      });

      // Basic SELECT query
      expect(kysely.selectFrom('User').selectAll().compile().sql).toMatchInlineSnapshot(`"select * from "user""`);

      // SELECT with specific columns
      expect(
        kysely.selectFrom('User').select(['id', 'email', 'first_name']).compile().sql,
      ).toMatchInlineSnapshot(`"select "id", "email", "first_name" from "user""`);

      // SELECT with WHERE clause
      expect(
        kysely.selectFrom('User').selectAll().where('id', '=', 1).compile().sql,
      ).toMatchInlineSnapshot(`"select * from "user" where "id" = ?"`);

      // SELECT with ORDER BY
      expect(
        kysely.selectFrom('User').selectAll().orderBy('id', 'asc').limit(10).compile().sql,
      ).toMatchInlineSnapshot(`"select * from "user" order by "id" asc limit ?"`);

      // SELECT with table alias
      expect(
        kysely.selectFrom('User as u').select(['u.id', 'u.email']).compile().sql,
      ).toMatchInlineSnapshot(`"select "u"."id", "u"."email" from "user" as "u""`);

      // INSERT query
      expect(
        kysely.insertInto('User').values({
          id: 1,
          email: 'john.doe@example.com',
          first_name: 'John',
          the_last_name: 'Doe',
        }).compile().sql,
      ).toMatchInlineSnapshot(`"insert into "user" ("id", "email", "first_name", "the_last_name") values (?, ?, ?, ?)"`);

      // UPDATE query
      expect(
        kysely.updateTable('User').set({
          email: 'newemail@example.com',
          first_name: 'Jane',
        }).where('id', '=', 1).compile().sql,
      ).toMatchInlineSnapshot(`"update "user" set "email" = ?, "first_name" = ? where "id" = ?"`);

      // UPDATE with RETURNING
      expect(
        kysely.updateTable('User').set({ email: 'test@example.com' }).where('id', '=', 1).returning(['id', 'email']).compile().sql,
      ).toMatchInlineSnapshot(`"update "user" set "email" = ? where "id" = ? returning "id", "email""`);

      // DELETE query
      expect(
        kysely.deleteFrom('User').where('id', '=', 1).compile().sql,
      ).toMatchInlineSnapshot(`"delete from "user" where "id" = ?"`);

      // DELETE with RETURNING
      expect(
        kysely.deleteFrom('User').where('id', '=', 1).returning(['id', 'email']).compile().sql,
      ).toMatchInlineSnapshot(`"delete from "user" where "id" = ? returning "id", "email""`);

      // INNER JOIN
      expect(
        kysely
          .selectFrom('Post as p')
          .innerJoin('User as u', 'p.author_id', 'u.id')
          .select(['p.title', 'u.email'])
          .compile().sql,
      ).toMatchInlineSnapshot(`"select "p"."title", "u"."email" from "post" as "p" inner join "user" as "u" on "p"."author_id" = "u"."id""`);

      // LEFT JOIN
      expect(
        kysely
          .selectFrom('User as u')
          .leftJoin('UserProfile as up', 'u.id', 'up.user_id')
          .select(['u.email', 'up.bio'])
          .compile().sql,
      ).toMatchInlineSnapshot(`"select "u"."email", "up"."bio" from "user" as "u" left join "user_profile" as "up" on "u"."id" = "up"."user_id""`);

      // Multiple JOINs
      expect(
        kysely
          .selectFrom('Post as p')
          .innerJoin('User as u', 'p.author_id', 'u.id')
          .leftJoin('UserProfile as up', 'u.id', 'up.user_id')
          .select(['p.title', 'u.email', 'up.bio'])
          .compile().sql,
      ).toMatchInlineSnapshot(`"select "p"."title", "u"."email", "up"."bio" from "post" as "p" inner join "user" as "u" on "p"."author_id" = "u"."id" left join "user_profile" as "up" on "u"."id" = "up"."user_id""`);

      // JOIN with WHERE condition
      expect(
        kysely
          .selectFrom('Post as p')
          .innerJoin('User as u', 'p.author_id', 'u.id')
          .where('u.email', '=', 'test@example.com')
          .select(['p.title'])
          .compile().sql,
      ).toMatchInlineSnapshot(`"select "p"."title" from "post" as "p" inner join "user" as "u" on "p"."author_id" = "u"."id" where "u"."email" = ?"`);

      // Subquery in WHERE clause
      expect(
        kysely
          .selectFrom('User')
          .selectAll()
          .where('id', 'in', eb =>
            eb.selectFrom('Post')
              .select('author_id')
              .where('title', 'like', '%test%'),
          )
          .compile().sql,
      ).toMatchInlineSnapshot(`"select * from "user" where "id" in (select "author_id" from "post" where "title" like ?)"`);

      // Subquery in SELECT clause
      expect(
        kysely
          .selectFrom('User as u')
          .select([
            'u.email',
            eb =>
              eb.selectFrom('Post')
                .select(eb => eb.fn.count('id').as('count'))
                .whereRef('author_id', '=', 'u.id')
                .as('postCount'),
          ])
          .compile().sql,
      ).toMatchInlineSnapshot(`"select "u"."email", (select count("id") as "count" from "post" where "author_id" = "u"."id") as "postCount" from "user" as "u""`);

      // EXISTS subquery
      expect(
        kysely
          .selectFrom('User')
          .selectAll()
          .where(eb => eb.exists(
            eb.selectFrom('Post')
              .select('id')
              .whereRef('author_id', '=', 'User.id')
              .where('title', 'like', '%test%'),
          ))
          .compile().sql,
      ).toMatchInlineSnapshot(`"select * from "user" where exists (select "id" from "post" where "author_id" = "user"."id" and "title" like ?)"`);

      // CTE (Common Table Expression)
      expect(
        kysely
          .with('active_users', db =>
            db.selectFrom('User')
              .select(['id', 'email'])
              .where('email', 'is not', null),
          )
          .selectFrom('active_users')
          .selectAll()
          .compile().sql,
      ).toMatchInlineSnapshot(`"with "active_users" as (select "id", "email" from "user" where "email" is not null) select * from "active_users""`);

      // Multiple CTEs
      expect(
        kysely
          .with('user_stats', db =>
            db.selectFrom('User')
              .select(['id', 'email'])
              .where('email', 'is not', null),
          )
          .with('post_stats', db =>
            db.selectFrom('Post')
              .select(['author_id', eb => eb.fn.count('id').as('count')])
              .groupBy('author_id'),
          )
          .selectFrom('user_stats as us')
          .leftJoin('post_stats as ps', 'us.id', 'ps.author_id')
          .select(['us.email', 'ps.count'])
          .compile().sql,
      ).toMatchInlineSnapshot(`"with "user_stats" as (select "id", "email" from "user" where "email" is not null), "post_stats" as (select "author_id", count("id") as "count" from "post" group by "author_id") select "us"."email", "ps"."count" from "user_stats" as "us" left join "post_stats" as "ps" on "us"."id" = "ps"."author_id""`);

      // All entity names should work
      expect(kysely.selectFrom('UserProfile').selectAll().compile().sql).toMatchInlineSnapshot(`"select * from "user_profile""`);
      expect(kysely.selectFrom('Post').selectAll().compile().sql).toMatchInlineSnapshot(`"select * from "post""`);
    });

    test('columnNamingStrategy: property', async () => {
      const orm = MikroORM.initSync({
        entities: [User, UserProfile, Post],
        dbName: ':memory:',
      });
      await orm.getSchemaGenerator().createSchema();
      const kysely = orm.em.getKysely({
        columnNamingStrategy: 'property',
      });

      expect(
        kysely.insertInto('user').values({
          id: 1,
          email: 'john.doe@example.com',
          firstName: 'John',
          lastName: 'Doe',
        }).compile().sql,
      ).toMatchInlineSnapshot(`"insert into "user" ("id", "email", "first_name", "the_last_name") values (?, ?, ?, ?)"`);

      expect(
        kysely.selectFrom('user as u').select(['u.email', 'u.firstName']).compile().sql,
      ).toMatchInlineSnapshot(`"select "u"."email", "u"."first_name" from "user" as "u""`);

      expect(
        kysely.selectFrom('user').select(['email', 'user.firstName as name']).compile().sql,
      ).toMatchInlineSnapshot(`"select "email", "user"."first_name" as "name" from "user""`);

      expect(
        kysely.selectFrom('user').selectAll().where('id', '=', 1).compile().sql,
      ).toMatchInlineSnapshot(`"select * from "user" where "id" = ?"`);

      expect(
        kysely.selectFrom('user').selectAll().orderBy('firstName').limit(10).compile().sql,
      ).toMatchInlineSnapshot(`"select * from "user" order by "first_name" limit ?"`);

      expect(
        kysely.updateTable('user').set({
          email: 'newemail@example.com',
          firstName: 'Jane',
        }).where('id', '=', 1).returning('lastName').compile().sql,
      ).toMatchInlineSnapshot(`"update "user" set "email" = ?, "first_name" = ? where "id" = ? returning "the_last_name""`);

      expect(
        kysely.deleteFrom('user').where('firstName', 'like', '%John%').compile().sql,
      ).toMatchInlineSnapshot(`"delete from "user" where "first_name" like ?"`);


      expect(
        kysely
          .selectFrom('post')
          .select(['author'])
          .compile().sql,
      ).toMatchInlineSnapshot(`"select "author_id" from "post""`);
    });

    test('columnNamingStrategy with JOIN', async () => {
      const orm = MikroORM.initSync({
        entities: [User, UserProfile, Post],
        dbName: ':memory:',
      });
      await orm.getSchemaGenerator().createSchema();
      const kysely = orm.em.getKysely({
        columnNamingStrategy: 'property',
      });

      // Test INNER JOIN
      expect(
        kysely
          .selectFrom('post as p')
          .innerJoin('user as u', 'p.author', 'u.id')
          .select(['p.title', 'u.firstName', 'u.lastName'])
          .compile().sql,
      ).toMatchInlineSnapshot(`"select "p"."title", "u"."first_name", "u"."the_last_name" from "post" as "p" inner join "user" as "u" on "p"."author_id" = "u"."id""`);

      // Test LEFT JOIN
      expect(
        kysely
          .selectFrom('user as u')
          .leftJoin('user_profile as up', 'u.id', 'up.user')
          .select(['u.firstName', 'u.email', 'up.bio'])
          .compile().sql,
      ).toMatchInlineSnapshot(`"select "u"."first_name", "u"."email", "up"."bio" from "user" as "u" left join "user_profile" as "up" on "u"."id" = "up"."user_id""`);

      // Test JOIN with WHERE condition using property names
      expect(
        kysely
          .selectFrom('post as p')
          .innerJoin('user as u', 'p.author', 'u.id')
          .where('u.firstName', '=', 'John')
          .select(['p.title', 'u.email'])
          .compile().sql,
      ).toMatchInlineSnapshot(`"select "p"."title", "u"."email" from "post" as "p" inner join "user" as "u" on "p"."author_id" = "u"."id" where "u"."first_name" = ?"`);

      // Test multiple JOINs
      expect(
        kysely
          .selectFrom('post as p')
          .innerJoin('user as u', 'p.author', 'u.id')
          .leftJoin('user_profile as up', 'u.id', 'up.user')
          .select(['p.title', 'u.firstName', 'up.bio'])
          .compile().sql,
      ).toMatchInlineSnapshot(`"select "p"."title", "u"."first_name", "up"."bio" from "post" as "p" inner join "user" as "u" on "p"."author_id" = "u"."id" left join "user_profile" as "up" on "u"."id" = "up"."user_id""`);

      // Test JOIN with ORDER BY using property names
      expect(
        kysely
          .selectFrom('post as p')
          .innerJoin('user as u', 'p.author', 'u.id')
          .orderBy('u.firstName', 'asc')
          .select(['p.title'])
          .compile().sql,
      ).toMatchInlineSnapshot(`"select "p"."title" from "post" as "p" inner join "user" as "u" on "p"."author_id" = "u"."id" order by "u"."first_name" asc"`);
    });

    test('columnNamingStrategy with subqueries', async () => {
      const orm = MikroORM.initSync({
        entities: [User, UserProfile, Post],
        dbName: ':memory:',
      });
      await orm.getSchemaGenerator().createSchema();
      const kysely = orm.em.getKysely({
        columnNamingStrategy: 'property',
      });

      // Test subquery in WHERE clause
      expect(
        kysely
          .selectFrom('user')
          .selectAll()
          .where('id', 'in', eb =>
            eb.selectFrom('post')
              .select('author')
              .where('title', 'like', '%test%'),
          )
          .compile().sql,
      ).toMatchInlineSnapshot(`"select * from "user" where "id" in (select "author_id" from "post" where "title" like ?)"`);

      // Test subquery in SELECT clause
      expect(
        kysely
          .selectFrom('user as u')
          .select([
            'u.firstName',
            eb =>
              eb.selectFrom('post')
                .select(eb => eb.fn.count('id').as('count'))
                .whereRef('author', '=', 'u.id')
                .as('postCount'),
          ])
          .compile().sql,
      ).toMatchInlineSnapshot(`"select "u"."first_name", (select count("id") as "count" from "post" where "author_id" = "u"."id") as "postCount" from "user" as "u""`);

      // Test subquery with JOIN
      expect(
        kysely
          .selectFrom('user as u')
          .leftJoin(
            eb =>
              eb.selectFrom('post')
                .select(['author', eb => eb.fn.count('id').as('count')])
                .groupBy('author')
                .as('post_stats'),
            join => join.onRef('post_stats.author', '=', 'u.id'),
          )
          .select(['u.firstName', 'post_stats.count'])
          .compile().sql,
      ).toMatchInlineSnapshot(`"select "u"."first_name", "post_stats"."count" from "user" as "u" left join (select "author_id", count("id") as "count" from "post" group by "author_id") as "post_stats" on "post_stats"."author_id" = "u"."id""`);

      // Test EXISTS subquery
      expect(
        kysely
          .selectFrom('user')
          .selectAll()
          .where(eb => eb.exists(
            eb.selectFrom('post')
              .select('id')
              .whereRef('author', '=', 'user.id')
              .where('title', 'like', '%test%'),
          ))
          .compile().sql,
      ).toMatchInlineSnapshot(`"select * from "user" where exists (select "id" from "post" where "author_id" = "user"."id" and "title" like ?)"`);
    });

    test('columnNamingStrategy with CTE', async () => {
      const orm = MikroORM.initSync({
        entities: [User, UserProfile, Post],
        dbName: ':memory:',
      });
      await orm.getSchemaGenerator().createSchema();
      const kysely = orm.em.getKysely({
        columnNamingStrategy: 'property',
      });

      // Test CTE with JOIN
      expect(
        kysely
          .with('user_posts', db =>
            db.selectFrom('post as p')
              .innerJoin('user as u', 'p.author', 'u.id')
              .select(['p.id', 'p.title', 'u.firstName as authorName']),
          )
          .selectFrom('user_posts')
          .selectAll()
          .where('authorName', 'like', '%John%')
          .compile().sql,
      ).toMatchInlineSnapshot(`"with "user_posts" as (select "p"."id", "p"."title", "u"."first_name" as "authorName" from "post" as "p" inner join "user" as "u" on "p"."author_id" = "u"."id") select * from "user_posts" where "authorName" like ?"`);

      // Test multiple CTEs
      expect(
        kysely
          .with('user_stats', db =>
            db.selectFrom('user')
              .select(['id', 'firstName'])
              .where('email', 'is not', null),
          )
          .with('post_stats', db =>
            db.selectFrom('post')
              .select(['author', eb => eb.fn.count('id').as('count')])
              .groupBy('author'),
          )
          .selectFrom('user_stats as us')
          .leftJoin('post_stats as ps', 'us.id', 'ps.author')
          .select(['us.firstName', 'ps.count'])
          .compile().sql,
      ).toMatchInlineSnapshot(`"with "user_stats" as (select "id", "first_name" from "user" where "email" is not null), "post_stats" as (select "author_id", count("id") as "count" from "post" group by "author_id") select "us"."first_name", "ps"."count" from "user_stats" as "us" left join "post_stats" as "ps" on "us"."id" = "ps"."author_id""`);

      // Test recursive CTE (if supported)
      expect(
        kysely
          .withRecursive('user_hierarchy', db =>
            db.selectFrom('user')
              .select(['id', 'firstName'])
              .where('id', '=', 1)
              .unionAll(db =>
                db.selectFrom('user as u')
                  .innerJoin('user_hierarchy as uh', 'u.id', 'uh.id')
                  .select(['u.id', 'u.firstName']),
              ),
          )
          .selectFrom('user_hierarchy')
          .selectAll()
          .compile().sql,
      ).toMatchInlineSnapshot(`"with recursive "user_hierarchy" as (select "id", "first_name" from "user" where "id" = ? union all select "u"."id", "u"."first_name" from "user" as "u" inner join "user_hierarchy" as "uh" on "u"."id" = "uh"."id") select * from "user_hierarchy""`);

      // Test simple CTE
      expect(
        kysely
          .with('active_users', db =>
            db.selectFrom('user')
              .select(['id', 'firstName', 'email'])
              .where('email', 'is not', null),
          )
          .selectFrom('active_users')
          .selectAll()
          .orderBy('firstName')
          .compile().sql,
      ).toMatchInlineSnapshot(`"with "active_users" as (select "id", "first_name", "email" from "user" where "email" is not null) select * from "active_users" order by "first_name""`);

    });

    test.todo('processOnCreateHooks');
    test.todo('processOnUpdateHooks');
  });
});

interface Generated<T> {
  readonly __select__: T;
  readonly __insert__: T | undefined;
  readonly __update__: T;
}
