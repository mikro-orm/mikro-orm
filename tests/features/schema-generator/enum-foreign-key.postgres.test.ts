import { Entity, Enum, ManyToOne, MikroORM, PrimaryKey } from '@mikro-orm/postgresql';

enum BrandType {
    Foo = 'foo',
    Bar = 'bar',
    Baz = 'baz'
}

@Entity({ tableName: 'brand' })
class Brand {

  @Enum({ primary: true, items: () => BrandType })
  id!: BrandType;

}

@Entity({ tableName: 'product' })
class Product {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Brand)
  brand!: Brand;

}

describe('using enum as a foreign key value', () => {

  test('schema generator creates the correct type', async () => {
    const orm = await MikroORM.init({
      entities: [Brand, Product],
      dbName: `mikro_orm_test_enum_foreign_key`,
    });

    await orm.schema.ensureDatabase();
    await orm.schema.execute('drop table if exists brand cascade');
    await orm.schema.execute('drop table if exists product cascade');

    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toMatchSnapshot();
    await orm.schema.execute(diff);

    await orm.close(true);
  });

});
