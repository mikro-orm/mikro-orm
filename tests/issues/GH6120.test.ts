import { Entity, MikroORM, ObjectId, PrimaryKey, Property, SerializedPrimaryKey } from '@mikro-orm/mongodb';

interface Event {
  name: string;
  date: Date;
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
    dbName: '6120',
    entities: [User],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('MongoDB driver should throw when updating a date to an invalid value in a JSON properties', async () => {
  orm.em.create(User, {
    email: 'foo',
    events: [{ name: 'creation', date: new Date() }],
  });
  await orm.em.flush();
  orm.em.clear();

  const user = await orm.em.findOneOrFail(User, { email: 'foo' });
  user.events[0].date = new Date(undefined as any);
  await expect(orm.em.flush()).rejects.toThrowError('Comparing invalid dates is not supported');
});
