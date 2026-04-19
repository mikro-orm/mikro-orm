import { MikroORM } from '@mikro-orm/postgresql';
import {
  Embeddable,
  Embedded,
  Entity,
  Enum,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

enum Status {
  Active = 'Active',
  Inactive = 'Inactive',
  Pending = 'Pending',
}

@Embeddable()
class Settings {
  @Enum({ items: () => Status })
  status: Status = Status.Active;

  @Property()
  label: string = '';
}

@Entity({ tableName: 'demo_embedded_enum_check' })
class Demo {
  @PrimaryKey()
  id!: number;

  @Enum({ items: () => Status })
  directStatus: Status = Status.Active;

  @Embedded(() => Settings)
  settings!: Settings;
}

test('check constraints are emitted for enum properties inside embeddables', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Demo, Settings],
    dbName: `mikro_orm_test_embedded_enum_check`,
  });

  const meta = orm.getMetadata().get(Demo);
  const checkNames = meta.checks.map(c => c.name).sort();

  // Both the directly-declared enum and the enum inside the embedded `Settings`
  // class should produce check constraints during metadata discovery. Before
  // the fix, only `directStatus` got one because `initCheckConstraints`
  // iterated a stale `meta.props` array that did not yet include the flattened
  // embedded properties.
  expect(checkNames).toEqual([
    'demo_embedded_enum_check_direct_status_check',
    'demo_embedded_enum_check_settings_status_check',
  ]);

  const ddl = await orm.schema.getCreateSchemaSQL();
  expect(ddl).toContain(
    `alter table "demo_embedded_enum_check" add constraint "demo_embedded_enum_check_direct_status_check" check ("direct_status" in ('Active', 'Inactive', 'Pending'));`,
  );
  expect(ddl).toContain(
    `alter table "demo_embedded_enum_check" add constraint "demo_embedded_enum_check_settings_status_check" check ("settings_status" in ('Active', 'Inactive', 'Pending'));`,
  );

  await orm.close(true);
});
