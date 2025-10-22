import { defineEntity, p } from '@mikro-orm/core';
import { InferKyselyDB } from '@mikro-orm/knex';
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

    type KyselyDB = InferKyselyDB<[typeof User, typeof UserProfile, typeof Post]>;
    type UserTable = KyselyDB['user'];

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
});

interface Generated<T> {
  readonly __select__: T;
  readonly __insert__: T | undefined;
  readonly __update__: T;
}
