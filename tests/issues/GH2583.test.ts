import { Entity, MikroORM, PrimaryKey, Enum } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

export enum WithEnumArrayValue {
  First = 'first',
  Second = 'second',
  Third = 'third',
}

@Entity()
export class WithEnumArray {

  @PrimaryKey()
  id!: number;

  @Enum({ items: () => WithEnumArrayValue, array: true })
  values: WithEnumArrayValue[] = [];

}

describe('enum array with native PG enums (GH issue 2583)', () => {
  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init<PostgreSqlDriver>({
      entities: [WithEnumArray],
      dbName: 'mikro_orm_test_2583',
      driver: PostgreSqlDriver,
    });
    await orm.schema.dropDatabase('mikro_orm_test_2583');
    await orm.schema.createDatabase('mikro_orm_test_2583');
    await orm.em.execute(`
      create type with_enum_array_value as enum ('first', 'second', 'third');
      create table with_enum_array (id serial primary key, values with_enum_array_value[] not null);
    `);
  });

  afterAll(async () => {
    await orm.close();
  });

  test('values are properly marshalled/unmarshalled', async () => {
    const values = [WithEnumArrayValue.First, WithEnumArrayValue.Second];
    const entity = new WithEnumArray();
    entity.values = values;
    await orm.em.fork().persistAndFlush(entity);

    const expected = await orm.em.findOneOrFail(WithEnumArray, entity.id);
    expect(expected.values).toEqual(values);
  });

  test('empty array', async () => {
    const entity = new WithEnumArray();
    await orm.em.fork().persistAndFlush(entity);

    const expected = await orm.em.findOneOrFail(WithEnumArray, entity.id);
    expect(expected.values).toEqual([]);
  });

});
