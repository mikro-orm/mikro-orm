import { EntitySchema, MikroORM } from '@mikro-orm/mariadb';
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

describe('trigger [mariadb]', () => {
  test('trigger is generated for decorator [mariadb]', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [TriggerEntity],
      dbName: `mikro_orm_test_trigger_mariadb_1`,
      port: 3309,
    });

    const diff = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mariadb-trigger-decorator');

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

  test('trigger diff [mariadb]', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [TriggerEntity],
      discovery: { warnWhenNoEntities: false },
      dbName: `mikro_orm_test_trigger_mariadb_2`,
      port: 3309,
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
    expect(diff).toMatchSnapshot('mariadb-trigger-diff-1');
    await orm.schema.execute(diff);

    // Remove trigger
    newTableMeta.triggers = [];
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mariadb-trigger-diff-2');
    await orm.schema.execute(diff);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    await orm.schema.dropDatabase();
    await orm.close();
  });
});
