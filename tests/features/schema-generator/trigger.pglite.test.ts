import { EntitySchema, MikroORM } from '@mikro-orm/pglite';

const Item = new EntitySchema({
  name: 'PgliteConstraintItem',
  tableName: 'pglite_constraint_item',
  properties: {
    id: { primary: true, name: 'id', type: 'number', fieldName: 'id', columnType: 'int' },
    qty: { type: 'number', name: 'qty', fieldName: 'qty', columnType: 'int' },
  },
  triggers: [
    {
      name: 'trg_qty',
      timing: 'after',
      events: ['insert', 'update'],
      body: `IF EXISTS (SELECT 1 FROM pglite_constraint_item WHERE id = NEW.id AND qty < 0) THEN RAISE EXCEPTION 'negative qty'; END IF; RETURN NULL`,
      constraint: true,
      deferMode: 'deferred',
    },
  ],
});

describe('constraint trigger [pglite]', () => {
  test('constraint trigger round-trips and defers the check to commit [pglite]', async () => {
    const orm = await MikroORM.init({ entities: [Item], dbName: 'memory://' });
    await orm.schema.create();
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

    await orm.em.transactional(async em => {
      await em.execute(`insert into "pglite_constraint_item" ("id", "qty") values (1, -1)`);
      await em.execute(`update "pglite_constraint_item" set "qty" = 5 where "id" = 1`);
    });

    await expect(
      orm.em.transactional(async em => {
        await em.execute(`insert into "pglite_constraint_item" ("id", "qty") values (2, -1)`);
      }),
    ).rejects.toThrow(/negative qty/);

    await orm.close(true);
  });
});
