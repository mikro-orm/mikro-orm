import { MikroORM, Entity, OneToOne, OptionalProps, PrimaryKey, Property, Rel } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

@Entity()
class Blog {

  @PrimaryKey()
  id!: number;

  @Property({ length: 64, nullable: true })
  title: string | null = null;

  // Note the OneToOne relationship with inverse
  @OneToOne(() => User)
  author!: Rel<User>;

}

@Entity()
class User {

  [OptionalProps]?: 'name' | 'balance';

  @PrimaryKey()
  id!: number;

  @Property({ length: 64, default: 'Default' })
  name!: string;

  @Property({ default: 0 })
  balance: number = 0;

  // Note the OneToOne relationship with inverse
  @OneToOne(() => 'Blog', (e: Blog) => e.author)
  blog?: Blog;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Blog, User],
    dbName: `:memory:`,
    forceEntityConstructor: true,
  });

  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('extra updates caused by property initializers with forceEntityConstructor enabled', async () => {
  const author = orm.em.create(User, {
    id: 1,
    name: 'Some User',
    balance: 5000,
  });
  orm.em.create(Blog, {
    id: 1,
    title: 'Test Blog',
    author,
  });

  await orm.em.flush();
  orm.em.clear();

  const entity = await orm.em.findOneOrFail(Blog, { id: 1 });

  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();
});
