import {
  Embeddable,
  Embedded,
  Entity,
  MikroORM, Opt,
  PrimaryKey,
  Property, Collection, ManyToOne, OneToMany,
} from '@mikro-orm/sqlite';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property({ unique: true })
  email: string;

  @OneToMany({
    entity: () => Post,
    mappedBy: post => post.user,
  })
  posts = new Collection<Post>(this);

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }

}

@Embeddable()
class Metadata {

  @Property()
  valid: Opt<boolean> = false;

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
  metadata: Opt<Metadata> = new Metadata();

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [ User, Post, Metadata ],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test("should be able to query against joined property's embeddable properties", async () => {
  const user = orm.em.create(User, { name: 'Foo', email: 'foo' });
  const post1 = orm.em.create(Post, { user, body: 'hello world' });

  expect(post1.metadata.valid).toBe(false);

  const post2 = orm.em.create(Post, {
    user,
    body: 'foo bar',
    metadata: { valid: true },
  });

  expect(post2.metadata.valid).toBe(true);

  await orm.em.flush();
  orm.em.clear();

  const res = await orm.em.createQueryBuilder(User, 'u')
    .leftJoinAndSelect('u.posts', 'p', { metadata: { valid: true } })
    .getResult();

  expect(res.length).toBe(1);
  const u = res[0];
  expect(u).toBeInstanceOf(User);

  expect(u.posts.length).toBe(1);
  expect(u.posts.getItems()).toEqual(expect.arrayContaining([expect.objectContaining({ metadata: { valid: true } })]));
});
