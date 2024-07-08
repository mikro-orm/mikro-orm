import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/mongodb';

@Entity()
class Dummy {

  @PrimaryKey()
  _id!: number;

  @Property({ type: 'json' })
  a!: { b: number };

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: '5572',
    entities: [Dummy],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('deep update', async () => {
  const usr1 = orm.em.create(Dummy, { _id: 1, a: { b: 1 } });
  await orm.em.flush();
  orm.em.clear();

  const usr2 = await orm.em.findOneOrFail(Dummy, usr1._id);
  usr2.a.b = 100;
  await orm.em.flush();
  orm.em.clear();

  const usr3 = await orm.em.findOneOrFail(Dummy, usr1._id);
  expect(usr3.a.b).toBe(100);
});
