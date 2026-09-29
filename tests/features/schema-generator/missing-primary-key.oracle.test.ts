import { MikroORM, OracleDriver } from '@mikro-orm/oracledb';
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
    driver: OracleDriver,
    metadataProvider: ReflectMetadataProvider,
    entities: [Item],
    dbName: 'mikro_orm_test_missing_pk',
    password: 'oracle123',
    schemaGenerator: { managementDbName: 'system', tableSpace: 'mikro_orm' },
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('the schema diff restores a missing primary key', async () => {
  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  await orm.schema.execute('alter table "item" drop primary key');

  const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff).toContain('alter table "item" add primary key ("code");');
  await orm.schema.execute(diff);
  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');

  const constraints = await orm.em
    .getConnection()
    .execute(`select constraint_type from user_constraints where table_name = 'item' and constraint_type = 'P'`);
  expect(constraints).toHaveLength(1);
});
