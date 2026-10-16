import { defineEntity, MikroORM, p } from '@mikro-orm/mssql';

class Location {
  id!: number;
  deviceId!: number;
  position!: number;
  recordedAt!: Date;
}

// mssql introspection reports column options only for descending columns
const LocationSchema = defineEntity({
  class: Location,
  tableName: 'idx_cols_location',
  indexes: [
    { name: 'idx_cols_location_device_position', columns: [{ name: 'deviceId' }, { name: 'position' }] },
    {
      name: 'idx_cols_location_device_recorded',
      columns: [{ name: 'deviceId' }, { name: 'recordedAt', sort: 'DESC' }],
    },
  ],
  properties: {
    id: p.integer().primary(),
    deviceId: p.integer(),
    position: p.integer(),
    recordedAt: p.datetime(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [LocationSchema],
    dbName: 'mikro_orm_test_index_columns',
    password: 'Root.Root',
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('indexes declared with columns produce no diff once created', async () => {
  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
});
