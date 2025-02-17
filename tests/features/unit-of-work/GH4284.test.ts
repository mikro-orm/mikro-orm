import { Entity, OptionalProps, PrimaryKey, Property, SimpleLogger } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

@Entity()
class AEntity {

  [OptionalProps]?: 'name';

  @PrimaryKey()
  id!: string;

  @Property({ default: 'value1' })
  name!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [AEntity],
    loggerFactory: SimpleLogger.create,
  });
  await orm.schema.createSchema();
});

afterAll(() => orm.close(true));

test(`GH issue 4284`, async () => {
  orm.em.create(AEntity, { id: '1' });
  const mock = mockLogger(orm);
  await orm.em.flush();
  await orm.em.flush();
  expect(mock.mock.calls).toEqual([
    ['[query] begin'],
    ['[query] insert into `aentity` (`id`) values (\'1\') returning `name`'],
    ['[query] commit'],
  ]);
});
