import { Configuration } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { MariaDbDriver } from '@mikro-orm/mariadb';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

function mapOptions(driver: any, clientUrl: string, driverOptions = {}, extra = {}) {
  const config = new Configuration({ driver, clientUrl, logger: vi.fn(), ...extra } as any, false);
  return new driver(config).getConnection().mapOptions(driverOptions);
}

describe('ssl params in clientUrl', () => {
  test('postgres maps sslmode to the pg ssl option', () => {
    const url = 'postgresql://user:secret@127.0.0.1:1234/db_name';
    expect(mapOptions(PostgreSqlDriver, url)).not.toHaveProperty('ssl');
    expect(mapOptions(PostgreSqlDriver, `${url}?sslmode=verify-full`).ssl).toEqual({});
    expect(mapOptions(PostgreSqlDriver, `${url}?sslmode=no-verify`).ssl).toEqual({ rejectUnauthorized: false });
    expect(mapOptions(PostgreSqlDriver, `${url}?sslmode=disable`).ssl).toBe(false);
    expect(mapOptions(PostgreSqlDriver, `${url}?ssl=true`).ssl).toBe(true);
    expect(mapOptions(PostgreSqlDriver, `${url}?schema=foo&sslmode=verify-full`)).toMatchObject({
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
    expect(mapOptions(PostgreSqlDriver, url, { ssl: { ca: 'cert' } }).ssl).toEqual({ ca: 'cert' });
    expect(mapOptions(PostgreSqlDriver, url, { ssl: false }).ssl).toBe(false);
    expect(mapOptions(PostgreSqlDriver, url, {}, { host: '127.0.0.10' })).toMatchObject({
      host: '127.0.0.10',
      ssl: {},
    });
  });

  test.each([
    ['mysql', MySqlDriver],
    ['mariadb', MariaDbDriver],
  ])('%s maps the ssl param to the mysql2 ssl option', (_, driver) => {
    const url = 'mysql://user:secret@127.0.0.1:3308/db_name';
    expect(mapOptions(driver, url)).not.toHaveProperty('ssl');
    expect(mapOptions(driver, `${url}?ssl={"rejectUnauthorized":true}`).ssl).toEqual({ rejectUnauthorized: true });
    expect(mapOptions(driver, `${url}?ssl=Amazon RDS`).ssl).toBe('Amazon RDS');
    expect(mapOptions(driver, `${url}?ssl={"rejectUnauthorized":true}`, { ssl: { ca: 'cert' } }).ssl).toEqual({
      rejectUnauthorized: true,
      ca: 'cert',
    });
    expect(() => mapOptions(driver, `${url}?sslmode=require`)).toThrow(/`sslmode` parameter .* is not supported/);
    expect(() => mapOptions(driver, `${url}?ssl-mode=REQUIRED`)).toThrow(/`ssl-mode` parameter .* is not supported/);
  });
});
