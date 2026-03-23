import { defineEntity, EntitySchema, MikroORM, p, quote } from '@mikro-orm/sqlite';
import { MikroORM as MongoMikroORM } from '@mikro-orm/mongodb';
import { MetadataError } from '@mikro-orm/core';

const AuditSchema = defineEntity({
  name: 'AuditTable',
  properties: {
    id: p.integer().primary(),
    value: p.integer().default(0),
    counter: p.integer().default(0),
  },
  triggers: [
    {
      name: 'trg_counter',
      timing: 'after',
      events: ['insert'],
      body: `UPDATE audit_table SET counter = counter + 1 WHERE id = NEW.id`,
    },
  ],
});
class AuditTable extends AuditSchema.class {}
AuditSchema.setClass(AuditTable);

const CallbackSchema = defineEntity({
  name: 'CallbackTable',
  properties: {
    id: p.integer().primary(),
    price: p.integer().default(0),
  },
  triggers: [
    {
      name: 'trg_price',
      timing: 'before',
      events: ['insert'],
      body: columns => quote`UPDATE callback_table SET ${columns.price} = 42 WHERE id = NEW.id`,
    },
  ],
});
class CallbackTable extends CallbackSchema.class {}
CallbackSchema.setClass(CallbackTable);

describe('trigger (defineEntity)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: ':memory:',
      entities: [AuditTable, CallbackTable],
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  it('should create trigger via defineEntity', async () => {
    const meta = orm.getMetadata(AuditTable);
    expect(meta.triggers).toEqual([
      {
        name: 'trg_counter',
        timing: 'after',
        events: ['insert'],
        forEach: 'row',
        body: 'UPDATE audit_table SET counter = counter + 1 WHERE id = NEW.id',
      },
    ]);
    expect(meta.hasTriggers).toBe(true);
  });

  it('should resolve trigger callback body in DDL', async () => {
    const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql).toContain('UPDATE callback_table SET `price` = 42 WHERE id = NEW.id');
  });

  it('should generate DDL with triggers', async () => {
    const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql).toContain('create trigger');
    expect(sql).toContain('trg_counter');
    expect(sql).toContain('trg_price');
  });

  it('should throw when both body and expression are set', async () => {
    await expect(
      MikroORM.init({
        dbName: ':memory:',
        entities: [
          new EntitySchema({
            name: 'BadEntity1',
            properties: { id: { type: 'number', primary: true } },
            triggers: [
              { name: 'trg', timing: 'after', events: ['insert'], body: 'SELECT 1', expression: 'CREATE TRIGGER ...' },
            ],
          }),
        ],
      }),
    ).rejects.toThrow(MetadataError);
  });

  it('should throw when neither body nor expression is set', async () => {
    await expect(
      MikroORM.init({
        dbName: ':memory:',
        entities: [
          new EntitySchema({
            name: 'BadEntity2',
            properties: { id: { type: 'number', primary: true } },
            triggers: [{ name: 'trg', timing: 'after', events: ['insert'] }],
          }),
        ],
      }),
    ).rejects.toThrow(MetadataError);
  });

  it('should introspect triggers from SQLite and produce no drift', async () => {
    const schema1 = new EntitySchema({
      name: 'IntroTable',
      tableName: 'intro_table',
      properties: {
        id: { type: 'number', primary: true, fieldName: 'id', columnType: 'integer' },
        val: { type: 'number', name: 'val', fieldName: 'val', columnType: 'integer' },
      },
      triggers: [
        {
          name: 'trg_intro',
          timing: 'after',
          events: ['insert'],
          body: 'UPDATE intro_table SET val = val + 1 WHERE id = NEW.id',
        },
      ],
    });
    const orm2 = await MikroORM.init({
      dbName: ':memory:',
      entities: [schema1],
    });
    await orm2.schema.refresh();

    // Round-trip: should produce no diff
    const diff = await orm2.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    await orm2.close();
  });

  it('should detect trigger changes on SQLite', async () => {
    const schema1 = new EntitySchema({
      name: 'DiffTable',
      tableName: 'diff_table',
      properties: {
        id: { type: 'number', primary: true, fieldName: 'id', columnType: 'integer' },
        val: { type: 'number', name: 'val', fieldName: 'val', columnType: 'integer' },
      },
      triggers: [
        {
          name: 'trg_diff',
          timing: 'after',
          events: ['insert'],
          body: 'UPDATE diff_table SET val = 1 WHERE id = NEW.id',
        },
      ],
    });
    const orm2 = await MikroORM.init({
      dbName: ':memory:',
      entities: [schema1],
    });
    await orm2.schema.refresh();

    // Change the trigger body
    const meta = orm2.getMetadata().get('DiffTable');
    meta.triggers = [
      {
        name: 'trg_diff',
        timing: 'after',
        events: ['insert'],
        forEach: 'row',
        body: 'UPDATE diff_table SET val = 2 WHERE id = NEW.id',
      },
    ];
    let diff = await orm2.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain('drop trigger');
    expect(diff).toContain('create trigger');
    await orm2.schema.execute(diff);

    // Remove trigger
    meta.triggers = [];
    diff = await orm2.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain('drop trigger');
    await orm2.schema.execute(diff);
    diff = await orm2.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    await orm2.close();
  });

  it('should handle expression trigger without drift', async () => {
    const schema1 = new EntitySchema({
      name: 'ExprTable',
      tableName: 'expr_table',
      properties: {
        id: { type: 'number', primary: true, fieldName: 'id', columnType: 'integer' },
      },
      triggers: [
        {
          name: 'trg_expr',
          timing: 'after' as const,
          events: ['insert' as const],
          expression: 'create trigger "trg_expr" AFTER INSERT on "expr_table" for each ROW begin SELECT 1; end',
        },
      ],
    });
    const orm2 = await MikroORM.init({
      dbName: ':memory:',
      entities: [schema1],
    });
    await orm2.schema.refresh();

    // Expression triggers skip diffing — should produce no drift
    const diff = await orm2.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    await orm2.close();
  });

  it('should throw on MongoDB when triggers are defined', async () => {
    await expect(
      MongoMikroORM.init({
        dbName: 'mikro_orm_test_trigger_mongo',
        entities: [
          new EntitySchema({
            name: 'MongoTrigger',
            properties: { id: { type: 'number', primary: true } },
            triggers: [{ name: 'trg', timing: 'after', events: ['insert'], body: 'SELECT 1' }],
          }),
        ],
      }),
    ).rejects.toThrow(/triggers.*not supported/i);
  });

  it('should handle multi-event triggers on SQLite', async () => {
    const schema1 = new EntitySchema({
      name: 'MultiTable',
      tableName: 'multi_table',
      properties: {
        id: { type: 'number', primary: true, fieldName: 'id', columnType: 'integer' },
      },
      triggers: [
        {
          name: 'trg_multi',
          timing: 'after',
          events: ['insert', 'update'],
          body: 'SELECT 1',
        },
      ],
    });
    const orm2 = await MikroORM.init({
      dbName: ':memory:',
      entities: [schema1],
    });
    await orm2.schema.refresh();

    // Multi-event triggers produce two physical triggers; round-trip should still be clean
    const diff = await orm2.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    // Remove and verify clean drop
    const meta = orm2.getMetadata().get('MultiTable');
    meta.triggers = [];
    const dropDiff = await orm2.schema.getUpdateSchemaSQL({ wrap: false });
    expect(dropDiff).toContain('drop trigger');
    await orm2.schema.execute(dropDiff);

    await orm2.close();
  });
});
