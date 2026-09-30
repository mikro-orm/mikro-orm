import { DatabaseSchema, EntitySchema, MikroORM, OracleDriver, type TriggerDef } from '@mikro-orm/oracledb';
import { Entity, PrimaryKey, Property, Trigger, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Trigger({
  name: 'trg_price_tax',
  timing: 'before',
  events: ['insert', 'update'],
  body: `:new."price_with_tax" := :new."price" * 1.2`,
})
@Entity({ tableName: 'trigger_entity' })
class TriggerEntity {
  @PrimaryKey()
  id!: number;

  @Property()
  price!: number;

  @Property({ nullable: true })
  priceWithTax?: number;
}

function createProductSchema(triggers: TriggerDef[]) {
  return new EntitySchema({
    name: 'TrgProduct',
    tableName: 'trg_product',
    properties: {
      id: { primary: true, type: 'number' },
      price: { type: 'number' },
      label: { type: 'string', nullable: true },
    },
    triggers,
  });
}

const TrgLog = new EntitySchema({
  name: 'TrgLog',
  tableName: 'trg_log',
  properties: {
    id: { primary: true, type: 'number' },
    message: { type: 'string' },
  },
});

async function init(entities: any[]) {
  const orm = await MikroORM.init({
    driver: OracleDriver,
    metadataProvider: ReflectMetadataProvider,
    entities,
    dbName: 'mikro_orm_test_trigger_oracle',
    password: 'oracle123',
    schemaGenerator: { managementDbName: 'system', tableSpace: 'mikro_orm' },
  });
  await orm.schema.ensureDatabase();
  await orm.schema.refresh({ dropDb: true });
  return orm;
}

async function getTriggers(orm: MikroORM, table: string) {
  const dbSchema = await DatabaseSchema.create(orm.em.getConnection(), orm.em.getPlatform(), orm.config);
  return dbSchema.getTable(table)!.getTriggers();
}

describe('trigger [oracle]', () => {
  test('create DDL and the trigger fires [oracle]', async () => {
    const orm = await init([TriggerEntity]);
    expect(await orm.schema.getCreateSchemaSQL({ wrap: false })).toMatchSnapshot();
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    const em = orm.em.fork();
    const entity = em.create(TriggerEntity, { price: 100 });
    await em.flush();
    em.clear();
    expect((await em.findOneOrFail(TriggerEntity, entity.id)).priceWithTax).toBe(120);

    await em.nativeUpdate(TriggerEntity, entity.id, { price: 200 });
    em.clear();
    expect((await em.findOneOrFail(TriggerEntity, entity.id)).priceWithTax).toBe(240);

    const [trigger] = await getTriggers(orm, 'trigger_entity');
    expect(trigger).toEqual({
      name: 'trg_price_tax',
      timing: 'before',
      events: ['insert', 'update'],
      forEach: 'row',
      body: ':new."price_with_tax" := :new."price" * 1.2',
    });

    await orm.close();
  });

  test('multi-event statement-level trigger and when clause [oracle]', async () => {
    const product = createProductSchema([
      {
        name: 'trg_product_stmt',
        timing: 'after',
        events: ['insert', 'update', 'delete'],
        forEach: 'statement',
        body: `insert into "trg_log" ("message") values ('statement');\ninsert into "trg_log" ("message") values ('statement 2');`,
      },
      {
        name: 'trg_product_when',
        timing: 'before',
        events: ['insert'],
        when: `new."price" > 100`,
        body: `:new."label" := 'expensive'`,
      },
    ]);
    const orm = await init([TrgLog, product]);
    const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql).toContain(
      `create or replace trigger "trg_product_stmt" AFTER INSERT OR UPDATE OR DELETE on "trg_product" begin insert into "trg_log" ("message") values ('statement'); insert into "trg_log" ("message") values ('statement 2'); end;`,
    );
    expect(sql).toContain(
      `create or replace trigger "trg_product_when" BEFORE INSERT on "trg_product" for each row when (new."price" > 100) begin :new."label" := 'expensive'; end;`,
    );
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    const em = orm.em.fork();
    await em.insertMany(product, [
      { id: 1, price: 50 },
      { id: 2, price: 150 },
    ]);
    const products = await em.getConnection().execute(`select "id", "label" from "trg_product" order by "id"`);
    expect(products).toEqual([
      { id: 1, label: null },
      { id: 2, label: 'expensive' },
    ]);
    await em.nativeDelete(product, {});
    // one statement-level firing per statement, not per row
    expect(await em.count(TrgLog)).toBe(4);

    const triggers = await getTriggers(orm, 'trg_product');
    expect(triggers).toEqual([
      {
        name: 'trg_product_stmt',
        timing: 'after',
        events: ['insert', 'update', 'delete'],
        forEach: 'statement',
        body: `insert into "trg_log" ("message") values ('statement'); insert into "trg_log" ("message") values ('statement 2')`,
      },
      {
        name: 'trg_product_when',
        timing: 'before',
        events: ['insert'],
        forEach: 'row',
        when: 'new."price" > 100',
        body: `:new."label" := 'expensive'`,
      },
    ]);

    await orm.close();
  });

  test('trigger diff: add, change and remove [oracle]', async () => {
    const product = createProductSchema([]);
    const orm = await init([product]);
    const meta = orm.getMetadata(product);

    meta.triggers = [{ name: 'trg_label', timing: 'before', events: ['insert'], body: `:new."label" := 'v1'` }];
    let diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe(
      `create or replace trigger "trg_label" BEFORE INSERT on "trg_product" for each row begin :new."label" := 'v1'; end;\n`,
    );
    await orm.schema.execute(diff);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    meta.triggers = [{ name: 'trg_label', timing: 'before', events: ['insert'], body: `:new."label" := 'v2'` }];
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe(
      `drop trigger if exists "trg_label";\n` +
        `create or replace trigger "trg_label" BEFORE INSERT on "trg_product" for each row begin :new."label" := 'v2'; end;\n`,
    );
    await orm.schema.execute(diff);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    const em = orm.em.fork();
    await em.insert(product, { id: 1, price: 10 });
    const [row] = await em.getConnection().execute(`select "label" from "trg_product"`);
    expect(row.label).toBe('v2');

    meta.triggers = [];
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe(`drop trigger if exists "trg_label";\n`);
    await orm.schema.execute(diff);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
    expect(await getTriggers(orm, 'trg_product')).toEqual([]);

    await orm.close();
  });

  test('trigger with expression escape hatch [oracle]', async () => {
    const expression = `create or replace trigger "trg_expr" before insert on "trg_product" for each row begin :new."label" := 'expr'; end;`;
    const product = createProductSchema([{ name: 'trg_expr', timing: 'before', events: ['insert'], expression }]);
    const orm = await init([product]);
    expect(await orm.schema.getCreateSchemaSQL({ wrap: false })).toContain(expression);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    const em = orm.em.fork();
    await em.insert(product, { id: 1, price: 10 });
    const [row] = await em.getConnection().execute(`select "label" from "trg_product"`);
    expect(row.label).toBe('expr');

    await orm.close();
  });

  test('trigger in non-default schema [oracle]', async () => {
    const product = new EntitySchema({
      name: 'TrgNsProduct',
      tableName: 'trg_ns_product',
      schema: 'trg_ns',
      properties: {
        id: { primary: true, type: 'number' },
        label: { type: 'string', nullable: true },
      },
      triggers: [{ name: 'trg_ns_label', timing: 'before', events: ['insert'], body: `:new."label" := 'ns'` }],
    });
    const orm = await MikroORM.init({
      driver: OracleDriver,
      metadataProvider: ReflectMetadataProvider,
      entities: [product],
      dbName: 'mikro_orm_test_trigger_oracle',
      password: 'oracle123',
      schemaGenerator: { managementDbName: 'system', tableSpace: 'mikro_orm' },
    });
    await orm.schema.ensureDatabase();
    await orm.schema.dropNamespace('trg_ns');
    const sql = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    // the update path creates the namespace and grants the privileges needed for it
    await orm.schema.update();
    expect(sql).toContain(
      `create or replace trigger "trg_ns"."trg_ns_label" BEFORE INSERT on "trg_ns"."trg_ns_product" for each row begin :new."label" := 'ns'; end;`,
    );
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    const em = orm.em.fork();
    await em.insert(product, { id: 1 });
    const [row] = await em.getConnection().execute(`select "label" from "trg_ns"."trg_ns_product"`);
    expect(row.label).toBe('ns');

    orm.getMetadata(product).triggers = [];
    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe(`drop trigger if exists "trg_ns"."trg_ns_label";\n`);
    await orm.schema.execute(diff);
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    await orm.close();
  });

  test('unsupported trigger definitions throw [oracle]', async () => {
    const product = createProductSchema([]);
    const orm = await MikroORM.init({
      driver: OracleDriver,
      metadataProvider: ReflectMetadataProvider,
      entities: [product],
      dbName: 'mikro_orm_test_trigger_oracle',
      password: 'oracle123',
    });
    const meta = orm.getMetadata(product);

    meta.triggers = [{ name: 'trg_bad', timing: 'instead of', events: ['insert'], body: 'null' }];
    await expect(orm.schema.getCreateSchemaSQL()).rejects.toThrow(
      'Oracle supports INSTEAD OF triggers only on views. Use BEFORE or AFTER for trigger "trg_bad".',
    );

    meta.triggers = [{ name: 'trg_bad', timing: 'after', events: ['truncate'], body: 'null' }];
    await expect(orm.schema.getCreateSchemaSQL()).rejects.toThrow(
      'Oracle does not support TRUNCATE triggers. Remove the TRUNCATE event from trigger "trg_bad".',
    );

    meta.triggers = [
      { name: 'trg_bad', timing: 'after', events: ['insert'], forEach: 'statement', when: '1 = 1', body: 'null' },
    ];
    await expect(orm.schema.getCreateSchemaSQL()).rejects.toThrow(
      'Oracle supports WHEN conditions only on row-level triggers (trigger "trg_bad").',
    );

    await orm.close();
  });
});
