import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, Enum, EntitySchema, EnumType, Type, PrimaryKey } from '@mikro-orm/core';

enum PublisherType {
  LOCAL = 'local',
  GLOBAL = 'global',
}

enum PublisherType2 {
  LOCAL = 'LOCAL',
  GLOBAL = 'GLOBAL',
}

const enum Enum1 {
  Value1,
  Value2,
}

enum Enum2 {
  PROP1 = 1,
  PROP2 = 2,
}

@Entity()
class EnumEntity {

  @PrimaryKey()
  id!: number;

  @Enum({ items: () => PublisherType, nativeEnumName: 'enum_entity_type' })
  type = PublisherType.LOCAL;

  @Enum({ items: () => PublisherType2, nativeEnumName: 'enum_entity_type2' })
  type2 = PublisherType2.LOCAL;

  @Enum({ items: () => Enum2, nullable: true, nativeEnumName: 'enum2' })
  enum2?: Enum2;

  @Enum({ items: [1, 2, 3], nullable: true, nativeEnumName: 'enum3' })
  enum3?: any;

  @Enum({ items: ['a', 'b', 'c'], nullable: true, nativeEnumName: 'enum4' })
  enum4?: any;

  @Enum({ items: ['a'], nullable: true, nativeEnumName: 'enum5' })
  enum5?: any;

}

describe('native enums in postgres', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [EnumEntity],
      dbName: `mikro_orm_native_enum`,
    });

    await orm.schema.ensureDatabase();
    await orm.schema.execute('drop table if exists new_table cascade');
    await orm.schema.refreshDatabase();
  });

  afterAll(() => orm.close());

  test('generate schema from metadata [postgres]', async () => {
    orm.getMetadata().reset('NewTable');
    await orm.em.execute('drop schema if exists different_schema cascade');
    const dump = await orm.schema.getCreateSchemaSQL();
    expect(dump).toMatchSnapshot('postgres-schema-dump');

    const dropDump = await orm.schema.getDropSchemaSQL();
    expect(dropDump).toMatchSnapshot('postgres-drop-schema-dump');
    await orm.schema.execute(dropDump, { wrap: true });

    const createDump = await orm.schema.getCreateSchemaSQL();
    expect(createDump).toMatchSnapshot('postgres-create-schema-dump');
    await orm.schema.execute(createDump, { wrap: true });

    const updateDump = await orm.schema.getUpdateSchemaSQL();
    expect(updateDump).toMatchSnapshot('postgres-update-schema-dump');
    await orm.schema.execute(updateDump, { wrap: true });
  });

  test('enum diffing', async () => {
    await orm.em.execute('drop schema if exists different_schema cascade');
    const newTableMeta = new EntitySchema({
      schema: 'different_schema',
      properties: {
        id: {
          primary: true,
          name: 'id',
          type: 'number',
          fieldName: 'id',
          columnType: 'int',
        },
        enumTest: {
          type: 'string',
          name: 'enumTest',
          fieldName: 'enum_test',
          columnType: 'varchar(255)',
        },
      },
      name: 'NewTable',
      tableName: 'new_table',
    }).init().meta;
    orm.getMetadata().set('NewTable', newTableMeta);
    let diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-enums-1');
    await orm.schema.execute(diff);

    // change type to enum
    newTableMeta.properties.enumTest.items = ['a', 'b'];
    newTableMeta.properties.enumTest.enum = true;
    newTableMeta.properties.enumTest.nativeEnumName = 'enum_test';
    newTableMeta.properties.enumTest.type = 'object';
    delete newTableMeta.properties.enumTest.columnTypes[0];
    newTableMeta.properties.enumTest.columnTypes[0] = Type.getType(EnumType).getColumnType(newTableMeta.properties.enumTest, orm.em.getPlatform());
    newTableMeta.sync(false, orm.config);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-enums-2');
    await orm.schema.execute(diff);

    // change enum items
    newTableMeta.properties.enumTest.items = ['a', 'b', 'c'];
    delete newTableMeta.properties.enumTest.columnTypes[0];
    newTableMeta.properties.enumTest.columnTypes[0] = Type.getType(EnumType).getColumnType(newTableMeta.properties.enumTest, orm.em.getPlatform());
    newTableMeta.sync(false, orm.config);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-enums-3');
    await orm.schema.execute(diff);

    // check that we do not produce anything as the schema should be up-to-date
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    // change the type from enum to int
    delete newTableMeta.properties.enumTest.items;
    delete newTableMeta.properties.enumTest.nativeEnumName;
    newTableMeta.properties.enumTest.columnTypes[0] = 'text';
    newTableMeta.properties.enumTest.enum = false;
    newTableMeta.properties.enumTest.type = 'string';
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-update-schema-enums-4');
    await orm.schema.execute(diff);
  });

});
