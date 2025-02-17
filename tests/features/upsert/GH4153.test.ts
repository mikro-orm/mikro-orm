import { MikroORM, Entity, PrimaryKey, Property, Unique, Utils, IDatabaseDriver } from '@mikro-orm/core';
import { PLATFORMS } from '../../bootstrap.js';

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

const options = {
  mysql: { port: 3308 },
  mariadb: { port: 3309 },
};

describe.each(Utils.keys(options))('GH 4153 [%s]',  type => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init<IDatabaseDriver>({
      dbName: 'mikro_4153',
      driver: PLATFORMS[type],
      ...options[type],
      entities: [MyEntity1],
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(() => orm.close(true));

  test('mapping PKs after upsert based on unique properties', async () => {
    await orm.em.insertMany(MyEntity1, [
      { id: 1, uniq1: 1, uniq2: 1, name: 'first' },
      { id: 2, uniq1: 2, uniq2: 1, name: 'second' },
    ]);

    const entity1 = new MyEntity1();
    entity1.uniq1 = 1;
    entity1.uniq2 = 1;
    entity1.name = 'first updated';

    const entity2 = new MyEntity1();
    entity2.uniq1 = 2;
    entity2.uniq2 = 1;
    entity2.name = 'second updated';

    const result = await orm.em.upsertMany([entity2, entity1]);

    expect(result.find(v => v.uniq1 === 1 && v.uniq2 === 1)!.id).toBe(1);
    expect(result.find(v => v.uniq1 === 2 && v.uniq2 === 1)!.id).toBe(2);
  });
});
