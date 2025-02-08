import { MikroORM, Entity, Enum, PrimaryKey } from '@mikro-orm/postgresql';

enum AdminPermission {
  ROOT = 'ROOT',
  ACCESS = 'ACCESS',
}

@Entity()
class Admin {

  @PrimaryKey()
  id!: number;

  @Enum({
    items: () => AdminPermission,
    array: true,
    default: [],
  })
  permissions: AdminPermission[] = [];

}

test('enum array diffing', async () => {
  const orm = await MikroORM.init({
    entities: [Admin],
    dbName: `mikro_orm_test_enum_array_diffing`,
  });

  await orm.schema.refreshDatabase();

  const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff).toBe('');

  await orm.close(true);
});
