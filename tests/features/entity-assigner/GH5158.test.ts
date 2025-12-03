import { JsonType, MikroORM } from '@mikro-orm/mongodb';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { ObjectId } from 'bson';

@Entity()
class User {

  @PrimaryKey()
  _id!: ObjectId;

  @Property({ type: JsonType })
  methods: { method1?: string; method2?: string } = {};

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: '5158',
    entities: [User],
    assign: {
      mergeObjectProperties: true,
    },
  });
});

afterAll(async () => {
  await orm.close();
});

test('should update json properties with assign()', async () => {
  // initialize user
  const user1 = new User();
  user1.methods = { method1: '1', method2: '1' };
  const em1 = orm.em.fork();
  await em1.persist(user1).flush();

  // verify that it was persisted properly
  const emRead1 = orm.em.fork();
  const result1 = await emRead1.findOneOrFail(User, user1._id);
  expect(result1.methods).toEqual({ method1: '1', method2: '1' });

  // updating JSON property without assign() should work
  const em2 = orm.em.fork();
  const user2 = await em2.findOneOrFail(User, user1._id);
  user2.methods = { method1: '1', method2: '2' };
  await em2.persist(user2).flush();

  // verify that it was persisted properly
  const emRead2 = orm.em.fork();
  const result2 = await emRead2.findOneOrFail(User, user1._id);
  expect(result2.methods).toEqual({ method1: '1', method2: '2' });

  // updating JSON property with assign() should work
  const em3 = orm.em.fork();
  const user3 = await em3.findOneOrFail(User, user1._id);
  em3.assign(user3, { methods: { method2: '3' } });
  await em3.persist(user3).flush();

  // verify that it was persisted properly
  const emRead3 = orm.em.fork();
  const result3 = await emRead3.findOneOrFail(User, user1._id);
  expect(result3.methods).toEqual({ method1: '1', method2: '3' });
});
