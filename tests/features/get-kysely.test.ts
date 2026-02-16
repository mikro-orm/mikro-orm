import { defineEntity, p, PrimaryKeyProp, EntityName, Collection, Opt, MikroORM, InferClassEntityDB, InferDBFromKysely, InferKyselyDB, InferKyselyTable, MikroKyselyPluginOptions } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ManyToOne, OneToMany, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

describe('InferKyselyDB', () => {
  test('infer table and column', async () => {
    const User = defineEntity({
      name: 'User',
      tableName: 'users',
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

    const Book = defineEntity({
      name: 'Book',
      properties: {
        // tricky column names to verify SnakeCase vs UnderscoreNamingStrategy alignment
        ISBN: p.string().primary(),
        htmlContent: p.string(),
        userID: p.string(),
        XMLHttpRequestLog: p.string(),
        user2FAEnabled: p.boolean(),
        sslError: p.string(),
        title: p.string(),
      },
    });

    const orm = new MikroORM({
      entities: [User, UserProfile, Post, Book],
      dbName: ':memory:',
    });

    const generator = orm.schema;
    const createDump = await generator.getCreateSchemaSQL();
    expect(createDump).toMatchInlineSnapshot(`
      "create table \`book\` (\`isbn\` text not null primary key, \`html_content\` text not null, \`user_id\` text not null, \`xmlhttp_request_log\` text not null, \`user2faenabled\` integer not null, \`ssl_error\` text not null, \`title\` text not null);

      create table \`user_profile\` (\`user_full_name\` text not null primary key, \`bio\` text null, \`avatar\` text null, \`location\` text null, constraint \`user_profile_user_full_name_foreign\` foreign key (\`user_full_name\`) references \`users\` (\`full_name\`) on update cascade on delete cascade);

      create table \`users\` (\`full_name\` text not null primary key, \`email\` text null, \`first_name\` text not null, \`the_last_name\` text not null, \`profile_user_full_name\` text not null, constraint \`users_profile_user_full_name_foreign\` foreign key (\`profile_user_full_name\`) references \`user_profile\` (\`user_full_name\`));
      create unique index \`users_profile_user_full_name_unique\` on \`users\` (\`profile_user_full_name\`);

      create table \`post\` (\`id\` integer not null primary key autoincrement, \`title\` text not null, \`description\` text not null, \`author_full_name\` text not null, constraint \`post_author_full_name_foreign\` foreign key (\`author_full_name\`) references \`users\` (\`full_name\`));
      create index \`post_author_full_name_index\` on \`post\` (\`author_full_name\`);
      "
    `);

    type KyselyDB = InferKyselyDB<typeof User | typeof UserProfile | typeof Post | typeof Book, {}>;
    type UserTable = KyselyDB['users'];
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

    type BookTable = KyselyDB['book'];
    expectTypeOf<BookTable>().toEqualTypeOf<{
      isbn: string;
      html_content: string;
      user_id: string;
      xmlhttp_request_log: string;
      user2faenabled: NonNullable<boolean | null | undefined>;
      ssl_error: string;
      title: string;
    }>();
  });

  test('infer table with tableNamingStrategy: entity', async () => {
    const User = defineEntity({
      name: 'User',
      tableName: 'users',
      properties: {
        fullName: p.string().primary(),
      },
    });

    const UserProfile = defineEntity({
      name: 'UserProfile',
      tableName: 'user_profiles',
      properties: {
        user: () => p.oneToOne(User).owner(true).primary(),
        bio: p.string().nullable(),
        avatar: p.string().nullable(),
        location: p.string().nullable(),
      },
    });

    const kyselyOptions = {
      tableNamingStrategy: 'entity',
      columnNamingStrategy: 'property',
    } as const satisfies MikroKyselyPluginOptions;
    type KyselyDB = InferKyselyDB<typeof User | typeof UserProfile, typeof kyselyOptions>;

    expectTypeOf<KyselyDB>().toEqualTypeOf<{
      User: {
        fullName: string;
      };
      UserProfile: {
        user: string;
        bio: string | null;
        avatar: string | null;
        location: string | null;
      };
    }>();
  });

  test('infer table with tableNamingStrategy: table', async () => {
    const User = defineEntity({
      name: 'User',
      tableName: 'users',
      properties: {
        fullName: p.string().primary(),
      },
    });

    const UserProfile = defineEntity({
      name: 'UserProfile',
      tableName: 'user_profiles',
      properties: {
        user: () => p.oneToOne(User).owner(true).primary(),
        bio: p.string().nullable(),
        avatar: p.string().nullable(),
        location: p.string().nullable(),
      },
    });

    const kyselyOptions = {
      tableNamingStrategy: 'table',
      columnNamingStrategy: 'column',
    } as const satisfies MikroKyselyPluginOptions;
    type KyselyDB = InferKyselyDB<typeof User | typeof UserProfile, typeof kyselyOptions>;

    expectTypeOf<KyselyDB>().toEqualTypeOf<{
      users: {
        full_name: string;
      };
      user_profiles: {
        user_full_name: string;
        bio: string | null;
        avatar: string | null;
        location: string | null;
      };
    }>();
  });

  test('infer pivot table', async () => {
    const User = defineEntity({
      name: 'User',
      properties: {
        name: p.string().primary(),
        email: p.string().nullable(),
        viewedPosts: () =>
          p
            .manyToMany(Post)
            .owner()
            .pivotEntity(() => UserViewedPosts),
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

    const orm = new MikroORM({
      entities: [User, Post, UserViewedPosts],
      dbName: ':memory:',
    });
    const generator = orm.schema;
    const createDump = await generator.getCreateSchemaSQL();
    expect(createDump).toMatchInlineSnapshot(`
      "create table \`user\` (\`name\` text not null primary key, \`email\` text null);

      create table \`post\` (\`id\` integer not null primary key autoincrement, \`title\` text not null, \`description\` text not null, \`author_name\` text not null, constraint \`post_author_name_foreign\` foreign key (\`author_name\`) references \`user\` (\`name\`));
      create index \`post_author_name_index\` on \`post\` (\`author_name\`);

      create table \`post_viewers\` (\`post_id\` integer not null, \`user_name\` text not null, primary key (\`post_id\`, \`user_name\`), constraint \`post_viewers_post_id_foreign\` foreign key (\`post_id\`) references \`post\` (\`id\`) on update cascade on delete cascade, constraint \`post_viewers_user_name_foreign\` foreign key (\`user_name\`) references \`user\` (\`name\`) on update cascade on delete cascade);
      create index \`post_viewers_post_id_index\` on \`post_viewers\` (\`post_id\`);
      create index \`post_viewers_user_name_index\` on \`post_viewers\` (\`user_name\`);

      create table \`user_viewed_posts\` (\`user_name\` text not null, \`post_id\` integer not null, \`viewed_at\` datetime not null, primary key (\`user_name\`, \`post_id\`), constraint \`user_viewed_posts_user_name_foreign\` foreign key (\`user_name\`) references \`user\` (\`name\`) on update cascade on delete cascade, constraint \`user_viewed_posts_post_id_foreign\` foreign key (\`post_id\`) references \`post\` (\`id\`) on update cascade on delete cascade);
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

  test('infer table with non-persistent and oneToMany relation', async () => {
    const User = defineEntity({
      name: 'User',
      tableName: 'users',
      properties: {
        name: p.string().primary(),
        email: p.string().nullable(),
        nonPersistent: p.string().persist(false),
        posts: () => p.oneToMany(Post).mappedBy(p => p.author),
      },
    });

    const Post = defineEntity({
      name: 'Post',
      tableName: 'posts',
      properties: {
        id: p.integer().primary().autoincrement(),
        title: p.string(),
        description: p.text(),
        author: () => p.manyToOne(User),
      },
    });

    const orm = new MikroORM({
      entities: [User, Post],
      dbName: ':memory:',
    });

    const createDump = await orm.schema.getCreateSchemaSQL();
    expect(createDump).toMatchInlineSnapshot(`
      "create table \`users\` (\`name\` text not null primary key, \`email\` text null);

      create table \`posts\` (\`id\` integer not null primary key autoincrement, \`title\` text not null, \`description\` text not null, \`author_name\` text not null, constraint \`posts_author_name_foreign\` foreign key (\`author_name\`) references \`users\` (\`name\`));
      create index \`posts_author_name_index\` on \`posts\` (\`author_name\`);
      "
    `);

    type KyselyDB = InferKyselyDB<typeof User | typeof Post, {}>;
    type UserTable = KyselyDB['users'];
    expectTypeOf<UserTable>().toEqualTypeOf<{
      name: string;
      email: string | null;
    }>();
    type PostTable = KyselyDB['posts'];
    expectTypeOf<PostTable>().toEqualTypeOf<{
      id: Generated<number>;
      title: string;
      description: string;
      author_name: string;
    }>();
  });

  test('infer with defineEntity and class', async () => {
    class User {
      fullName!: string;
      email!: string | null;
      firstName!: string;
      lastName!: string;
      profile!: UserProfile;

      [PrimaryKeyProp]?: 'fullName';
    }

    class UserProfile {
      user!: User;
      bio!: string | null;
      avatar!: string | null;
      location!: string | null;

      [PrimaryKeyProp]?: 'user';
    }

    class Post {
      id!: number;
      title!: string;
      description!: string;
      author!: User;

      [PrimaryKeyProp]?: 'id';
    }

    const UserSchema = defineEntity({
      class: User,
      className: 'User',
      tableName: 'users',
      properties: {
        fullName: p.string().primary(),
        email: p.string().nullable(),
        firstName: p.string(),
        lastName: p.string().fieldName('the_last_name'),
        profile: () => p.oneToOne(UserProfile),
      },
    });

    const UserProfileSchema = defineEntity({
      class: UserProfile,
      className: 'UserProfile',
      tableName: 'user_profiles',
      properties: {
        user: () => p.oneToOne(User).owner(true).primary(),
        bio: p.string().nullable(),
        avatar: p.string().nullable(),
        location: p.string().nullable(),
      },
    });

    const PostSchema = defineEntity({
      class: Post,
      className: 'Post',
      tableName: 'posts',
      properties: {
        id: p.integer().primary().autoincrement(),
        title: p.string(),
        description: p.text(),
        author: () => p.manyToOne(User),
      },
    });

    const orm = new MikroORM({
      entities: [UserSchema, UserProfileSchema, PostSchema],
      dbName: ':memory:',
    });

    const createDump = await orm.schema.getCreateSchemaSQL();
    expect(createDump).toMatchInlineSnapshot(`
      "create table \`user_profiles\` (\`user_full_name\` text not null primary key, \`bio\` text null, \`avatar\` text null, \`location\` text null, constraint \`user_profiles_user_full_name_foreign\` foreign key (\`user_full_name\`) references \`users\` (\`full_name\`) on update cascade on delete cascade);

      create table \`users\` (\`full_name\` text not null primary key, \`email\` text null, \`first_name\` text not null, \`the_last_name\` text not null, \`profile_user_full_name\` text not null, constraint \`users_profile_user_full_name_foreign\` foreign key (\`profile_user_full_name\`) references \`user_profiles\` (\`user_full_name\`));
      create unique index \`users_profile_user_full_name_unique\` on \`users\` (\`profile_user_full_name\`);

      create table \`posts\` (\`id\` integer not null primary key autoincrement, \`title\` text not null, \`description\` text not null, \`author_full_name\` text not null, constraint \`posts_author_full_name_foreign\` foreign key (\`author_full_name\`) references \`users\` (\`full_name\`));
      create index \`posts_author_full_name_index\` on \`posts\` (\`author_full_name\`);
      "
    `);

    type KyselyDB = InferKyselyDB<typeof UserSchema | typeof UserProfileSchema | typeof PostSchema, {}>;
    type UserTable = KyselyDB['users'];
    expectTypeOf<UserTable>().toEqualTypeOf<{
      full_name: string;
      email: string | null;
      first_name: string;
      the_last_name: string;
    }>();
    type UserProfileTable = KyselyDB['user_profiles'];
    expectTypeOf<UserProfileTable>().toEqualTypeOf<{
      user_full_name: string;
      bio: string | null;
      avatar: string | null;
      location: string | null;
    }>();
    type PostTable = KyselyDB['posts'];
    expectTypeOf<PostTable>().toEqualTypeOf<{
      id: Generated<number>;
      title: string;
      description: string;
      author_full_name: string;
    }>();
  });

  test('use InferKyselyTable manually', async () => {
    const User = defineEntity({
      name: 'User',
      properties: {
        name: p.string().primary(),
        email: p.string().nullable(),
        age: p.integer(),
      },
    });

    const Post = defineEntity({
      name: 'Post',
      properties: {
        id: p.integer().primary().autoincrement(),
        title: p.string(),
        content: p.text(),
        author: () => p.manyToOne(User),
        createdAt: p.datetime().onCreate(() => new Date()),
      },
    });

    const Comment = defineEntity({
      name: 'Comment',
      properties: {
        id: p.integer().primary().autoincrement(),
        text: p.string(),
        post: () => p.manyToOne(Post),
        author: () => p.manyToOne(User),
      },
    });

    const orm = new MikroORM({
      entities: [User, Post, Comment],
      dbName: ':memory:',
    });

    type InferredUserTable = InferKyselyTable<typeof User>;
    expectTypeOf<InferredUserTable>().toEqualTypeOf<{
      name: string;
      email: string | null;
      age: number;
    }>();

    type InferredPostTable = InferKyselyTable<typeof Post>;
    expectTypeOf<InferredPostTable>().toEqualTypeOf<{
      id: Generated<number>;
      title: string;
      content: string;
      author_name: string;
      created_at: Date;
    }>();

    type InferredCommentTable = InferKyselyTable<typeof Comment>;
    expectTypeOf<InferredCommentTable>().toEqualTypeOf<{
      id: Generated<number>;
      text: string;
      post_id: number;
      author_name: string;
    }>();

    interface ManualUserTable {
      name: string;
      email: string | null;
      age: number;
    }

    interface ManualPostTable {
      id: Generated<number>;
      title: string;
      content: string;
      author_name: string;
      created_at: Date;
    }

    interface ManualCommentTable {
      id: Generated<number>;
      text: string;
      post_id: number;
      author_name: string;
    }

    expectTypeOf<InferredUserTable>().toEqualTypeOf<ManualUserTable>();
    expectTypeOf<InferredPostTable>().toEqualTypeOf<ManualPostTable>();
    expectTypeOf<InferredCommentTable>().toEqualTypeOf<ManualCommentTable>();

    interface ManualDatabase {
      user: ManualUserTable;
      post: ManualPostTable;
      comment: ManualCommentTable;
    }

    const kyselyAuto = orm.em.getKysely();
    type AutoInferredDB = InferDBFromKysely<typeof kyselyAuto>;
    expectTypeOf<AutoInferredDB['user']>().toEqualTypeOf<InferredUserTable>();
    expectTypeOf<AutoInferredDB['post']>().toEqualTypeOf<InferredPostTable>();
    expectTypeOf<AutoInferredDB['comment']>().toEqualTypeOf<InferredCommentTable>();

    const kyselyManual = orm.em.getKysely<ManualDatabase>();
    type ManualDB = InferDBFromKysely<typeof kyselyManual>;
    expectTypeOf<ManualDB>().toEqualTypeOf<ManualDatabase>();
    expectTypeOf<ManualDB['user']>().toEqualTypeOf<ManualUserTable>();
    expectTypeOf<ManualDB['post']>().toEqualTypeOf<ManualPostTable>();
    expectTypeOf<ManualDB['comment']>().toEqualTypeOf<ManualCommentTable>();

    expectTypeOf<AutoInferredDB>().toEqualTypeOf<ManualDatabase>();
  });
});

describe('InferClassEntityDB', () => {
  @Entity()
  class Author {

    [EntityName]?: 'Author';

    @PrimaryKey()
    id!: number;

    @Property()
    firstName!: string;

    @Property()
    email!: string;

    @OneToMany(() => Post, post => post.author)
    posts = new Collection<Post>(this);

  }

  @Entity()
  class Post {

    [EntityName]?: 'Post';

    @PrimaryKey()
    id!: number;

    @Property()
    title!: string;

    @Property()
    createdAt: Date & Opt = new Date();

    @ManyToOne(() => Author)
    author!: Author;

  }

  test('infer decorator entity types via getKysely', async () => {
    const orm = await MikroORM.init({
      entities: [Author, Post],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    });

    await orm.schema.create();

    const kysely = orm.em.getKysely({
      columnNamingStrategy: 'property',
    });
    type DB = InferDBFromKysely<typeof kysely>;

    // table names are snake_cased from entity names
    expectTypeOf<DB>().toHaveProperty('author');
    expectTypeOf<DB>().toHaveProperty('post');

    // author columns: id, firstName, email (collection excluded)
    expectTypeOf<DB['author']>().toHaveProperty('id');
    expectTypeOf<DB['author']>().toHaveProperty('firstName');
    expectTypeOf<DB['author']>().toHaveProperty('email');
    expectTypeOf<DB['author']['id']>().toEqualTypeOf<number>();
    expectTypeOf<DB['author']['firstName']>().toEqualTypeOf<string>();

    // post columns: id, title, createdAt (entity reference and collection excluded)
    expectTypeOf<DB['post']>().toHaveProperty('id');
    expectTypeOf<DB['post']>().toHaveProperty('title');
    expectTypeOf<DB['post']>().toHaveProperty('createdAt');

    // runtime: insert and select using property names
    await kysely
      .insertInto('author')
      .values({ id: 1, firstName: 'John', email: 'john@example.com' })
      .execute();

    const authors = await kysely
      .selectFrom('author')
      .select(['id', 'firstName', 'email'])
      .execute();

    expect(authors).toEqual([{ id: 1, firstName: 'John', email: 'john@example.com' }]);

    await orm.close();
  });

  test('infer decorator entity with tableNamingStrategy: entity', async () => {
    const orm = await MikroORM.init({
      entities: [Author, Post],
      dbName: ':memory:',
      metadataProvider: ReflectMetadataProvider,
    });

    await orm.schema.create();

    const kysely = orm.em.getKysely({
      tableNamingStrategy: 'entity',
      columnNamingStrategy: 'property',
    });
    type DB = InferDBFromKysely<typeof kysely>;

    // with entity naming strategy, table names match entity names
    expectTypeOf<DB>().toHaveProperty('Author');
    expectTypeOf<DB>().toHaveProperty('Post');

    // runtime: insert and select using entity/property names
    await kysely
      .insertInto('Author')
      .values({ id: 1, firstName: 'Jane', email: 'jane@example.com' })
      .execute();

    const authors = await kysely
      .selectFrom('Author')
      .select(['firstName', 'email'])
      .execute();

    expect(authors).toEqual([{ firstName: 'Jane', email: 'jane@example.com' }]);

    await orm.close();
  });

  test('InferClassEntityDB type utility', () => {
    type DB = InferClassEntityDB<typeof Author | typeof Post>;

    expectTypeOf<DB>().toHaveProperty('author');
    expectTypeOf<DB>().toHaveProperty('post');
    expectTypeOf<DB['author']['id']>().toEqualTypeOf<number>();
    expectTypeOf<DB['author']['firstName']>().toEqualTypeOf<string>();
    expectTypeOf<DB['post']['title']>().toEqualTypeOf<string>();

    // collections and entity references are excluded
    type AuthorKeys = keyof DB['author'];
    expectTypeOf<'posts'>().not.toMatchTypeOf<AuthorKeys>();
    type PostKeys = keyof DB['post'];
    expectTypeOf<'author'>().not.toMatchTypeOf<PostKeys>();

    // entity naming strategy
    type DBEntity = InferClassEntityDB<typeof Author | typeof Post, { tableNamingStrategy: 'entity' }>;
    expectTypeOf<DBEntity>().toHaveProperty('Author');
    expectTypeOf<DBEntity>().toHaveProperty('Post');
  });

  test('entities without EntityName are excluded from inference', () => {
    class NoName {

      @PrimaryKey()
      id!: number;

    }

    type DB = InferClassEntityDB<typeof NoName>;
    expectTypeOf<DB>().toEqualTypeOf<unknown>();
  });
});

interface Generated<T> {
  readonly __select__: T;
  readonly __insert__: T | undefined;
  readonly __update__: T;
}
