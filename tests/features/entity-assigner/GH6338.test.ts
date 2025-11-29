import { MikroORM, t, wrap } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { v4 } from 'uuid';

@Entity()
class User {

  @PrimaryKey({ type: t.uuid })
  id: string = v4();

  @Property({ nullable: true })
  name?: string;

  @Property()
  email!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [User],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('should ignore undefined properties when using assign() when using ignoreUndefined', async () => {
  // initialize user
  const userInit = new User();
  userInit.name = 'Eugene';
  userInit.email = 'eugene@eugene.app';
  const em = orm.em.fork();
  await em.persistAndFlush(userInit);

  // verify that it was persisted properly
  const emRead = orm.em.fork();
  const user = await emRead.findOneOrFail(User, userInit.id);
  expect(user).toEqual({ id: expect.any(String), name: 'Eugene', email: 'eugene@eugene.app' });

  // without using ignoreUndefined on a non-nullable field
  const emRead1 = orm.em.fork();
  const user1 = await emRead1.findOneOrFail(User, userInit.id);
  const updateContent1 = { name: 'Eugene Poubelle', email: undefined };

  expect(() => wrap(user1).assign(updateContent1)).toThrow('You must pass a non-undefined value to the property email of entity User.');

  // without using ignoreUndefined on a nullable field
  const emRead2 = orm.em.fork();
  const user2 = await emRead2.findOneOrFail(User, userInit.id);
  const updateContent2 = { name: undefined, email: 'edward@eugene.app' };
  const test2 = wrap(user2).assign(updateContent2);

  expect(test2).toEqual({ id: expect.any(String), name: undefined, email: 'edward@eugene.app' });

  // behavior using ignoreUndefined:false should be identical to not using it at all
  const emRead3 = orm.em.fork();
  const user3 = await emRead3.findOneOrFail(User, userInit.id);
  const updateContent3 = { name: undefined, email: 'edward@eugene.app' };
  const test3 = wrap(user3).assign(updateContent3, { ignoreUndefined: false });

  expect(test3).toEqual({ id: expect.any(String), name: undefined, email: 'edward@eugene.app' });

  // behavior using ignoreUndefined:true
  const emRead4 = orm.em.fork();
  const user4 = await emRead4.findOneOrFail(User, userInit.id);
  const updateContent4 = { name: undefined, email: 'edward@eugene.app' };
  const test4 = wrap(user4).assign(updateContent4, { ignoreUndefined: true });

  expect(test4).toEqual({ id: expect.any(String), name: 'Eugene', email: 'edward@eugene.app' });

});
