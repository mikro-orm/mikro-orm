import { MikroORM } from '@mikro-orm/sqlite';
import { Embeddable, Embedded, Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { mockLogger } from '../helpers.js';

@Embeddable()
class RunScheduleEntity {

  @Property()
  start_at!: Date;

  @Property({ nullable: true })
  end_at?: Date;

}

@Entity()
class AEntity {

  @PrimaryKey()
  id!: number;

  @Embedded({ entity: () => RunScheduleEntity, prefix: false })
  schedule!: RunScheduleEntity;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [AEntity],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

afterAll(() => orm.close(true));

test('4295', async () => {
  orm.em.create(AEntity, { schedule: { start_at: new Date() } });
  await orm.em.flush();

  const mock = mockLogger(orm);
  await orm.em.findOne(AEntity, { id: 1 }, { cache: 1000 });
  await orm.em.flush();
  expect(mock).toHaveBeenCalledTimes(1);

  mock.mockReset();
  orm.em.clear();

  await orm.em.findOne(AEntity, { id: 1 }, { cache: 1000 });
  await orm.em.flush();
  expect(mock).toHaveBeenCalledTimes(0);

  orm.em.clear();

  await orm.em.find(AEntity, {}, { cache: 1000 });
  await orm.em.flush();
  expect(mock).toHaveBeenCalledTimes(1);

  mock.mockReset();
  orm.em.clear();

  await orm.em.find(AEntity, {}, { cache: 1000 });
  await orm.em.flush();
  expect(mock).toHaveBeenCalledTimes(0);
});
