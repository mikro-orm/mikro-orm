import { DatabaseSchema, EntitySchema, MikroORM } from '@mikro-orm/postgresql';
import { Entity, PrimaryKey, Property, Trigger, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { initORMPostgreSql } from '../../bootstrap.js';

@Trigger({
  name: 'update_timestamp',
  timing: 'before',
  events: ['insert', 'update'],
  body: `NEW.updated_at = NOW(); RETURN NEW`,
})
@Entity()
class TriggerEntity {
  @PrimaryKey()
  id!: number;

  @Property()
  price!: number;

  @Property()
  updatedAt!: Date;
}

describe('trigger [postgres]', () => {
  test('trigger is generated for decorator [postgres]', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [TriggerEntity],
      dbName: `mikro_orm_test_trigger_1`,
    });

    const diff = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-trigger-decorator');

    const meta = orm.getMetadata(TriggerEntity);
    expect(meta.triggers).toEqual([
      {
        name: 'update_timestamp',
        timing: 'before',
        events: ['insert', 'update'],
        forEach: 'row',
        body: 'NEW.updated_at = NOW(); RETURN NEW',
      },
    ]);

    await orm.schema.dropDatabase();
    await orm.close();
  });

  test('trigger diff [postgres]', async () => {
    const orm = await initORMPostgreSql();
    const meta = orm.getMetadata();
    await orm.schema.update();

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
          timing: 'after',
          events: ['insert'],
          body: `RETURN NEW`,
        },
      ],
    }).init().meta;
    meta.set(newTableMeta.class, newTableMeta);

    let diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-trigger-diff-1');
    await orm.schema.execute(diff);

    // Update a trigger body
    newTableMeta.triggers = [
      {
        name: 'trg_audit',
        timing: 'after',
        events: ['insert', 'update'],
        body: `RETURN NEW`,
      },
    ];
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-trigger-diff-2');
    await orm.schema.execute(diff);

    // Remove a trigger
    newTableMeta.triggers = [];
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-trigger-diff-3');
    await orm.schema.execute(diff);

    // Add new trigger
    newTableMeta.triggers = [
      {
        name: 'trg_log',
        timing: 'before',
        events: ['delete'],
        body: `RETURN OLD`,
      },
    ];
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-trigger-diff-4');
    await orm.schema.execute(diff);

    // Round-trip idempotency: re-reading the trigger from DB should produce no diff
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    await orm.schema.dropDatabase();
    await orm.close();
  });

  test('trigger with expression escape hatch [postgres]', async () => {
    const orm = await initORMPostgreSql();
    const meta = orm.getMetadata();
    await orm.schema.update();

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
      name: 'ExprTriggerTable',
      tableName: 'expr_trigger_table',
      triggers: [
        {
          name: 'trg_custom',
          timing: 'after' as const,
          events: ['insert' as const],
          expression: `create or replace function "trg_custom_fn"() returns trigger as $$
begin
  RETURN NEW;
end;
$$ language plpgsql;
create trigger "trg_custom"
AFTER INSERT on "expr_trigger_table"
for each ROW
execute function "trg_custom_fn"()`,
        },
      ],
    }).init().meta;
    meta.set(newTableMeta.class, newTableMeta);

    let diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain('trg_custom');
    await orm.schema.execute(diff);

    await orm.schema.dropDatabase();
    await orm.close();
  });
});
