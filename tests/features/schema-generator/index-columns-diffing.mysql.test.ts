import { defineEntity, MikroORM, p } from '@mikro-orm/mysql';

class Location {
  id!: number;
  deviceId!: number;
  name!: string;
  recordedAt!: Date;
}

// mysql introspection reports column options only for descending or prefix-length columns
const LocationSchema = defineEntity({
  class: Location,
  tableName: 'idx_cols_location',
  indexes: [
    {
      name: 'idx_cols_location_device_recorded',
      columns: [{ name: 'deviceId' }, { name: 'recordedAt', sort: 'DESC' }],
    },
    { name: 'idx_cols_location_device_name', columns: [{ name: 'deviceId' }, { name: 'name', length: 10 }] },
  ],
  properties: {
    id: p.integer().primary(),
    deviceId: p.integer(),
    name: p.string(),
    recordedAt: p.datetime(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [LocationSchema], dbName: 'mikro_orm_test_index_columns', port: 3308 });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('indexes declared with columns produce no diff once created', async () => {
  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
});
