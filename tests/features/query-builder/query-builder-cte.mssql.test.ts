import { MikroORM, type AbstractSqlDriver } from '@mikro-orm/sql';
import { MsSqlDriver } from '@mikro-orm/mssql';
import { cteEntities, cteMetadataProvider, cteIntegrationTests } from './cte-shared.js';

let orm: MikroORM<AbstractSqlDriver>;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: cteEntities,
    metadataProvider: cteMetadataProvider,
    driver: MsSqlDriver,
    password: 'Root.Root',
    dbName: `mikro_orm_test_cte_${(Math.random() + 1).toString(36).substring(2)}`,
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.schema.dropDatabase();
  await orm.close(true);
});

cteIntegrationTests(() => orm);
