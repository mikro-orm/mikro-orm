import { Check, Entity, EntitySchema, MikroORM, PrimaryKey, Property } from '@mikro-orm/mysql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { rm } from 'fs-extra';

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

describe('check constraint [mysql8]', () => {

  test('check constraint is generated for decorator [mysql8]', async () => {
    const orm = await MikroORM.init({
      entities: [FooEntity],
      dbName: `mikro_orm_test_checks`,
      port: 3308,
    });

    await orm.schema.refreshDatabase({ createSchema: false });
    const diff = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mysql8-check-constraint-decorator');
    await orm.schema.execute(diff);

    await orm.close();
  });

  test('GH #4505', async () => {
    await rm(`${__dirname}/temp`, { recursive: true, force: true });

    const orm0 = await MikroORM.init({
      entities: [FooEntity],
      dbName: `mikro_orm_test_checks`,
      port: 3308,
      metadataProvider: TsMorphMetadataProvider,
      metadataCache: { options: { cacheDir: `${__dirname}/temp` } },
    });
    const meta0 = orm0.getMetadata().get(FooEntity.name);
    expect(meta0.checks).toEqual([
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
        expression: 'price >= 0',
        property: undefined,
        name: 'foo_entity_check',
      },
    ]);
    await orm0.close(true);

    const orm = await MikroORM.init({
      entities: [FooEntity],
      dbName: `mikro_orm_test_checks`,
      port: 3308,
      metadataProvider: TsMorphMetadataProvider,
      metadataCache: { options: { cacheDir: `${__dirname}/temp` } },
    });
    const meta = orm.getMetadata().get(FooEntity.name);
    expect(meta.checks).toEqual([
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
        expression: 'price >= 0',
        property: undefined,
        name: 'foo_entity_check',
      },
    ]);

    const diff = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mysql8-check-constraint-decorator');

    await orm.close();
  });

  test('check constraint diff [mysql8]', async () => {
    const orm = await MikroORM.init({
      entities: [FooEntity],
      dbName: `mikro_orm_test_checks`,
      port: 3308,
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
    expect(diff).toMatchSnapshot('mysql8-check-constraint-diff-1');
    await orm.schema.execute(diff);

    // Update a check expression
    newTableMeta.checks = [{ name: 'foo', expression: 'priceColumn > 0' }];
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mysql8-check-constraint-diff-2');
    await orm.schema.execute(diff);

    // Remove a check constraint
    newTableMeta.checks = [];
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mysql8-check-constraint-diff-3');
    await orm.schema.execute(diff);

    // Add new check
    newTableMeta.checks = [{ name: 'bar', expression: 'priceColumn > 0' }];
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mysql8-check-constraint-diff-4');
    await orm.schema.execute(diff);

    // Skip existing check
    diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot('mysql8-check-constraint-diff-5');
    await orm.schema.execute(diff);

    await orm.close();
  });

});
