import { Entity, Enum, ManyToOne, MikroORM, PrimaryKey } from '@mikro-orm/core';

export enum BrandType {
    Foo = 'foo',
    Bar = 'bar',
    Baz = 'baz'
}

@Entity({ tableName: 'brand' })
export class Brand {

  @Enum({ primary: true, items: () => BrandType })
  id!: BrandType;

}

@Entity({ tableName: 'product' })
export class Product {

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
      type: 'postgresql',
    });

    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().execute('drop table if exists brand cascade');
    await orm.getSchemaGenerator().execute('drop table if exists product cascade');
    // await orm.getSchemaGenerator().createSchema();

    const diff1 = await orm.getSchemaGenerator().getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toMatchSnapshot();
    await orm.getSchemaGenerator().execute(diff1);

    await orm.close(true);
  });

});
