import { Entity, MikroORM, ObjectId, PrimaryKey, Property, SerializedPrimaryKey } from '@mikro-orm/mongodb';

interface Event {
  name: string;
  actorId: ObjectId;
}

@Entity()
class User {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property({ unique: true })
  email!: string;

  @Property({ type: 'json' })
  events: Event[] = [];

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: '6091',
    entities: [User],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('MongoDB driver should persist ObjectID in JSON properties', async () => {
  const actorId = new ObjectId();
  orm.em.create(User, {
    email: 'foo',
    events: [{ name: 'creation', actorId }],
  });
  await orm.em.flush();
  orm.em.clear();

  const user = await orm.em.findOneOrFail(User, { email: 'foo' });
  expect(user.events.length).toBe(1);
  expect(user.events[0].name).toBe('creation');
  expect(user.events[0].actorId.equals(actorId)).toBe(true);
});
