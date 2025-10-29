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
    test.todo('tableNamingStrategy');
    test('columnNamingStrategy', async () => {
      const orm = MikroORM.initSync({
        entities: [User, UserProfile],
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
      ).toMatchInlineSnapshot(`"insert into "user" ("id", "email", "firstName", "lastName") values (?, ?, ?, ?)"`);

      expect(
        kysely.selectFrom('user as u').select(['u.email', 'u.firstName']).compile().sql,
      ).toMatchInlineSnapshot(`"select "u"."email", "u"."firstName" from "user" as "u""`);

      expect(
        kysely.selectFrom('user').select(['email', 'user.firstName as name']).compile().sql,
      ).toMatchInlineSnapshot(`"select "email", "user"."firstName" as "name" from "user""`);

      expect(
        kysely.selectFrom('user').selectAll().where('id', '=', 1).compile().sql,
      ).toMatchInlineSnapshot(`"select * from "user" where "id" = ?"`);

      expect(
        kysely.selectFrom('user').selectAll().orderBy('firstName').limit(10).compile().sql,
      ).toMatchInlineSnapshot(`"select * from "user" order by "firstName" limit ?"`);

      expect(
        kysely.updateTable('user').set({
          email: 'newemail@example.com',
          firstName: 'Jane',
        }).where('id', '=', 1).returning('lastName').compile().sql,
      ).toMatchInlineSnapshot(`"update "user" set "email" = ?, "firstName" = ? where "id" = ? returning "lastName""`);

      expect(
        kysely.deleteFrom('user').where('id', '=', 2).compile().sql,
      ).toMatchInlineSnapshot(`"delete from "user" where "id" = ?"`);
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
