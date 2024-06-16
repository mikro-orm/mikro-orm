import {
  Entity,
  MikroORM,
  PrimaryKey,
  Property,
  Embeddable,
  Embedded,
} from '@mikro-orm/sqlite';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property({ unique: true })
  email: string;

  @Embedded({ entity: () => Role, array: true, nullable: true })
  roles?: Role[] | null;

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }

}

@Embeddable()
class Role {

  @Property()
  name: string;

  constructor(name: string) {
    this.name = name;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('5715', async () => {
  orm.em.create(User, { name: 'Foo', email: 'foo' });
  await orm.em.flush();
  orm.em.clear();

  const user = await orm.em.upsert(User,
    { name: 'Bar', email: 'foo', roles: null },
  );
  expect(user.name).toBe('Bar');
});
