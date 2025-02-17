import { DatabaseSchema, Check, Entity, EntitySchema, MikroORM, PrimaryKey, Property } from '@mikro-orm/postgresql';
import { initORMPostgreSql } from '../../bootstrap.js';

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

});
