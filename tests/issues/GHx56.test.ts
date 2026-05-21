// Schema diff for a scalar-array column whose type is changing (e.g. text[] ->
// numeric(3,2)[]) must drop the existing default and re-set it around the
// `alter column ... type` statement — Postgres cannot auto-cast the stored
// default expression to the new array type.

import { defineEntity, MikroORM, p } from '@mikro-orm/postgresql';

const ClientSettingsV1Schema = defineEntity({
  name: 'ClientSettings',
  tableName: 'client_settings',
  properties: {
    id: p.integer().primary().autoincrement(),
    vatRates: p.array(Number).default([]),
  },
});

class ClientSettingsV1 extends ClientSettingsV1Schema.class {}
ClientSettingsV1Schema.setClass(ClientSettingsV1);

const ClientSettingsV2Schema = defineEntity({
  name: 'ClientSettings',
  tableName: 'client_settings',
  properties: {
    id: p.integer().primary().autoincrement(),
    vatRates: p.decimal('number').array().precision(3).scale(2).default([]),
  },
});

class ClientSettingsV2 extends ClientSettingsV2Schema.class {}
ClientSettingsV2Schema.setClass(ClientSettingsV2);

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'mikro_orm_test_ghx56',
    entities: [ClientSettingsV1],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('schema update handles scalar array type change with default empty array', async () => {
  orm.discoverEntity(ClientSettingsV2, ClientSettingsV1);

  const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff).toContain('alter table "client_settings" alter column "vat_rates" drop default');
  expect(diff).toContain('alter table "client_settings" alter column "vat_rates" type numeric(3,2)[]');
  expect(diff).toContain('alter table "client_settings" alter column "vat_rates" set default');

  await expect(orm.schema.execute(diff)).resolves.toBeUndefined();
});
