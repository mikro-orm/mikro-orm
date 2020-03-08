import { Configuration, Connection, QueryResult } from '../lib';

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
    const conn = new CustomConnection(new Configuration({}, false));
    await expect(conn.transactional(async () => {})).rejects.toThrowError('Transactions are not supported by current driver');
  });

});
