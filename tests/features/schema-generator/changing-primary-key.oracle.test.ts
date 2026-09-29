import { MikroORM, OracleDriver } from '@mikro-orm/oracledb';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'coupon' })
class CouponByCode {
  @PrimaryKey({ length: 50 })
  code!: string;

  @Property()
  name!: string;
}

@Entity({ tableName: 'coupon' })
class CouponByName {
  @Property()
  code!: string;

  @PrimaryKey()
  name!: string;
}

@Entity({ tableName: 'coupon' })
class CouponByLongCode {
  @PrimaryKey({ length: 100 })
  code!: string;

  @Property()
  name!: string;
}

async function init() {
  const orm = await MikroORM.init({
    driver: OracleDriver,
    metadataProvider: ReflectMetadataProvider,
    entities: [CouponByCode],
    dbName: 'mikro_orm_test_changing_pk',
    password: 'oracle123',
    schemaGenerator: { managementDbName: 'system', tableSpace: 'mikro_orm' },
  });
  await orm.schema.refresh();

  return orm;
}

test('moving the primary key to another column re-creates the constraint', async () => {
  const orm = await init();
  orm.discoverEntity(CouponByName, CouponByCode);
  const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff).toContain('alter table "coupon" drop primary key;');
  expect(diff).toContain('alter table "coupon" add primary key ("name");');
  await orm.schema.execute(diff);
  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  await orm.close(true);
});

test('changing the primary key column type keeps the constraint', async () => {
  const orm = await init();
  orm.discoverEntity(CouponByLongCode, CouponByCode);
  const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff).toBe('alter table "coupon" modify "code" varchar2(100);\n');
  await orm.schema.execute(diff);
  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  await orm.close(true);
});
