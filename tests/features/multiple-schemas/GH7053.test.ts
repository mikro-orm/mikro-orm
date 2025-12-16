import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/postgresql';

@Entity({ schema: '*' })
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property({ unique: true })
  email: string;

  @OneToMany(() => Post, post => post.author)
  posts = new Collection<Post>(this);

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }

}

@Entity({ schema: '*' })
class Post {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => User)
  author!: User;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: '7053',
    entities: [User, Post],
  });
  await orm.schema.updateSchema({ schema: 'other' });
  await orm.schema.clearDatabase({ schema: 'other' });
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #7053', async () => {
  const em = orm.em.fork({ schema: 'other' });
  em.create(User, {
    name: 'user',
    email: 'email',
    posts: [
      { title: 'Hello World' },
      { title: 'Hello World 2' },
    ],
  });
  await em.flush();
  em.clear();

  const res = await em.find(User, {
    posts: { $some: { title: 'Hello World' } },
  });
  expect(res).toHaveLength(1);
});
