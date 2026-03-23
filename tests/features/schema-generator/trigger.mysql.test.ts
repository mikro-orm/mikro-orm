import { DatabaseSchema, EntitySchema, MikroORM, MySqlDriver } from '@mikro-orm/mysql';
import { Entity, PrimaryKey, Property, Trigger, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Trigger({
  name: 'trg_price',
  timing: 'before',
  events: ['insert'],
  body: `SET NEW.price = NEW.price + 1`,
})
@Entity()
class TriggerEntity {
  @PrimaryKey()
  id!: number;

  @Property()
  price!: number;
}

describe('trigger [mysql]', () => {
  test('trigger is generated for decorator [mysql]', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [TriggerEntity],
      dbName: `mikro_orm_test_trigger_mysql_1`,
      port: 3308,
    });

    const diff = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mysql-trigger-decorator');

    const meta = orm.getMetadata(TriggerEntity);
    expect(meta.triggers).toEqual([
      {
        name: 'trg_price',
        timing: 'before',
        events: ['insert'],
        forEach: 'row',
        body: 'SET NEW.price = NEW.price + 1',
      },
    ]);

    await orm.schema.dropDatabase();
    await orm.close();
  });

  test('trigger diff [mysql]', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [TriggerEntity],
      discovery: { warnWhenNoEntities: false },
      dbName: `mikro_orm_test_trigger_mysql_2`,
      port: 3308,
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
        price: {
          type: 'number',
          name: 'price',
          fieldName: 'price',
          columnType: 'int',
        },
      },
      name: 'TriggerTable',
      tableName: 'trigger_table',
      triggers: [
        {
          name: 'trg_audit',
          timing: 'before',
          events: ['insert'],
          body: `SET NEW.price = NEW.price + 1`,
        },
      ],
    }).init().meta;
    meta.set(newTableMeta.class, newTableMeta);

    let diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mysql-trigger-diff-1');
    await orm.schema.execute(diff);

    // Remove trigger
    newTableMeta.triggers = [];
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mysql-trigger-diff-2');
    await orm.schema.execute(diff);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    await orm.schema.dropDatabase();
    await orm.close();
  });

  test('trigger with multiple events [mysql]', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [TriggerEntity],
      discovery: { warnWhenNoEntities: false },
      dbName: `mikro_orm_test_trigger_mysql_3`,
      port: 3308,
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
          timing: 'before',
          events: ['insert', 'update'],
          body: `SET NEW.id = NEW.id`,
        },
      ],
    }).init().meta;
    meta.set(newTableMeta.class, newTableMeta);

    const diff = await orm.schema.getCreateSchemaSQL({ wrap: false });
    // MySQL should split into two triggers: trg_multi_insert and trg_multi_update
    expect(diff).toContain('trg_multi_insert');
    expect(diff).toContain('trg_multi_update');

    await orm.schema.dropDatabase();
    await orm.close();
  });

  test('trigger round-trip with multi-event grouping [mysql]', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [TriggerEntity],
      discovery: { warnWhenNoEntities: false },
      dbName: `mikro_orm_test_trigger_mysql_4`,
      port: 3308,
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
      name: 'MultiEvt2',
      tableName: 'multi_evt2',
      triggers: [
        {
          name: 'trg_multi',
          timing: 'before',
          events: ['insert', 'update'],
          body: `SET NEW.id = NEW.id`,
        },
      ],
    }).init().meta;
    meta.set(newTableMeta.class, newTableMeta);

    let diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    await orm.schema.execute(diff);

    // Round-trip: multi-event trigger should be re-grouped from per-event triggers
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    await orm.schema.dropDatabase();
    await orm.close();
  });
});
