import { MikroORM } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { OracleDriver } from '@mikro-orm/oracledb';

@Entity()
class Gh8040Sample {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

const options = {
  metadataProvider: ReflectMetadataProvider,
  driver: OracleDriver,
  dbName: 'mikro_orm_test_gh8040',
  user: 'system',
  password: 'oracle123',
  schemaGenerator: { managementDbName: 'system', tableSpace: 'mikro_orm' },
  entities: [Gh8040Sample],
} as const;

test('GH #8040 — schema is managed in `dbName` when it differs from the connection user', async () => {
  // `ensureDatabase()` creates the schema and switches the connection over to it
  const orm1 = await MikroORM.init(options);
  await orm1.schema.refresh();
  await orm1.close(true);

  // now the schema exists, so we stay connected as the configured `system` user
  const orm2 = await MikroORM.init(options);
  await orm2.schema.refresh();
  expect(await orm2.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');

  await orm2.em.insert(Gh8040Sample, { name: 'foo' });
  await expect(orm2.em.fork().find(Gh8040Sample, {})).resolves.toHaveLength(1);

  // the qualified name proves the row landed in `dbName`, not in the login user's schema
  const rows = await orm2.em
    .getConnection()
    .execute<{ name: string }[]>(`select "name" from "mikro_orm_test_gh8040"."gh8040sample"`);
  expect(rows).toEqual([{ name: 'foo' }]);

  await orm2.close(true);
});
