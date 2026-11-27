import { Configuration } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { MariaDbDriver } from '@mikro-orm/mariadb';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

function getConnectionOptions(driver: any, clientUrl: string, extra = {}) {
  const config = new Configuration({ driver, clientUrl, logger: jest.fn(), ...extra } as any, false);
  return new driver(config).getConnection().getKnexOptions(driver.name).connection;
}

describe('ssl params in clientUrl', () => {

  test('postgres maps sslmode to the pg ssl option', () => {
    const url = 'postgresql://user:secret@127.0.0.1:1234/db_name';
    expect(getConnectionOptions(PostgreSqlDriver, url)).not.toHaveProperty('ssl');
    expect(getConnectionOptions(PostgreSqlDriver, `${url}?sslmode=verify-full`).ssl).toEqual({});
    expect(getConnectionOptions(PostgreSqlDriver, `${url}?sslmode=no-verify`).ssl).toEqual({ rejectUnauthorized: false });
    expect(getConnectionOptions(PostgreSqlDriver, `${url}?sslmode=disable`).ssl).toBe(false);
    expect(getConnectionOptions(PostgreSqlDriver, `${url}?ssl=true`).ssl).toBe(true);
    expect(getConnectionOptions(PostgreSqlDriver, `${url}?schema=foo&sslmode=verify-full`)).toMatchObject({
      host: '127.0.0.1',
      port: 1234,
      user: 'user',
      password: 'secret',
      database: 'db_name',
      ssl: {},
    });
  });

  test('postgres keeps explicit connection options and driverOptions over the url', () => {
    const url = 'postgresql://user:secret@127.0.0.1:1234/db_name?sslmode=verify-full';
    const driverOptions = (ssl: unknown) => ({ driverOptions: { connection: { ssl } } });
    expect(getConnectionOptions(PostgreSqlDriver, url, driverOptions({ ca: 'cert' })).ssl).toEqual({ ca: 'cert' });
    expect(getConnectionOptions(PostgreSqlDriver, url, driverOptions(false)).ssl).toBe(false);
    expect(getConnectionOptions(PostgreSqlDriver, url, { host: '127.0.0.10' })).toMatchObject({
      host: '127.0.0.10',
      ssl: {},
    });
  });

  test.each([
    ['mysql', MySqlDriver],
    ['mariadb', MariaDbDriver],
  ])('%s maps the ssl param to the client ssl option', (_, driver) => {
    const url = 'mysql://user:secret@127.0.0.1:3308/db_name';
    const driverOptions = { driverOptions: { connection: { ssl: { ca: 'cert' } } } };
    expect(getConnectionOptions(driver, url)).not.toHaveProperty('ssl');
    expect(getConnectionOptions(driver, `${url}?ssl=true`).ssl).toBe(true);
    expect(getConnectionOptions(driver, `${url}?ssl={"rejectUnauthorized":true}`).ssl).toEqual({ rejectUnauthorized: true });
    expect(getConnectionOptions(driver, `${url}?ssl=Amazon RDS`).ssl).toBe('Amazon RDS');
    expect(getConnectionOptions(driver, `${url}?ssl={"rejectUnauthorized":true}`, driverOptions).ssl).toEqual({
      rejectUnauthorized: true,
      ca: 'cert',
    });
  });

});
