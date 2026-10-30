import { Collection, MikroORM, ObjectId } from '@mikro-orm/mongodb';
import { Entity, ManyToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Role {
  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  name!: string;
}

@Entity()
class User {
  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  email!: string;

  @ManyToMany({ entity: () => Role })
  roles = new Collection<Role>(this);
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [User, Role],
    dbName: ':memory:',
  });
  await orm.schema.create();
});

afterAll(() => orm.close(true));

beforeEach(async () => {
  await orm.schema.refresh();
});

test('GH #8546 - missing to-many field hydrates as initialized empty collection', async () => {
  const id = new ObjectId();
  await orm.em.getConnection().getDb().collection('user').insertOne({ _id: id, email: 'test@example.com' });

  const em = orm.em.fork();
  const user = await em.findOneOrFail(User, id);

  expect(user.roles.isInitialized()).toBe(true);
  expect(user.roles.getItems()).toEqual([]);
  expect(user.roles).toHaveLength(0);
});
