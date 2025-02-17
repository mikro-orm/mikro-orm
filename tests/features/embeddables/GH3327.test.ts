import { Embeddable, Embedded, Entity, MikroORM, Options, PrimaryKey, Property, t } from '@mikro-orm/core';
import { PLATFORMS } from '../../bootstrap.js';

@Embeddable()
class FieldValue {

  @Property({ type: t.json, nullable: true })
  primitive?: string | number | boolean | null;

  @Property({ type: t.json, nullable: true })
  object?: Record<string, boolean>;

  @Property({ type: t.json, nullable: true })
  array?: string[];

}

@Entity()
class Field {

  @PrimaryKey({ name: '_id' })
  id: number = 1;

  @Embedded({ entity: () => FieldValue, array: true })
  values: FieldValue[] = [];

  @Embedded({ entity: () => FieldValue, object: true })
  value?: FieldValue;

  @Embedded({ entity: () => FieldValue, object: false })
  inline?: FieldValue;

}

describe.each(['sqlite', 'mysql', 'postgresql', 'mssql', 'mongo'] as const)('GH #3327 (%s)', type => {

  let orm: MikroORM;

  beforeAll(async () => {
    const options: Options = {};

    if (type === 'mysql') {
      options.port = 3308;
    }

    if (type === 'mssql') {
      options.password = 'Root.Root';
    }

    orm = await MikroORM.init({
      entities: [Field],
      dbName: type.includes('sqlite') ? ':memory:' : 'mikro_orm_3327',
      driver: PLATFORMS[type],
      ...options,
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`JSON properties inside embeddables`, async () => {
    const value = new FieldValue();
    value.primitive = '1';
    value.object = { field: true };
    value.array = ['1', '2', '3'];
    const value2 = new FieldValue();
    value2.primitive = null;
    value2.object = { field: false };
    value2.array = ['4', '5', '6'];

    const entity = orm.em.create(Field, { values: [value, value2], value, inline: value2 });

    await orm.em.persistAndFlush(entity);

    orm.em.clear();

    const [result] = await orm.em.find(Field, {});

    expect(result.value).toBeInstanceOf(FieldValue);
    expect(result.inline).toBeInstanceOf(FieldValue);
    expect(result.values[0]).toBeInstanceOf(FieldValue);
    expect(result).toEqual({
      id: result.id,
      value: { primitive: '1', object: { field: true }, array: ['1', '2', '3'] },
      values: [
        { primitive: '1', object: { field: true }, array: ['1', '2', '3'] },
        { primitive: null, object: { field: false }, array: ['4', '5', '6'] },
      ],
      inline: { primitive: null, object: { field: false }, array: ['4', '5', '6'] },
    });
  });

});
