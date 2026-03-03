import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property({ unique: true })
  email: string;

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

// Commenting the beforeEach and afterEach resolves the issue.
beforeEach(async () => {
  await orm.em.begin();
});

afterEach(async () => {
  await orm.em.rollback();
});

test('refresh breaks UnitOfWork', async () => {
  const user1 = orm.em.create(User, { name: 'D', email: 'd@a.ch' });
  await orm.em.persist(user1).flush();
  await orm.em.refresh(user1);
  const user2 = await orm.em.findOneOrFail(User, user1.id);
  expect(user1 === user2).toBeTruthy();
});
