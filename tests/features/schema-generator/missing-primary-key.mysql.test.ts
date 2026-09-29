import { MikroORM } from '@mikro-orm/mysql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'item' })
class Item {
  @PrimaryKey()
  code!: string;

  @Property()
  name!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Item],
    dbName: 'mikro_orm_test_missing_pk',
    port: 3308,
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('the schema diff restores a missing primary key', async () => {
  await orm.schema.execute('alter table `item` drop primary key');

  const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff).toContain('alter table `item` add primary key (`code`);');
  await orm.schema.execute(diff);
  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

  const [{ count }] = await orm.em
    .getConnection()
    .execute(
      `select count(*) as count from information_schema.table_constraints where table_schema = database() and table_name = 'item' and constraint_type = 'PRIMARY KEY'`,
    );
  expect(+count).toBe(1);
});
