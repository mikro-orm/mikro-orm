import { MikroORM } from '@mikro-orm/mssql';
import type { Connection as TediousConnection } from 'tedious';

async function getRequestTimeout(driverOptions?: Record<string, unknown>) {
  let tedious!: TediousConnection;
  const orm = await MikroORM.init({
    dbName: 'master',
    password: 'Root.Root',
    discovery: { warnWhenNoEntities: false },
    ensureDatabase: false,
    driverOptions,
    onCreateConnection: async connection => {
      tedious = connection as TediousConnection;
    },
  });

  try {
    await orm.em.getConnection().execute('select 1');
    return (tedious as any).config.options.requestTimeout as number;
  } finally {
    await orm.close(true);
  }
}

test('mssql connections default to a 60s request timeout', async () => {
  await expect(getRequestTimeout()).resolves.toBe(60_000);
});

test('driverOptions override the default request timeout', async () => {
  await expect(getRequestTimeout({ options: { requestTimeout: 1_000 } })).resolves.toBe(1_000);
});
