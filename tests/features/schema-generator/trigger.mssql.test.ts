import { EntitySchema, MikroORM } from '@mikro-orm/mssql';
import { Entity, PrimaryKey, Property, Trigger, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Trigger({
  name: 'trg_price',
  timing: 'after',
  events: ['insert'],
  body: `PRINT 'trigger fired'`,
})
@Entity()
class TriggerEntity {
  @PrimaryKey()
  id!: number;

  @Property()
  price!: number;
}

describe('trigger [mssql]', () => {
  test('trigger is generated for decorator [mssql]', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [TriggerEntity],
      dbName: `mikro_orm_test_trigger_mssql_1`,
      password: 'Root.Root',
    });

    const diff = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mssql-trigger-decorator');

    const meta = orm.getMetadata(TriggerEntity);
    expect(meta.triggers).toEqual([
      {
        name: 'trg_price',
        timing: 'after',
        events: ['insert'],
        forEach: 'row',
        body: `PRINT 'trigger fired'`,
      },
    ]);
    expect(meta.hasTriggers).toBe(true);

    await orm.schema.dropDatabase();
    await orm.close();
  });

  test('trigger diff [mssql]', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [TriggerEntity],
      discovery: { warnWhenNoEntities: false },
      dbName: `mikro_orm_test_trigger_mssql_2`,
      password: 'Root.Root',
    });
    const meta = orm.getMetadata();
    await orm.schema.ensureDatabase();

    const newTableMeta = new EntitySchema({
      properties: {
        id: {
          primary: true,
          name: 'id',
          type: 'number',
          fieldName: 'id',
          columnType: 'int',
        },
      },
      name: 'TriggerTable',
      tableName: 'trigger_table',
      triggers: [
        {
          name: 'trg_audit',
          timing: 'after',
          events: ['insert'],
          body: `PRINT 'inserted'`,
        },
      ],
    }).init().meta;
    meta.set(newTableMeta.class, newTableMeta);

    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain('create trigger');
    expect(diff).toContain('trg_audit');
    expect(diff).toContain('AFTER INSERT');

    await orm.schema.dropDatabase();
    await orm.close();
  });

  test('trigger with multiple events [mssql]', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [TriggerEntity],
      discovery: { warnWhenNoEntities: false },
      dbName: `mikro_orm_test_trigger_mssql_3`,
      password: 'Root.Root',
    });
    const meta = orm.getMetadata();
    await orm.schema.ensureDatabase();

    const newTableMeta = new EntitySchema({
      properties: {
        id: {
          primary: true,
          name: 'id',
          type: 'number',
          fieldName: 'id',
          columnType: 'int',
        },
      },
      name: 'MultiEvt',
      tableName: 'multi_evt',
      triggers: [
        {
          name: 'trg_multi',
          timing: 'after',
          events: ['insert', 'update'],
          body: `PRINT 'multi event'`,
        },
      ],
    }).init().meta;
    meta.set(newTableMeta.class, newTableMeta);

    const diff = await orm.schema.getCreateSchemaSQL({ wrap: false });
    // MSSQL supports multiple events in a single trigger
    expect(diff).toContain('AFTER INSERT, UPDATE');

    await orm.schema.dropDatabase();
    await orm.close();
  });
});
