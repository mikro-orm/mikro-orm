import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  someField!: string;

  @Property({ nullable: true })
  someNullableField!: string | null;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #6755', async () => {
  const e1 = await orm.em.upsert(User, {
    someField: 'random-str11',
    someNullableField: 'random-str11',
  });
  const e2 = await orm.em.upsert(User, {
    someField: 'random-str12',
    someNullableField: 'random-str12',
  });
  const e3 = await orm.em.upsert(User, {
    someField: 'random-str13',
    someNullableField: 'random-str13',
  });
  expect(e1.id).toBe(1);
  expect(e2.id).toBe(2);
  expect(e3.id).toBe(3);

  const e4 = await orm.em.upsert(User, {
    someField: 'random-str21',
    someNullableField: 'random-str21',
  });
  const e5 = await orm.em.upsert(User, {
    someField: 'random-str22',
    someNullableField: 'random-str22',
  });
  const e6 = await orm.em.upsert(User, {
    someField: 'random-str23',
    someNullableField: 'random-str23',
  });
  expect(e4.id).toBe(4);
  expect(e5.id).toBe(5);
  expect(e6.id).toBe(6);
});
