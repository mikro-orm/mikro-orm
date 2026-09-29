import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'coupon' })
class CouponByCode {
  @PrimaryKey()
  code!: string;
}

@Entity({ tableName: 'coupon' })
class Coupon {
  @PrimaryKey()
  id!: number;

  @Property()
  code!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [CouponByCode],
    dbName: 'mikro_orm_test_replacing_pk',
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('replacing the primary key with a new autoincrement column declares the key once', async () => {
  await orm.em.fork().insertMany(CouponByCode, [{ code: 'a' }, { code: 'b' }]);

  orm.discoverEntity(Coupon, CouponByCode);
  const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff).toContain('alter table "coupon" add "id" serial primary key;');
  expect(diff).not.toContain('add primary key');
  await orm.schema.execute(diff);
  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

  const em = orm.em.fork();
  em.create(Coupon, { code: 'c' });
  await em.flush();
  const coupons = await orm.em.fork().find(Coupon, {}, { orderBy: { id: 1 } });
  expect(coupons.map(c => c.code)).toEqual(['a', 'b', 'c']);
});
