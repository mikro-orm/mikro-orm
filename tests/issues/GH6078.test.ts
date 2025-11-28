import { MikroORM, ObjectId } from '@mikro-orm/mongodb';

import { Entity, PrimaryKey, Property, ReflectMetadataProvider, SerializedPrimaryKey } from '@mikro-orm/decorators/legacy';
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
    metadataProvider: ReflectMetadataProvider,
    dbName: '6078',
    entities: [User],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('ISODates received by MongoDB driver in JSON properties should not be erased', async () => {
  orm.em.create(User, {
    email: 'foo',
    events: [{ name: 'creation', date: new Date() }],
  });
  await orm.em.flush();
  orm.em.clear();

  const user = await orm.em.findOneOrFail(User, { email: 'foo' });
  expect(user.events.length).toBe(1);
  expect(user.events[0].name).toBe('creation');
  expect(user.events[0].date).toBeInstanceOf(Date);
});
