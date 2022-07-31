import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';


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
      type: 'postgresql',
      schema: 'gh3339',
      entities: [ Customer1 ],
    });
    const generator = orm.getSchemaGenerator();
    await generator.ensureDatabase();
    await generator.dropSchema();
    await generator.createSchema();
    await generator.refreshDatabase();
  });

  afterAll(() => orm.close(true));

  test('reference schema name when updating column names inside sql', async () => {
    await orm.discoverEntity(Customer2);
    orm.getMetadata().reset('Customer1');
    const diff1 = await orm.getSchemaGenerator().getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toContain('"gh3339"."Customer"');
    await orm.getSchemaGenerator().execute(diff1);

    await orm.discoverEntity(Customer3);
    orm.getMetadata().reset('Customer2');
    const diff2 = await orm.getSchemaGenerator().getUpdateSchemaSQL({ wrap: false });
    expect(diff2).toContain('"gh3339"."Customer"');
    await orm.getSchemaGenerator().execute(diff2);
  });
});
