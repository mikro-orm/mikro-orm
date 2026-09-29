import { MikroORM } from '@mikro-orm/sqlite';
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

@Entity({ tableName: 'item' })
class Item {
  @PrimaryKey()
  code!: string;

  @Property()
  name!: string;
}

@Entity({ tableName: 'item' })
class ItemRenamedKey {
  @PrimaryKey({ fieldName: 'item_code' })
  code!: string;

  @Property()
  name!: string;
}

test('replacing the primary key with a new autoincrement column rebuilds the table', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [CouponByCode],
    dbName: ':memory:',
  });
  await orm.schema.create();
  await orm.em.fork().insertMany(CouponByCode, [{ code: 'a' }, { code: 'b' }]);

  orm.discoverEntity(Coupon, CouponByCode);
  await orm.schema.update();
  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

  const em = orm.em.fork();
  em.create(Coupon, { code: 'c' });
  await em.flush();
  const coupons = await orm.em.fork().find(Coupon, {}, { orderBy: { id: 1 } });
  expect(coupons.map(c => [c.id, c.code])).toEqual([
    [1, 'a'],
    [2, 'b'],
    [3, 'c'],
  ]);

  await orm.close(true);
});

test('the schema diff restores a missing primary key', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Item],
    dbName: ':memory:',
  });
  await orm.schema.execute('create table `item` (`code` text not null, `name` text not null)');
  await orm.em.fork().insertMany(Item, [{ code: 'a', name: 'A' }]);

  await orm.schema.update();
  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

  const [table] = await orm.em.getConnection().execute(`select sql from sqlite_master where name = 'item'`);
  expect(table.sql).toContain('primary key');
  await expect(orm.em.fork().find(Item, {})).resolves.toMatchObject([{ code: 'a', name: 'A' }]);

  await orm.close(true);
});

test('renaming the primary key column keeps its data', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Item],
    dbName: ':memory:',
  });
  await orm.schema.create();
  await orm.em.fork().insertMany(Item, [{ code: 'a', name: 'A' }]);

  orm.discoverEntity(ItemRenamedKey, Item);
  await orm.schema.update();
  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  await expect(orm.em.fork().find(ItemRenamedKey, {})).resolves.toMatchObject([{ code: 'a', name: 'A' }]);

  await orm.close(true);
});
