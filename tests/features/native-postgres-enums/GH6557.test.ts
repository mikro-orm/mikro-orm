import { MikroORM, PrimaryKeyProp, Ref } from '@mikro-orm/postgresql';

import { Entity, Enum, ManyToOne, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
enum PermissionName {
  READ = 'READ',
  WRITE = 'WRITE',
  DELETE = 'DELETE',
  UPDATE = 'UPDATE',
}

@Entity()
class Permission {

  [PrimaryKeyProp]?: 'name';

  @Enum({ items: () => PermissionName, nativeEnumName: 'permission_name', primary: true })
  name: PermissionName;

  constructor(name: PermissionName) {
    this.name = name;
  }

}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Permission, { nullable: true })
  requiredPermission: Ref<Permission> | null = null;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [User],
    dbName: `mikro_orm_native_enum3`,
  });

  await orm.schema.refresh();
});

afterAll(() => orm.close());

test('GH #6557', async () => {
  await expect(orm.schema.getUpdateSchemaSQL()).resolves.toBe('');
});
