import { Configuration, Connection, QueryResult } from '@mikro-orm/core';

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
    const conn = new CustomConnection(new Configuration({ type: 'mongo' }, false));
    await expect(conn.transactional(async () => void 0)).rejects.toThrowError('Transactions are not supported by current driver');
    await expect(conn.begin()).rejects.toThrowError('Transactions are not supported by current driver');
    await expect(conn.commit({} as any)).rejects.toThrowError('Transactions are not supported by current driver');
    await expect(conn.rollback({} as any)).rejects.toThrowError('Transactions are not supported by current driver');
  });

});
