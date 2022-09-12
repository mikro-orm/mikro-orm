import { Embeddable, Embedded, Entity, MikroORM, Options, PrimaryKey, Property, t } from '@mikro-orm/core';

@Embeddable()
class FieldValue {

  @Property({ type: t.json })
  primitive?: string | number | boolean | null;

  @Property({ type: t.json })
  object?: Record<string, boolean>;

}

@Entity()
class Field {

  @PrimaryKey({ name: '_id' })
  id: number = 1;

  @Embedded({ entity: () => FieldValue, array: true })
  values: FieldValue[] = [];

  @Embedded({ entity: () => FieldValue, object: true })
  value?: FieldValue;

}

describe.each(['sqlite', 'better-sqlite', 'mysql', 'postgresql', 'mongo'] as const)('GH #3327 (%s)', type => {

  let orm: MikroORM;

  beforeAll(async () => {
    const options: Options = {};

    if (type === 'mysql') {
      options.port = 3308;
    }

    orm = await MikroORM.init({
      entities: [Field],
      dbName: type.includes('sqlite') ? ':memory:' : 'mikro_orm_3327',
      type,
      ...options,
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`JSON properties inside embeddables`, async () => {
    const value = new FieldValue();
    value.primitive = 1;
    value.object = { field: true };
    const value2 = new FieldValue();
    value2.primitive = null;
    value2.object = { field: false };

    const entity = orm.em.create(Field, { values: [value, value2], value });

    await orm.em.persistAndFlush(entity);

    orm.em.clear();

    const [result] = await orm.em.find(Field, {});

    expect(result.value).toBeInstanceOf(FieldValue);
    expect(result.values[0]).toBeInstanceOf(FieldValue);
    expect(result).toEqual({
      id: result.id,
      value: { primitive: 1, object: { field: true } },
      values: [
        { primitive: 1, object: { field: true } },
        { primitive: null, object: { field: false } },
      ],
    });
  });

});
