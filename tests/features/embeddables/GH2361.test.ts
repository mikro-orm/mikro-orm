import { Embeddable, Embedded, Entity, PrimaryKey, Property, MikroORM, SimpleLogger } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

@Embeddable()
class Nested {

  @Property({ fieldName: 'foobar' })
  child!: string;

}

@Entity()
class MyModel {

  @PrimaryKey()
  id!: number;

  @Embedded(() => Nested, { prefix: 'nested_' })
  nested!: Nested;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [MyModel],
    dbName: ':memory:',
    loggerFactory: SimpleLogger.create,
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close();
});

test('2361', async () => {
  const mock = mockLogger(orm);
  orm.em.create(MyModel, {
    nested: { child: '123' },
  });
  await orm.em.flush();
  orm.em.clear();

  const e = await orm.em.findOneOrFail(MyModel, { nested: { child: '123' } });
  expect(e).toMatchObject({
    nested: { child: '123' },
  });
  expect(mock.mock.calls).toEqual([
    ['[query] begin'],
    ["[query] insert into `my_model` (`nested_foobar`) values ('123') returning `id`"],
    ['[query] commit'],
    ["[query] select `m0`.* from `my_model` as `m0` where `m0`.`nested_foobar` = '123' limit 1"],
  ]);
});
