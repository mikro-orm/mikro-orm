import { MikroORM } from '@mikro-orm/mssql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'coupon' })
class CouponByCode {
  @PrimaryKey()
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

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [CouponByCode],
    dbName: 'mikro_orm_test_changing_pk',
    password: 'Root.Root',
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('moving the primary key to another column re-creates the constraint', async () => {
  orm.discoverEntity(CouponByName, CouponByCode);
  const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff).toBe(
    'alter table [coupon] drop constraint [coupon_pkey];\n' +
      'alter table [coupon] add constraint [coupon_pkey] primary key ([name]);\n',
  );
  await orm.schema.execute(diff);
  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
});
