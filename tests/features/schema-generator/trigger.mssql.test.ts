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

  test('trigger round-trip via introspection [mssql]', async () => {
    // Executes the DDL so that getAllTriggers / loadInformationSchema pick up the trigger
    // and exercise the SQL introspection path (getAllTriggers, dedupeKey, body parse).
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      discovery: { warnWhenNoEntities: false },
      dbName: `mikro_orm_test_trigger_mssql_rt`,
      password: 'Root.Root',
    });
    const meta = orm.getMetadata();
    await orm.schema.ensureDatabase();

    const newTableMeta = new EntitySchema({
      properties: {
        id: { primary: true, name: 'id', type: 'number', fieldName: 'id', columnType: 'int' },
      },
      name: 'RtTrg',
      tableName: 'rt_trg',
      triggers: [{ name: 'trg_rt_multi', timing: 'after', events: ['insert', 'update'], body: `PRINT 'multi'` }],
    }).init().meta;
    meta.set(newTableMeta.class, newTableMeta);

    let diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    await orm.schema.execute(diff);

    // Read from DB via getAllTriggers — the DatabaseSchema instance now contains the trigger
    // parsed from sys.triggers/object_definition.
    const { DatabaseSchema } = await import('@mikro-orm/mssql');
    const dbSchema = await DatabaseSchema.create(orm.em.getConnection(), orm.em.getPlatform(), orm.config);
    const introTable = dbSchema.getTable('rt_trg')!;
    const introTriggers = introTable.getTriggers();
    expect(introTriggers).toHaveLength(1);
    expect(introTriggers[0].name).toBe('trg_rt_multi');
    expect(introTriggers[0].events.sort()).toEqual(['insert', 'update']);
    expect(introTriggers[0].timing).toBe('after');
    expect(introTriggers[0].forEach).toBe('row');
    expect(introTriggers[0].body).toContain("PRINT 'multi'");

    // Remove the trigger — exercises the dropTrigger path against a real DB-backed trigger.
    newTableMeta.triggers = [];
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain('drop trigger if exists');
    await orm.schema.execute(diff);

    await orm.schema.dropDatabase();
    await orm.close();
  });

  test('trigger with expression escape hatch [mssql]', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [TriggerEntity],
      discovery: { warnWhenNoEntities: false },
      dbName: `mikro_orm_test_trigger_mssql_expr`,
      password: 'Root.Root',
    });
    const meta = orm.getMetadata();
    await orm.schema.ensureDatabase();

    const newTableMeta = new EntitySchema({
      properties: {
        id: { primary: true, name: 'id', type: 'number', fieldName: 'id', columnType: 'int' },
      },
      name: 'ExprTrg',
      tableName: 'expr_trg',
      triggers: [
        {
          name: 'trg_custom_expr',
          timing: 'after' as const,
          events: ['insert' as const],
          expression: `create trigger [trg_custom_expr] on [expr_trg] AFTER INSERT as begin PRINT 'expr'; end`,
        },
      ],
    }).init().meta;
    meta.set(newTableMeta.class, newTableMeta);

    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain('trg_custom_expr');
    // Verbatim expression is emitted, not the canonical form
    expect(diff).toContain("PRINT 'expr'");

    await orm.schema.dropDatabase();
    await orm.close();
  });

  test('trigger in non-default schema [mssql]', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [TriggerEntity],
      discovery: { warnWhenNoEntities: false },
      dbName: `mikro_orm_test_trigger_mssql_ns`,
      password: 'Root.Root',
    });
    const meta = orm.getMetadata();
    await orm.schema.ensureDatabase();

    const newTableMeta = new EntitySchema({
      properties: {
        id: { primary: true, name: 'id', type: 'number', fieldName: 'id', columnType: 'int' },
      },
      name: 'NsTrg',
      tableName: 'ns_trg',
      schema: 'custom_trg_schema',
      triggers: [{ name: 'trg_ns', timing: 'after', events: ['insert'], body: `PRINT 'ns'` }],
    }).init().meta;
    meta.set(newTableMeta.class, newTableMeta);

    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    // Schema-qualified trigger name when table is in non-default schema
    expect(diff).toContain('[custom_trg_schema].[trg_ns]');
    await orm.schema.execute(diff);

    // Exercise the dropTrigger path in non-default schema
    newTableMeta.triggers = [];
    const dropDiff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(dropDiff).toContain('[custom_trg_schema].[trg_ns]');

    await orm.schema.dropDatabase();
    await orm.close();
  });
});
