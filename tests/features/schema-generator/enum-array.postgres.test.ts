import { EntitySchema, MikroORM } from '@mikro-orm/postgresql';

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

  const createSQL = await orm.schema.getCreateSchemaSQL({ wrap: false });
  expect(createSQL).toContain(
    `alter table "admin" add constraint "admin_permissions_check" check ("permissions" <@ array['ROOT'::text, 'ACCESS'::text]);`,
  );

  await orm.schema.refresh();

  const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff).toBe('');

  await orm.close(true);
});

describe('enum array check constraint diffing', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Admin],
      dbName: `mikro_orm_test_enum_array_diffing`,
    });

    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  test('add enum item updates check constraint', async () => {
    const meta = orm.getMetadata().get(Admin);
    const prop = meta.properties.permissions;
    prop.items = ['ROOT', 'ACCESS', 'MANAGE'];
    meta.checks = [
      {
        name: 'admin_permissions_check',
        property: 'permissions',
        expression: `"permissions" <@ array['ROOT'::text, 'ACCESS'::text, 'MANAGE'::text]`,
      },
    ];

    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain('alter table "admin" drop constraint "admin_permissions_check"');
    expect(diff).toContain(
      `alter table "admin" add constraint "admin_permissions_check" check ("permissions" <@ array['ROOT'::text, 'ACCESS'::text, 'MANAGE'::text])`,
    );
    await orm.schema.execute(diff);

    const diff2 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff2).toBe('');
  });

  test('remove enum item updates check constraint', async () => {
    const meta = orm.getMetadata().get(Admin);
    const prop = meta.properties.permissions;
    prop.items = ['ROOT'];
    meta.checks = [
      {
        name: 'admin_permissions_check',
        property: 'permissions',
        expression: `"permissions" <@ array['ROOT'::text]`,
      },
    ];

    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain('alter table "admin" drop constraint "admin_permissions_check"');
    expect(diff).toContain(
      `alter table "admin" add constraint "admin_permissions_check" check ("permissions" <@ array['ROOT'::text])`,
    );
    await orm.schema.execute(diff);

    const diff2 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff2).toBe('');
  });

  test('remove check constraint', async () => {
    const meta = orm.getMetadata().get(Admin);
    meta.checks = [];

    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain('alter table "admin" drop constraint "admin_permissions_check"');
    await orm.schema.execute(diff);

    const diff2 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff2).toBe('');
  });

  test('add check constraint back', async () => {
    const meta = orm.getMetadata().get(Admin);
    meta.checks = [
      {
        name: 'admin_permissions_check',
        property: 'permissions',
        expression: `"permissions" <@ array['ROOT'::text, 'ACCESS'::text]`,
      },
    ];

    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toContain(
      `alter table "admin" add constraint "admin_permissions_check" check ("permissions" <@ array['ROOT'::text, 'ACCESS'::text])`,
    );
    await orm.schema.execute(diff);

    const diff2 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff2).toBe('');
  });
});
