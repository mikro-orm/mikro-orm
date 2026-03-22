import { defineEntity, MikroORM, p, quote } from '@mikro-orm/sqlite';

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
});
