import { MikroORM, Utils, Type, defineEntity } from '@mikro-orm/sql';
import type { AbstractSqlDriver } from '@mikro-orm/sql';
import { PLATFORMS } from '../../bootstrap.js';
import { mockLogger } from '../../helpers.js';

class HexIntType extends Type<number, string> {
  override convertToJSValue(value: string): number {
    return parseInt(String(value), 16);
  }

  override convertToDatabaseValue(value: number): string {
    return value.toString(16);
  }

  override getColumnType(): string {
    return 'text';
  }

  override ensureComparable(): boolean {
    return true;
  }
}

const TypedArrayEntity = defineEntity({
  name: 'TypedArrayEntity',
  properties: p => ({
    id: p.integer().primary().autoincrement(),
    hexValues: p.type(new HexIntType()).array(),
    optionalHexValues: p.type(new HexIntType()).array().nullable(),
  }),
});

const options = {
  sqlite: { dbName: ':memory:' },
  libsql: { dbName: ':memory:' },
  mysql: { dbName: 'scalar_array_option', port: 3308 },
  mariadb: { dbName: 'scalar_array_option', port: 3309 },
};

describe.each(Utils.keys(options))('scalar array option [%s]', type => {
  let orm: MikroORM<AbstractSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init<AbstractSqlDriver>({
      entities: [TypedArrayEntity],
      driver: PLATFORMS[type],
      ...options[type],
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  test('persist and retrieve custom type array', async () => {
    const entity = orm.em.create(TypedArrayEntity, {
      hexValues: [255, 16, 0],
    });
    await orm.em.persist(entity).flush();
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(TypedArrayEntity, entity.id);
    expect(loaded.hexValues).toEqual([255, 16, 0]);
  });

  test('nullable array', async () => {
    const entity = orm.em.create(TypedArrayEntity, {
      hexValues: [42],
      optionalHexValues: [10, 20],
    });
    await orm.em.persist(entity).flush();
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(TypedArrayEntity, entity.id);
    expect(loaded.optionalHexValues).toEqual([10, 20]);

    loaded.optionalHexValues = null;
    await orm.em.flush();
    orm.em.clear();

    const loaded2 = await orm.em.findOneOrFail(TypedArrayEntity, entity.id);
    expect(loaded2.optionalHexValues).toBeNull();
  });

  test('no spurious update after loading', async () => {
    const entity = orm.em.create(TypedArrayEntity, {
      hexValues: [255],
    });
    await orm.em.persist(entity).flush();
    orm.em.clear();

    await orm.em.findOneOrFail(TypedArrayEntity, entity.id);
    const mock = mockLogger(orm);
    await orm.em.flush();
    expect(mock.mock.calls).toHaveLength(0);
  });

  test('empty arrays roundtrip correctly', async () => {
    const entity = orm.em.create(TypedArrayEntity, {
      hexValues: [],
    });
    await orm.em.persist(entity).flush();
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(TypedArrayEntity, entity.id);
    expect(loaded.hexValues).toEqual([]);
  });
});
