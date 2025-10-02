import {
  MikroORM,
  Entity,
  Property,
  PrimaryKey,
  Ref,
  Collection, OneToMany, ManyToOne, Opt,
} from '@mikro-orm/sqlite';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ unique: true, lazy: true })
  email!: Ref<string>;

  @OneToMany(() => Post, 'user')
  posts = new Collection<Post>(this);

  @Property({
    formula: a => `
        ( CASE WHEN EXISTS (
            SELECT 1
            FROM post p
            WHERE p.title = 'bar' AND p.user_id = ${a}.id
            ) THEN "true" ELSE NULL END) `,
    lazy: true,
    nullable: true,
    persist: false,
    ref: true,
  })
  hasBarPost!: Opt<Ref<string | null>>;

  @Property({
    lazy: true, nullable: true, ref: true,
  })
  scalarRef?: Ref<string>;

}

@Entity()
class Post {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne()
  user!: User;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [ User, Post ],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

describe('should populate and load `hasBarPost` when bar post is added', () => {
  const email = 'foo';

  beforeAll(async () => {
    const u = orm.em.create(User, { name: 'Foo', email });
    orm.em.create(Post, { title: 'foo', user: u });
    orm.em.create(Post, { title: 'bar', user: u });
    await orm.em.flush();
  });

  beforeEach(() => {
    orm.em.clear();
  });

  test('populated in find', async () => {
    const user = await orm.em.findOneOrFail(
      User,
      { email },
      {
        populate: [ 'hasBarPost' ],
      },
    );
    expect(user.hasBarPost.isInitialized()).toEqual(true);
    expect(user.hasBarPost.$).toEqual('true');
  });

  test('using Reference.load()', async () => {
    const user = await orm.em.findOneOrFail(
      User,
      { email },
    );
    await user.hasBarPost.load();
    expect(user.hasBarPost.isInitialized()).toEqual(true);
    expect(await user.hasBarPost.load()).toEqual('true');
  });

  test('using em.populate()', async () => {
    const user = await orm.em.findOneOrFail(
      User,
      { email },
    );
    await orm.em.populate(user, [ 'hasBarPost' ]);
    expect(user.hasBarPost.isInitialized()).toEqual(true);
    expect(await user.hasBarPost.load()).toEqual('true');
  });
});

describe('should populate and load `hasBarPost` when no bar post is added', () => {
  const email = 'bar';
  beforeAll(async () => {
    const u = orm.em.create(User, { name: 'Foo', email });
    orm.em.create(Post, { title: 'foo', user: u });
    await orm.em.flush();
  });

  beforeEach(() => {
    orm.em.clear();
  });

  test('scalarRef returns null', async () => {
    const user = await orm.em.findOneOrFail(
      User,
      { email },
      {
        populate: [ 'scalarRef' ],
      },
    );
    expect(user.scalarRef?.isInitialized()).toEqual(true);
    expect(user.scalarRef?.$).toEqual(null);
  });

  test('populated in find', async () => {
    const user = await orm.em.findOneOrFail(
      User,
      { email },
      {
        populate: [ 'hasBarPost' ],
      },
    );
    expect(user.hasBarPost.isInitialized()).toEqual(true);
    expect(user.hasBarPost.$).toEqual(null);
  });

  test('using Reference.load()', async () => {
    const user = await orm.em.findOneOrFail(
      User,
      { email },
    );
    await user.hasBarPost.load();
    expect(user.hasBarPost.isInitialized()).toEqual(true);
    expect(await user.hasBarPost.load()).toEqual(null);
  });

  test('using em.populate()', async () => {
    const user = await orm.em.findOneOrFail(
      User,
      { email },
    );
    await orm.em.populate(user, [ 'hasBarPost' ]);
    expect(user.hasBarPost.isInitialized()).toEqual(true);
    expect(await user.hasBarPost.load()).toEqual(null);
  });
});
