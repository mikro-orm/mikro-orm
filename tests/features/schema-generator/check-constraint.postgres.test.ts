import { Check, Entity, EntitySchema, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { initORMPostgreSql } from '../../bootstrap';
import { DatabaseSchema } from '@mikro-orm/knex';

@Check({ expression: columns => `${columns.price} >= 0` })
abstract class Base {

  @PrimaryKey()
  id!: number;

  @Property()
  price!: number;

}

@Entity()
class FooEntity extends Base {

  @Property()
  @Check<FooEntity>({ expression: columns => `${columns.price2} >= 0` })
  price2!: number;

  @Property({ check: 'price3 >= 0' })
  price3!: number;

  @Property({ check: 'email = lower(email)' })
  email!: string;

}

describe('check constraint [postgres]', () => {

  test('check constraint is generated for decorator [postgres]', async () => {
    const orm = await MikroORM.init({
      entities: [FooEntity],
      dbName: `mikro_orm_test_check_1`,
      driver: PostgreSqlDriver,
    });

    const diff = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-check-constraint-decorator');

    const meta = orm.getMetadata().get(FooEntity.name);
    expect(meta.checks).toEqual([
      {
        expression: 'price >= 0',
        property: undefined,
        name: 'foo_entity_check',
      },
      {
        expression: 'price2 >= 0',
        property: 'price2',
        name: 'foo_entity_price2_check',
      },
      {
        property: 'price3',
        expression: 'price3 >= 0',
        name: 'foo_entity_price3_check',
      },
      {
        property: 'email',
        expression: 'email = lower(email)',
        name: 'foo_entity_email_check',
      },
    ]);
    await orm.schema.updateSchema();
    const schema = await DatabaseSchema.create(orm.em.getConnection(), orm.em.getPlatform(), orm.config);
    const table = schema.getTable('foo_entity')!;
    expect(table.getChecks()).toEqual([
      {
        columnName: 'price',
        definition: 'CHECK ((price >= 0))',
        expression: 'price >= 0',
        name: 'foo_entity_check',
      },
      {
        columnName: 'email',
        definition: 'CHECK (((email)::text = lower((email)::text)))',
        expression: 'email = lower(email)',
        name: 'foo_entity_email_check',
      },
      {
        columnName: 'price2',
        definition: 'CHECK ((price2 >= 0))',
        expression: 'price2 >= 0',
        name: 'foo_entity_price2_check',
      },
      {
        columnName: 'price3',
        definition: 'CHECK ((price3 >= 0))',
        expression: 'price3 >= 0',
        name: 'foo_entity_price3_check',
      },
    ]);

    await orm.schema.dropDatabase();
    await orm.close();
  });

  test('check constraint diff [postgres]', async () => {
    const orm = await initORMPostgreSql();
    const meta = orm.getMetadata();
    await orm.schema.updateSchema();

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
      name: 'NewTable',
      tableName: 'new_table',
      checks: [
        { name: 'foo', expression: 'price >= 0' },
      ],
    }).init().meta;
    meta.set('NewTable', newTableMeta);

    let diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-check-constraint-diff-1');
    await orm.schema.execute(diff);

    // Update a check expression
    newTableMeta.checks = [{ name: 'foo', expression: 'price > 0' }];
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-check-constraint-diff-2');
    await orm.schema.execute(diff);

    // Remove a check constraint
    newTableMeta.checks = [];
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-check-constraint-diff-3');
    await orm.schema.execute(diff);

    // Add new check
    newTableMeta.checks = [{ name: 'bar', expression: 'price > 0 and price < 123' }];
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-check-constraint-diff-4');
    await orm.schema.execute(diff);
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    // Skip existing check
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('postgres-check-constraint-diff-5');
    await orm.schema.execute(diff);

    await orm.schema.dropDatabase();
    await orm.close();
  });

  test('duplicate check constraint names across tables do not cause drift [postgres]', async () => {
    const orm = await initORMPostgreSql();
    const meta = orm.getMetadata();
    await orm.schema.updateSchema();

    const tableAMeta = new EntitySchema({
      properties: {
        id: { primary: true, name: 'id', type: 'number', fieldName: 'id', columnType: 'int' },
        value: { type: 'number', name: 'value', fieldName: 'value', columnType: 'int' },
      },
      name: 'DupCheckTableA',
      tableName: 'dup_check_table_a',
      checks: [{ name: 'chk_positive', expression: 'value >= 0' }],
    }).init().meta;
    meta.set('DupCheckTableA', tableAMeta);

    const tableBMeta = new EntitySchema({
      properties: {
        id: { primary: true, name: 'id', type: 'number', fieldName: 'id', columnType: 'int' },
        amount: { type: 'number', name: 'amount', fieldName: 'amount', columnType: 'int' },
      },
      name: 'DupCheckTableB',
      tableName: 'dup_check_table_b',
      checks: [{ name: 'chk_positive', expression: 'amount >= 0' }],
    }).init().meta;
    meta.set('DupCheckTableB', tableBMeta);

    let diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).not.toBe('');
    await orm.schema.execute(diff);

    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    await orm.schema.dropDatabase();
    await orm.close();
  });

  test('multi-column check constraint does not cause drift [postgres]', async () => {
    const orm = await initORMPostgreSql();
    const meta = orm.getMetadata();
    await orm.schema.updateSchema();

    const newTableMeta = new EntitySchema({
      properties: {
        id: { primary: true, name: 'id', type: 'number', fieldName: 'id', columnType: 'int' },
        min_price: { type: 'number', name: 'min_price', fieldName: 'min_price', columnType: 'int' },
        max_price: { type: 'number', name: 'max_price', fieldName: 'max_price', columnType: 'int' },
      },
      name: 'MultiColCheckTable',
      tableName: 'multi_col_check_table',
      checks: [
        { name: 'chk_price_range', expression: 'min_price >= 0 and max_price >= min_price' },
      ],
    }).init().meta;
    meta.set('MultiColCheckTable', newTableMeta);

    let diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).not.toBe('');
    await orm.schema.execute(diff);

    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    await orm.schema.dropDatabase();
    await orm.close();
  });

  test('check constraint with multiline expression does not cause drift [postgres]', async () => {
    const orm = await initORMPostgreSql();
    const meta = orm.getMetadata();
    await orm.schema.updateSchema();

    const newTableMeta = new EntitySchema({
      properties: {
        id: { primary: true, name: 'id', type: 'number', fieldName: 'id', columnType: 'int' },
        status: { type: 'string', name: 'status', fieldName: 'status', columnType: 'varchar(20)' },
      },
      name: 'MultilineCheckTable',
      tableName: 'multiline_check_table',
      checks: [
        {
          name: 'chk_status_valid',
          expression: "CASE WHEN status = 'active' THEN 1 WHEN status = 'inactive' THEN 1 ELSE 0 END = 1",
        },
      ],
    }).init().meta;
    meta.set('MultilineCheckTable', newTableMeta);

    let diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).not.toBe('');
    await orm.schema.execute(diff);

    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    await orm.schema.dropDatabase();
    await orm.close();
  });

});
