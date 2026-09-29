import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'item' })
class Item {
  @PrimaryKey()
  code!: string;

  @Property()
  name!: string;
}

@Entity({ tableName: 'counter' })
class Counter {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Item, Counter],
    dbName: 'mikro_orm_test_missing_pk',
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('the schema diff restores a missing primary key', async () => {
  await orm.schema.execute('alter table "item" drop constraint "item_pkey"');
  await orm.schema.execute('alter table "counter" drop constraint "counter_pkey"');

  const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff).toContain('alter table "item" add primary key ("code");');
  expect(diff).toContain('alter table "counter" add primary key ("id");');
  await orm.schema.execute(diff);
  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

  const constraints = await orm.em
    .getConnection()
    .execute(
      `select conrelid::regclass::text as tbl from pg_constraint where contype = 'p' and conrelid in ('item'::regclass, 'counter'::regclass) order by 1`,
    );
  expect(constraints).toEqual([{ tbl: 'counter' }, { tbl: 'item' }]);
});
