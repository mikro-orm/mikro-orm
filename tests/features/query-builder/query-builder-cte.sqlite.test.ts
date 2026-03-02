import { MikroORM, type AbstractSqlDriver } from '@mikro-orm/sql';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { cteEntities, cteMetadataProvider, cteIntegrationTests } from './cte-shared.js';

let orm: MikroORM<AbstractSqlDriver>;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: cteEntities,
    metadataProvider: cteMetadataProvider,
    driver: SqliteDriver,
    dbName: ':memory:',
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

cteIntegrationTests(() => orm);
