import { Entity, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/mysql';

@Entity()
@Unique({ properties: ['uniq1', 'uniq2'] })
class MyEntity1 {

  @PrimaryKey()
  id?: number;

  @Property()
  uniq1!: number;

  @Property()
  uniq2!: number;

  @Property()
  name!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'mikro_4153',
    port: 3308,
    entities: [MyEntity1],
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));
beforeEach(() => orm.schema.clearDatabase());

test('4692', async () => {
  const entities = [
    orm.em.create(MyEntity1, { id: 1, uniq1: 1, uniq2: 1, name: 'first' }),
    orm.em.create(MyEntity1, { id: 2, uniq1: 2, uniq2: 1, name: 'second' }),
  ];
  await orm.em.insertMany(entities);

  const res = await orm.em.find(MyEntity1, {});
  expect(res).toHaveLength(2);
});

test('4692', async () => {
  const entity = orm.em.create(MyEntity1, { id: 3, uniq1: 3, uniq2: 3, name: 'third' });
  await orm.em.insert(entity);

  const res = await orm.em.find(MyEntity1, {});
  expect(res).toHaveLength(1);
});
