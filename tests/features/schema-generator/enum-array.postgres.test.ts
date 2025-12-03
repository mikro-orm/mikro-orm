import { MikroORM } from '@mikro-orm/postgresql';

import { Entity, Enum, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
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
    metadataProvider: ReflectMetadataProvider,
    entities: [Admin],
    dbName: `mikro_orm_test_enum_array_diffing`,
  });

  await orm.schema.refresh();

  const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff).toBe('');

  await orm.close(true);
});
