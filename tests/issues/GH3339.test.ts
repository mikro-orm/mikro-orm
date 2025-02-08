import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/postgresql';


@Entity({
  tableName: 'gh3339.Customer',
})
export class Customer1 {

  @PrimaryKey({ fieldName: 'ID', type: 'number' })
  id!: number;

  @Property()
  customerName?: string;

}

@Entity({
  tableName: 'gh3339.Customer',
})
export class Customer2 {

  @PrimaryKey({ fieldName: 'ID', type: 'number' })
  id!: number;

  @Property()
  name?: string;

}

@Entity({
  tableName: 'gh3339.Customer',
})
export class Customer3 {

  @PrimaryKey({ fieldName: 'ID', type: 'number' })
  id!: number;

  @Property()
  c_name?: string;

}

describe('GH issue 3339', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: `mikro_orm_test_gh_3339`,
      schema: 'gh3339',
      entities: [ Customer1 ],
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(() => orm.close(true));

  test('reference schema name when updating column names inside sql', async () => {
    orm.discoverEntity(Customer2, 'Customer1');
    const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toContain('"gh3339"."Customer"');
    await orm.schema.execute(diff1);

    orm.discoverEntity(Customer3, 'Customer2');
    const diff2 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff2).toContain('"gh3339"."Customer"');
    await orm.schema.execute(diff2);
  });
});
