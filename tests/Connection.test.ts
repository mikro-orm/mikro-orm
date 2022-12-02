import type { QueryResult } from '@mikro-orm/core';
import { Configuration, Connection } from '@mikro-orm/core';
import { MongoDriver } from '@mikro-orm/mongodb';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

class CustomConnection extends Connection {

  protected client: any;

  async close(force?: boolean): Promise<void> {
    return undefined;
  }

  async connect(): Promise<void> {
    return undefined;
  }

  async execute(query: string, params?: any[], method?: 'all' | 'get' | 'run'): Promise<QueryResult | any | any[]> {
    return undefined;
  }

  getDefaultClientUrl(): string {
    return '';
  }

  async isConnected(): Promise<boolean> {
    return false;
  }

}

describe('Connection', () => {

  test('by default it throws when trying to use transactions', async () => {
    const conn = new CustomConnection(new Configuration({ driver: MongoDriver }, false));
    await expect(conn.transactional(async () => void 0)).rejects.toThrowError('Transactions are not supported by current driver');
    await expect(conn.begin()).rejects.toThrowError('Transactions are not supported by current driver');
    await expect(conn.commit({} as any)).rejects.toThrowError('Transactions are not supported by current driver');
    await expect(conn.rollback({} as any)).rejects.toThrowError('Transactions are not supported by current driver');
  });

  test('special characters in username and password', async () => {
    const options = { driver: PostgreSqlDriver, clientUrl: 'pg://user%40:passw%40rd@host:1234/db%40name' } as const;
    const conn = new CustomConnection(new Configuration(options, false));
    expect(conn.getConnectionOptions()).toMatchObject({
      host: 'host',
      port: 1234,
      user: 'user@',
      password: 'passw@rd',
      database: 'db@name',
    });
  });

});
