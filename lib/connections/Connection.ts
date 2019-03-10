import { Configuration } from '../utils';

export abstract class Connection {

  protected readonly logger = this.config.getLogger();

  constructor(protected readonly config: Configuration) { }

  /**
   * Establishes connection to database
   */
  abstract async connect(): Promise<void>;

  /**
   * Are we connected to the database
   */
  abstract async isConnected(): Promise<boolean>;

  /**
   * Closes the database connection (aka disconnect)
   */
  abstract async close(force?: boolean): Promise<void>;

  /**
   * Returns default client url for given driver (e.g. mongodb://localhost:27017 for mongodb)
   */
  abstract getDefaultClientUrl(): string;

  /**
   * Begins a transaction (if supported)
   */
  async beginTransaction(savepoint?: string): Promise<void> {
    throw new Error(`Transactions are not supported by current driver`);
  }

  /**
   * Commits statements in a transaction
   */
  async commit(savepoint?: string): Promise<void> {
    throw new Error(`Transactions are not supported by current driver`);
  }

  /**
   * Rollback changes in a transaction
   */
  async rollback(savepoint?: string): Promise<void> {
    throw new Error(`Transactions are not supported by current driver`);
  }

  abstract async execute(query: string, params?: any[], method?: string): Promise<QueryResult | any | any[]>;

  protected logQuery(query: string): void {
    this.logger.debug(`[query-logger] ${query}`);
  }

}

export interface QueryResult {
  affectedRows: number;
  insertId: number;
}
