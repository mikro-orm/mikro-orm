import {Options} from '@mikro-orm/core';
import {PostgreSqlDriver} from '@mikro-orm/postgresql';
import {TsMorphMetadataProvider} from '@mikro-orm/reflection';

export const useDocker =
  process.env.DOCKER === 'true' ||
  process.env.DOCKER === 'TRUE' ||
  process.env.DOCKER === '1';

export const dbName = useDocker ? 'docker' : 'test';
const port = useDocker ? 5433 : 5432;
const user = useDocker ? 'postgres' : 'test';
const password = useDocker ? 'postgres' : 'test';

export const config: Options<PostgreSqlDriver> = {
  entities: ['./build/src/mikro-orm/entities'],
  entitiesTs: ['./src/mikro-orm/entities'],
  metadataProvider: TsMorphMetadataProvider,
  dbName,
  port,
  user,
  password,
  type: 'postgresql',
  forceUtcTimezone: true,
  debug: true,
};
