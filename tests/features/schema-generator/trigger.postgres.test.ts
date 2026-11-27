import { rm } from 'node:fs/promises';
import { defineEntity, EntitySchema, MikroORM, p } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import { Entity, PrimaryKey, Property, Trigger, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { initORMPostgreSql } from '../../bootstrap.js';
import { TEMP_DIR } from '../../helpers.js';

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

  test('trigger with FOR EACH STATEMENT and WHEN clause [postgres]', async () => {
    const orm = await initORMPostgreSql();
    const meta = orm.getMetadata();
    await orm.schema.update();

    const newTableMeta = new EntitySchema({
      properties: {
        id: { primary: true, name: 'id', type: 'number', fieldName: 'id', columnType: 'int' },
      },
      name: 'StmtTrg',
      tableName: 'stmt_trg',
      triggers: [
        {
          name: 'trg_stmt',
          timing: 'after',
          events: ['insert'],
          forEach: 'statement',
          when: 'pg_trigger_depth() = 0',
          body: 'RETURN NULL',
        },
      ],
    }).init().meta;
    meta.set(newTableMeta.class, newTableMeta);

    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain('for each STATEMENT');
    expect(diff).toContain('when (pg_trigger_depth() = 0)');

    await orm.schema.dropDatabase();
    await orm.close();
  });

  test('trigger in non-default schema [postgres]', async () => {
    const schema1 = new EntitySchema({
      properties: {
        id: {
          primary: true,
          name: 'id',
          type: 'number',
          fieldName: 'id',
          columnType: 'int',
        },
      },
      name: 'CustomSchemaTrigger',
      tableName: 'custom_schema_trigger',
      schema: 'trg_schema',
      triggers: [
        {
          name: 'trg_ns',
          timing: 'after',
          events: ['insert'],
          body: 'RETURN NEW',
        },
      ],
    });
    const orm = await MikroORM.init({
      entities: [schema1],
      dbName: `mikro_orm_test_trigger_ns`,
      schema: 'trg_schema',
    });

    await orm.schema.ensureDatabase();
    await orm.em.getConnection().execute('create schema if not exists "trg_schema"');

    const diff = await orm.schema.getCreateSchemaSQL({ wrap: false });
    // fn name must be qualified with the non-default schema in both create and drop DDL
    expect(diff).toContain('"trg_schema"."custom_schema_trigger_trg_ns_fn"');

    await orm.schema.execute(diff);

    // Remove the trigger -> dropTrigger must emit the schema-qualified fn name
    const metaEntry = orm.getMetadata(schema1);
    metaEntry.triggers = [];
    const dropDiff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(dropDiff).toContain('"trg_schema"."custom_schema_trigger_trg_ns_fn"');

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

    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain('trg_custom');
    await orm.schema.execute(diff);

    await orm.schema.dropDatabase();
    await orm.close();
  });

  test('trigger with expression escape hatch is not diffed in the reverse direction [postgres]', async () => {
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
      name: 'ExprDownTriggerTable',
      tableName: 'expr_down_trigger_table',
      // fn name follows the `{table}_{trigger}_fn` convention, so introspection reports a body to diff against
      triggers: [
        {
          name: 'trg_custom',
          timing: 'after' as const,
          events: ['insert' as const],
          expression: `create or replace function "expr_down_trigger_table_trg_custom_fn"() returns trigger as $$
begin
  RETURN NEW;
end;
$$ language plpgsql;
create trigger "trg_custom"
AFTER INSERT on "expr_down_trigger_table"
for each ROW
execute function "expr_down_trigger_table_trg_custom_fn"()`,
        },
      ],
    }).init().meta;
    meta.set(newTableMeta.class, newTableMeta);

    await orm.schema.execute(await orm.schema.getUpdateSchemaSQL({ wrap: false }));

    const migration = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
    expect(migration.up).toBe('');
    expect(migration.down).toBe('');

    await orm.schema.dropDatabase();
    await orm.close();
  });

  describe('constraint triggers', () => {
    const qtyCheck = `IF EXISTS (SELECT 1 FROM constraint_trigger_item WHERE id = NEW.id AND qty < 0) THEN RAISE EXCEPTION 'negative qty'; END IF; RETURN NULL`;

    const createSchema = () =>
      new EntitySchema({
        name: 'ConstraintTriggerItem',
        tableName: 'constraint_trigger_item',
        properties: {
          id: { primary: true, name: 'id', type: 'number', fieldName: 'id', columnType: 'int' },
          qty: { type: 'number', name: 'qty', fieldName: 'qty', columnType: 'int' },
        },
        triggers: [
          {
            name: 'trg_qty',
            timing: 'after',
            events: ['insert', 'update'],
            body: qtyCheck,
            constraint: true,
            deferMode: 'deferred',
          },
        ],
      });

    async function init(dbName: string) {
      const schema = createSchema();
      const orm = await MikroORM.init({ entities: [schema], dbName });
      await orm.schema.ensureDatabase();
      return { orm, schema };
    }

    async function applyAndExpectNoDrift(orm: MikroORM, ...expected: string[]) {
      const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
      expect(diff).toContain('drop trigger if exists "trg_qty"');
      for (const fragment of expected) {
        expect(diff).toContain(fragment);
      }
      await orm.schema.execute(diff);
      await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
      return diff;
    }

    test('create schema emits a constraint trigger [postgres]', async () => {
      const { orm } = await init('mikro_orm_test_constraint_trigger_1');

      const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });
      expect(sql).toMatchSnapshot('postgres-constraint-trigger-create');

      await orm.schema.dropDatabase();
      await orm.close();
    });

    test('decorators expose constraint and deferMode on metadata [postgres]', async () => {
      @Trigger({
        name: 'trg_decorated_qty',
        timing: 'after',
        events: ['insert', 'update'],
        constraint: true,
        deferMode: 'deferred',
        body: 'RETURN NULL',
      })
      @Entity({ tableName: 'decorated_constraint_trigger_item' })
      class DecoratedConstraintTriggerItem {
        @PrimaryKey()
        id!: number;
      }

      const orm = await MikroORM.init({
        metadataProvider: ReflectMetadataProvider,
        entities: [DecoratedConstraintTriggerItem],
        dbName: 'mikro_orm_test_constraint_trigger_decorator',
      });

      expect(orm.getMetadata(DecoratedConstraintTriggerItem).triggers).toEqual([
        {
          name: 'trg_decorated_qty',
          timing: 'after',
          events: ['insert', 'update'],
          forEach: 'row',
          constraint: true,
          deferMode: 'deferred',
          body: 'RETURN NULL',
        },
      ]);
      await expect(orm.schema.getCreateSchemaSQL({ wrap: false })).resolves.toContain(
        'create constraint trigger "trg_decorated_qty" AFTER INSERT OR UPDATE on "decorated_constraint_trigger_item" deferrable initially deferred for each ROW',
      );

      await orm.close(true);
    });

    test('defineEntity exposes constraint and deferMode on metadata [postgres]', async () => {
      const DefinedConstraintTriggerItem = defineEntity({
        name: 'DefinedConstraintTriggerItem',
        tableName: 'defined_constraint_trigger_item',
        properties: {
          id: p.integer().primary(),
        },
        triggers: [
          {
            name: 'trg_defined_qty',
            timing: 'after',
            events: ['insert', 'update'],
            constraint: true,
            deferMode: 'immediate',
            body: 'RETURN NULL',
          },
        ],
      });

      const orm = await MikroORM.init({
        entities: [DefinedConstraintTriggerItem],
        dbName: 'mikro_orm_test_constraint_trigger_define_entity',
      });

      expect(orm.getMetadata(DefinedConstraintTriggerItem).triggers).toEqual([
        {
          name: 'trg_defined_qty',
          timing: 'after',
          events: ['insert', 'update'],
          forEach: 'row',
          constraint: true,
          deferMode: 'immediate',
          body: 'RETURN NULL',
        },
      ]);
      await expect(orm.schema.getCreateSchemaSQL({ wrap: false })).resolves.toContain(
        'create constraint trigger "trg_defined_qty" AFTER INSERT OR UPDATE on "defined_constraint_trigger_item" deferrable initially immediate for each ROW',
      );

      await orm.close(true);
    });

    test('constraint trigger round-trips and diffs every option [postgres]', async () => {
      const { orm, schema } = await init('mikro_orm_test_constraint_trigger_2');
      const meta = orm.getMetadata(schema);
      const base = meta.triggers[0];

      await orm.schema.execute(await orm.schema.getCreateSchemaSQL({ wrap: false }));
      await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

      const rows = await orm.em
        .getConnection()
        .execute(
          `select tgconstraint <> 0 as c, tgdeferrable as d, tginitdeferred as i from pg_trigger where tgname = 'trg_qty'`,
        );
      expect(rows).toEqual([{ c: true, d: true, i: true }]);

      meta.triggers = [{ ...base, deferMode: 'immediate' }];
      await applyAndExpectNoDrift(orm, 'create constraint trigger "trg_qty"', 'deferrable initially immediate');

      meta.triggers = [{ ...base, deferMode: undefined }];
      const nonDeferrable = await applyAndExpectNoDrift(orm, 'create constraint trigger "trg_qty"');
      expect(nonDeferrable).not.toContain('deferrable');

      meta.triggers = [{ ...base, deferMode: undefined, body: `RETURN NULL` }];
      await applyAndExpectNoDrift(orm, 'create constraint trigger "trg_qty"', 'RETURN NULL');

      meta.triggers = [{ ...base, constraint: undefined, deferMode: undefined }];
      await applyAndExpectNoDrift(orm, 'create trigger "trg_qty"');

      meta.triggers = [base];
      await applyAndExpectNoDrift(orm, 'create constraint trigger "trg_qty"', 'deferrable initially deferred');

      await orm.schema.dropDatabase();
      await orm.close();
    });

    test('down migration recreates the introspected constraint trigger [postgres]', async () => {
      const { orm, schema } = await init('mikro_orm_test_constraint_trigger_down');
      const meta = orm.getMetadata(schema);
      const base = meta.triggers[0];
      await orm.schema.execute(await orm.schema.getCreateSchemaSQL({ wrap: false }));

      for (const target of [
        { ...base, deferMode: 'immediate' as const },
        { ...base, deferMode: undefined },
        { ...base, constraint: undefined, deferMode: undefined },
      ]) {
        meta.triggers = [target];
        const { up, down } = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
        expect(down).toContain(
          'create constraint trigger "trg_qty" AFTER INSERT OR UPDATE on "constraint_trigger_item" deferrable initially deferred for each ROW',
        );

        await orm.schema.execute(up);
        await orm.schema.execute(down);
        meta.triggers = [base];
        await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
      }

      await orm.schema.dropDatabase();
      await orm.close();
    });

    test('migration snapshot reload produces no drift [postgres]', async () => {
      const path = TEMP_DIR + '/constraint-trigger-migrations';
      await rm(path, { recursive: true, force: true });

      const orm = await MikroORM.init({
        entities: [createSchema()],
        dbName: 'mikro_orm_test_constraint_trigger_snapshot',
        extensions: [Migrator],
        migrations: { path, snapshot: true, emit: 'ts' },
        logger: () => void 0,
      });
      await orm.schema.ensureDatabase();

      const first = await orm.migrator.create();
      expect(first.diff.up.join('\n')).toContain(
        'create constraint trigger "trg_qty" AFTER INSERT OR UPDATE on "constraint_trigger_item" deferrable initially deferred for each ROW',
      );

      const second = await orm.migrator.create();
      expect(second.diff.up).toEqual([]);

      await orm.schema.dropDatabase();
      await rm(path, { recursive: true, force: true });
      await orm.close();
    });

    test('constraint trigger defers the check to commit [postgres]', async () => {
      const { orm } = await init('mikro_orm_test_constraint_trigger_4');
      await orm.schema.execute(await orm.schema.getCreateSchemaSQL({ wrap: false }));

      await orm.em.transactional(async em => {
        await em.execute(`insert into "constraint_trigger_item" ("id", "qty") values (1, -1)`);
        await em.execute(`update "constraint_trigger_item" set "qty" = 5 where "id" = 1`);
      });
      await expect(orm.em.getConnection().execute(`select "qty" from "constraint_trigger_item"`)).resolves.toEqual([
        { qty: 5 },
      ]);

      await expect(
        orm.em.transactional(async em => {
          await em.execute(`insert into "constraint_trigger_item" ("id", "qty") values (2, -1)`);
        }),
      ).rejects.toThrow(/negative qty/);
      await expect(orm.em.getConnection().execute(`select "id" from "constraint_trigger_item"`)).resolves.toEqual([
        { id: 1 },
      ]);

      await orm.schema.dropDatabase();
      await orm.close();
    });
  });
});
