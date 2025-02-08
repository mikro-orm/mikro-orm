import { MikroORM, Check, Entity, EntitySchema, PrimaryKey, Property } from '@mikro-orm/mariadb';

@Entity()
@Check<FooEntity>({ expression: columns => `${columns.price} >= 0` })
class FooEntity {

  @PrimaryKey()
  id!: number;

  @Property()
  price!: number;

  @Property()
  @Check<FooEntity>({ expression: columns => `${columns.price2} >= 0` })
  price2!: number;

  @Property({ check: 'price3 >= 0' })
  price3!: number;

}

describe('check constraint [mariadb]', () => {

  test('check constraint is generated for decorator [mariadb]', async () => {
    const orm = await MikroORM.init({
      entities: [FooEntity],
      dbName: `mikro_orm_test_checks`,
      port: 3309,
    });

    const diff = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mariadb-check-constraint-decorator');

    await orm.close();
  });

  test('check constraint diff [mariadb]', async () => {
    const orm = await MikroORM.init({
      entities: [FooEntity],
      dbName: `mikro_orm_test_checks`,
      port: 3309,
    });

    const meta = orm.getMetadata();
    await orm.schema.refreshDatabase();
    await orm.schema.execute('drop table if exists new_table');

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
          fieldName: 'priceColumn',
          columnType: 'int',
        },
      },
      name: 'NewTable',
      tableName: 'new_table',
      checks: [
        { name: 'foo', expression: 'priceColumn >= 0' },
      ],
    }).init().meta;
    meta.set('NewTable', newTableMeta);

    let diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mariadb-check-constraint-diff-1');
    await orm.schema.execute(diff);

    // Update a check expression
    newTableMeta.checks = [{ name: 'foo', expression: 'priceColumn > 0' }];
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mariadb-check-constraint-diff-2');
    await orm.schema.execute(diff);

    // Remove a check constraint
    newTableMeta.checks = [];
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mariadb-check-constraint-diff-3');
    await orm.schema.execute(diff);

    // Add new check
    newTableMeta.checks = [{ name: 'bar', expression: 'priceColumn > 0' }];
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mariadb-check-constraint-diff-4');
    await orm.schema.execute(diff);

    // Skip existing check
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mariadb-check-constraint-diff-5');
    await orm.schema.execute(diff);

    await orm.close();
  });

});
