import { defineEntity, IntegerType, BooleanType, MikroORM, Type } from '@mikro-orm/postgresql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../helpers.js';

// Custom type: stores number as hex string in the DB, converts to/from number in JS
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

describe('scalar array option', () => {
  describe('decorators', () => {
    @Entity()
    class TypedArrayEntity {
      @PrimaryKey()
      id!: number;

      @Property({ type: IntegerType, array: true })
      integers!: number[];

      @Property({ type: BooleanType, array: true })
      flags!: boolean[];

      @Property({ type: new HexIntType(), array: true })
      hexValues!: number[];

      @Property({ type: new HexIntType(), array: true, nullable: true })
      optionalHexValues?: number[] | null;
    }

    let orm: MikroORM;

    beforeAll(async () => {
      orm = await MikroORM.init({
        metadataProvider: ReflectMetadataProvider,
        entities: [TypedArrayEntity],
        dbName: 'mikro_orm_scalar_array_decorators',
      });
      await orm.schema.refresh();
    });

    afterAll(() => orm.close(true));

    test('schema produces correct column types', async () => {
      const sql = await orm.schema.getCreateSchemaSQL();
      expect(sql).toContain('"integers" int[]');
      expect(sql).toContain('"flags" boolean[]');
      expect(sql).toContain('"hex_values" text[]');
      expect(sql).toContain('"optional_hex_values" text[]');
    });

    test('persist and retrieve custom type array', async () => {
      const entity = orm.em.create(TypedArrayEntity, {
        integers: [1, 2, 3],
        flags: [true, false],
        hexValues: [255, 16, 0],
      });
      await orm.em.persist(entity).flush();
      orm.em.clear();

      const loaded = await orm.em.findOneOrFail(TypedArrayEntity, entity.id);
      expect(loaded.integers).toEqual([1, 2, 3]);
      expect(loaded.flags).toEqual([true, false]);
      expect(loaded.hexValues).toEqual([255, 16, 0]);
    });

    test('nullable array', async () => {
      const entity = orm.em.create(TypedArrayEntity, {
        integers: [1],
        flags: [true],
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
        integers: [10, 20],
        flags: [true],
        hexValues: [255],
      });
      await orm.em.persist(entity).flush();
      orm.em.clear();

      await orm.em.findOneOrFail(TypedArrayEntity, entity.id);
      const mock = mockLogger(orm);
      await orm.em.flush();
      expect(mock.mock.calls).toHaveLength(0);
    });
  });

  describe('defineEntity', () => {
    const TypedArrayDE = defineEntity({
      name: 'TypedArrayDE',
      properties: pr => ({
        id: pr.integer().primary().autoincrement(),
        integers: pr.integer().array(),
        hexValues: pr.type(new HexIntType()).array(),
        decimals: pr.decimal('number').array().nullable().precision(10).scale(2),
      }),
    });

    let orm: MikroORM;

    beforeAll(async () => {
      orm = await MikroORM.init({
        entities: [TypedArrayDE],
        dbName: 'mikro_orm_scalar_array_define_entity',
      });
      await orm.schema.refresh();
    });

    afterAll(() => orm.close(true));

    test('schema produces correct column types', async () => {
      const sql = await orm.schema.getCreateSchemaSQL();
      expect(sql).toContain('"integers" int[]');
      expect(sql).toContain('"hex_values" text[]');
      expect(sql).toContain('"decimals" numeric(10,2)[]');
    });

    test('persist and retrieve', async () => {
      const entity = orm.em.create(TypedArrayDE, {
        integers: [10, 20, 30],
        hexValues: [255, 16],
        decimals: [1.5, 2.5],
      });
      await orm.em.persist(entity).flush();
      orm.em.clear();

      const loaded = await orm.em.findOneOrFail(TypedArrayDE, entity.id);
      expect(loaded.integers).toEqual([10, 20, 30]);
      expect(loaded.hexValues).toEqual([255, 16]);
      expect(loaded.decimals).toEqual([1.5, 2.5]);
    });

    test('empty arrays roundtrip correctly', async () => {
      const entity = orm.em.create(TypedArrayDE, {
        integers: [],
        hexValues: [],
      });
      await orm.em.persist(entity).flush();
      orm.em.clear();

      const loaded = await orm.em.findOneOrFail(TypedArrayDE, entity.id);
      expect(loaded.integers).toEqual([]);
      expect(loaded.hexValues).toEqual([]);
    });
  });
});
