import { EntitySchema, MikroORM } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { v4 as uuidv4 } from 'uuid';

enum CostPriceDisplayMethod {
  LastPurchasePrice = 'LastPurchasePrice',
  WeightedAverage = 'WeightedAverage',
}

const ClientSettingSchema = new EntitySchema({
  name: 'ClientSetting',
  tableName: 'client_settings',
  properties: {
    id: { type: 'uuid', primary: true, onCreate: () => uuidv4() },
    costPriceDisplayMethod: {
      enum: true,
      items: () => CostPriceDisplayMethod,
      nativeEnumName: 'client_settings_cost_price_display_method_enum',
      default: CostPriceDisplayMethod.LastPurchasePrice,
    },
  },
});

test('GH #7432 - nativeEnumName with custom schema should not double-prefix', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: 'mikro_orm_test_gh_7432',
    schema: 'custom',
    entities: [ClientSettingSchema],
  });

  const createSQL = await orm.schema.getCreateSchemaSQL({ wrap: false });
  expect(createSQL).not.toContain('custom.custom.');
  expect(createSQL).toContain('"custom"."client_settings_cost_price_display_method_enum"');
  expect(createSQL).toContain('"cost_price_display_method" "custom"."client_settings_cost_price_display_method_enum"');

  await orm.schema.refresh();

  const updateSQL = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(updateSQL).toBe('');

  await orm.close(true);
});
