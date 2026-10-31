import { MikroORM } from '@mikro-orm/core';
import { MariaDbDriver } from '@mikro-orm/mariadb';
import { MySqlDriver } from '@mikro-orm/mysql';
import { CompiledQuery, type DatabaseConnection } from 'kysely';

const drivers = [
  ['mysql', MySqlDriver, 3308],
  ['mariadb', MariaDbDriver, 3309],
] as const;

async function init(driver: typeof MySqlDriver | typeof MariaDbDriver, port: number, options: Record<string, unknown>) {
  return MikroORM.init({
    driver,
    entities: [],
    discovery: { warnWhenNoEntities: false },
    clientUrl: 'mysql://root@127.0.0.1/mikro_orm_test',
    port,
    ...options,
  });
}

async function sessionTimezone(orm: MikroORM) {
  const [{ tz }] = await orm.em.getConnection().execute<{ tz: string }[]>('select @@session.time_zone as tz');
  return tz;
}

describe.each(drivers)('session time zone (%s)', (_name, driver, port) => {
  test('forceUtcTimezone pins the session time zone to UTC', async () => {
    await using orm = await init(driver, port, { forceUtcTimezone: true });
    expect(await sessionTimezone(orm)).toBe('+00:00');
  });

  test('timezone option sets the session time zone', async () => {
    await using orm = await init(driver, port, { timezone: '+02:00' });
    expect(await sessionTimezone(orm)).toBe('+02:00');
  });

  test('forceUtcTimezone: false leaves the server default', async () => {
    await using orm = await init(driver, port, { forceUtcTimezone: false });
    expect(await sessionTimezone(orm)).toBe('SYSTEM');
  });

  test('session time zone is set before onCreateConnection runs', async () => {
    const seen: string[] = [];
    await using orm = await init(driver, port, {
      forceUtcTimezone: true,
      onCreateConnection: async (connection: unknown) => {
        const res = await (connection as DatabaseConnection).executeQuery<{ tz: string }>(
          CompiledQuery.raw('select @@session.time_zone as tz'),
        );
        seen.push(res.rows[0].tz);
      },
    });
    await orm.em.getConnection().execute('select 1');
    expect(seen).toEqual(['+00:00']);
  });
});
