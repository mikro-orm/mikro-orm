import { ManyToOne, MikroORM, OneToMany, Opt } from '@mikro-orm/better-sqlite';
import {
  Collection,
  Embeddable,
  Embedded,
  Entity,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';

@Embeddable()
class Settings {

  @Property()
  name!: string;

  constructor(settings: Settings) {
    this.name = settings.name;
  }

}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Embedded(() => Settings, { nullable: true })
  settings?: Opt<Settings>;

  @OneToMany({
    entity: () => Post,
    mappedBy: post => post.user,
  })
  posts = new Collection<Post>(this);

  constructor(user: Omit<User, 'posts'>) {
    this.id = user.id;
    if (user.settings) {
      this.settings = user.settings;
    }
  }

}

@Embeddable()
class Metadata {

  @Property()
  valid: boolean & Opt = false;

  @Property()
  invalid: boolean & Opt = true;

}

@Entity()
class Post {

  @PrimaryKey()
  id!: number;

  @Property()
  body!: string;

  @ManyToOne(() => User)
  user!: User;

  @Embedded(() => Metadata)
  metadata: Metadata & Opt = new Metadata();

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [ User, Settings, Post, Metadata ],
    dbName: ':memory:',
  });

  await orm.schema.createSchema();
});

afterAll(() => orm.close(true));
afterEach(() => orm.em.clear());

test('insert an object with embeddable using a QueryBuilder', async () => {
  const foo = new User({ id: 1, settings: { name: 'foo' } });
  const bar = new User({ id: 2, settings: { name: 'bar' } });
  const repo = orm.em.getRepository(User);

  await repo.createQueryBuilder().insert([ foo, bar ]);

  expect(await repo.findOneOrFail(1)).toEqual(foo);
  expect(await repo.findOneOrFail(2)).toEqual(bar);
});

test('update an object with embeddable using a QueryBuilder', async () => {
  const foo = new User({ id: 1, settings: { name: 'eh' } });
  const bar = new User({ id: 2, settings: { name: 'oh' } });
  const repo = orm.em.getRepository(User);

  await repo.createQueryBuilder().update({ settings: foo.settings }).where({ id: foo.id });
  await repo.createQueryBuilder().update({ settings: bar.settings }).where({ id: bar.id });

  expect(await repo.findOneOrFail(1)).toEqual(foo);
  expect(await repo.findOneOrFail(2)).toEqual(bar);
});

test('query an object with embeddable using a QueryBuilder', async () => {
  const user = new User({ id: 1 });
  const post1 = orm.em.create(Post, { id: 1, user, body: 'hello world' });

  expect(post1.metadata.valid).toBe(false);

  const post2 = orm.em.create(Post, {
    id: 2,
    user,
    body: 'foo bar',
    metadata: { valid: true },
  });

  expect(post2.metadata.valid).toBe(true);

  await orm.em.flush();
  orm.em.clear();

  await expect(orm.em.createQueryBuilder(User, 'u')
    .leftJoin('u.posts', 'p', { metadata: { valid: true, invalid: { $ne: true } } })
    .getResult()).resolves.toBeTruthy();
});
