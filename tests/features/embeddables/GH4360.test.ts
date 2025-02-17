import { Embeddable, Embedded, Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

@Embeddable()
class Animal {

  @Property()
  birthday!: Date;

}

@Entity()
class Owner {

  @PrimaryKey()
  id!: number;

  @Embedded(() => Animal, { array: true })
  pets!: Animal[];

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Owner],
    dbName: ':memory:',
  });

  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('conversion of Date properties in object embeddables', async () => {
  await orm.em.insert(Owner, {
    id: 1,
    pets: [
      { birthday: new Date() },
    ],
  });
  await orm.em.findOneOrFail(Owner, 1);
  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();
});
