import { MikroORM, Type, defineEntity } from '@mikro-orm/mongodb';
import { ObjectId } from 'bson';
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
    _id: p.type(ObjectId).primary(),
    hexValues: p.type(new HexIntType()).array(),
    optionalHexValues: p.type(new HexIntType()).array().nullable(),
  }),
});

describe('scalar array option [mongo]', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [TypedArrayEntity],
      dbName: 'scalar_array_option',
      clientUrl: 'mongodb://localhost:27017',
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

    const loaded = await orm.em.findOneOrFail(TypedArrayEntity, entity._id);
    expect(loaded.hexValues).toEqual([255, 16, 0]);
  });

  test('nullable array', async () => {
    const entity = orm.em.create(TypedArrayEntity, {
      hexValues: [42],
      optionalHexValues: [10, 20],
    });
    await orm.em.persist(entity).flush();
    orm.em.clear();

    const loaded = await orm.em.findOneOrFail(TypedArrayEntity, entity._id);
    expect(loaded.optionalHexValues).toEqual([10, 20]);

    loaded.optionalHexValues = null;
    await orm.em.flush();
    orm.em.clear();

    const loaded2 = await orm.em.findOneOrFail(TypedArrayEntity, entity._id);
    expect(loaded2.optionalHexValues).toBeNull();
  });

  test('no spurious update after loading', async () => {
    const entity = orm.em.create(TypedArrayEntity, {
      hexValues: [255],
    });
    await orm.em.persist(entity).flush();
    orm.em.clear();

    await orm.em.findOneOrFail(TypedArrayEntity, entity._id);
    const mock = mockLogger(orm);
    await orm.em.flush();
    expect(mock.mock.calls).toHaveLength(0);
  });
});
