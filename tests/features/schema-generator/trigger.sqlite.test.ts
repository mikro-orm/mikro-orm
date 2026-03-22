import { DatabaseSchema, EntitySchema, MikroORM } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, Trigger, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Trigger({
  name: 'update_timestamp',
  timing: 'after',
  events: ['insert'],
  body: `UPDATE trigger_entity SET price = price + 1 WHERE id = NEW.id`,
})
@Entity()
class TriggerEntity {
  @PrimaryKey()
  id!: number;

  @Property()
  price!: number;
}

describe('trigger [sqlite]', () => {
  test('trigger is generated for decorator [sqlite]', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [TriggerEntity],
      dbName: ':memory:',
    });

    const diff = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('sqlite-trigger-decorator');

    const meta = orm.getMetadata(TriggerEntity);
    expect(meta.triggers).toEqual([
      {
        name: 'update_timestamp',
        timing: 'after',
        events: ['insert'],
        forEach: 'row',
        body: 'UPDATE trigger_entity SET price = price + 1 WHERE id = NEW.id',
      },
    ]);

    await orm.close();
  });

  test('trigger diff [sqlite]', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [TriggerEntity],
      dbName: ':memory:',
      discovery: { warnWhenNoEntities: false },
    });
    const meta = orm.getMetadata();

    const newTableMeta = new EntitySchema({
      properties: {
        id: {
          primary: true,
          name: 'id',
          type: 'number',
          fieldName: 'id',
          columnType: 'integer',
        },
        price: {
          type: 'number',
          name: 'price',
          fieldName: 'price',
          columnType: 'integer',
        },
      },
      name: 'TriggerTable',
      tableName: 'trigger_table',
      triggers: [
        {
          name: 'trg_audit',
          timing: 'after',
          events: ['insert'],
          body: `UPDATE trigger_table SET price = price + 1 WHERE id = NEW.id`,
        },
      ],
    }).init().meta;
    meta.set(newTableMeta.class, newTableMeta);

    let diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('sqlite-trigger-diff-1');
    await orm.schema.execute(diff);

    // Change trigger body
    newTableMeta.triggers = [
      {
        name: 'trg_audit',
        timing: 'after',
        events: ['insert'],
        body: `UPDATE trigger_table SET price = price + 2 WHERE id = NEW.id`,
      },
    ];
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('sqlite-trigger-diff-2');
    await orm.schema.execute(diff);

    // Remove trigger
    newTableMeta.triggers = [];
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('sqlite-trigger-diff-3');
    await orm.schema.execute(diff);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    await orm.close();
  });

  test('trigger with multiple events [sqlite]', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [TriggerEntity],
      dbName: ':memory:',
      discovery: { warnWhenNoEntities: false },
    });
    const meta = orm.getMetadata();

    const newTableMeta = new EntitySchema({
      properties: {
        id: {
          primary: true,
          name: 'id',
          type: 'number',
          fieldName: 'id',
          columnType: 'integer',
        },
      },
      name: 'MultiEvt',
      tableName: 'multi_evt',
      triggers: [
        {
          name: 'trg_multi',
          timing: 'after',
          events: ['insert', 'update'],
          body: `SELECT 1`,
        },
      ],
    }).init().meta;
    meta.set(newTableMeta.class, newTableMeta);

    const diff = await orm.schema.getCreateSchemaSQL({ wrap: false });
    // SQLite should split into two triggers: trg_multi_insert and trg_multi_update
    expect(diff).toContain('trg_multi_insert');
    expect(diff).toContain('trg_multi_update');

    await orm.close();
  });
});
