import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, Enum, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

enum ServiceProvidedAt {
  BusinessPremises = 'BusinessPremises',
  Remote = 'Remote',
}

@Entity()
class Business {
  @PrimaryKey()
  id!: number;

  @Enum({ items: () => ServiceProvidedAt, array: true, columnType: 'jsonb' })
  serviceProvidedAt: ServiceProvidedAt[] = [];
}

@Entity()
class Setting {
  @PrimaryKey()
  id!: number;

  @Enum({ items: () => ServiceProvidedAt, array: true, type: 'json' })
  providers: ServiceProvidedAt[] = [];
}

test('enum array with jsonb column type does not emit text[]-typed check constraint', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Business, Setting],
    dbName: `mikro_orm_test_enum_json_column`,
  });

  const createSQL = await orm.schema.getCreateSchemaSQL({ wrap: false });

  expect(createSQL).toContain('"service_provided_at" jsonb');
  expect(createSQL).not.toContain('business_service_provided_at_check');
  expect(createSQL).not.toContain("<@ array['BusinessPremises'::text, 'Remote'::text]");
  expect(createSQL).toContain('"providers" jsonb');
  expect(createSQL).not.toContain('setting_providers_check');

  await orm.schema.refresh();
  const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff).toBe('');

  await orm.close(true);
});
