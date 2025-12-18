import { Connection, QueryResult, Transaction, type ConnectionConfig, type ConnectionOptions, type ConnectionType } from '@mikro-orm/core';
import { type Configuration, Utils } from '@mikro-orm/core';
import neo4j, { type Driver, type Session, type SessionMode, type Transaction as Neo4jTx } from 'neo4j-driver';
import { type Result } from 'neo4j-driver';

export interface Neo4jConnectionOptions extends ConnectionOptions {
    user?: string;
    password?: string;
    database?: string;
    driverOptions?: Record<string, unknown>;
}

export class Neo4jConnection extends Connection {

    protected driver!: Driver;
    protected database?: string;

    constructor(config: Configuration, options?: ConnectionOptions, type: ConnectionType = 'write') {
        super(config, options, type);
    }

    override async connect(): Promise<void> {
        const opts = this.getConnectionOptions();
        this.driver = neo4j.driver(opts.url, neo4j.auth.basic(opts.user, opts.password), opts.driverOptions);
        this.database = opts.database;
        await this.driver.getServerInfo();
    }

    override async checkConnection(): Promise<{ ok: true; } | { ok: false; reason: string; error?: Error; }> {
        try {
            const connected = await this.isConnected();
            return connected ? { ok: true } : { ok: false, reason: 'Not connected' };
        } catch (e) {
            return { ok: false, reason: (e as Error).message, error: e as Error };
        }
    }

    override async close(force?: boolean): Promise<void> {
        void force; await this.driver.close();
    }

    async isConnected(): Promise<boolean> {
        try {
            await this.driver.getServerInfo();
            return true;
        } catch {
            return false;
        }
    }

    getSession(type: ConnectionType = 'write'): Session {
        const mode: SessionMode = type === 'read' ? neo4j.session.READ : neo4j.session.WRITE;
        return this.driver.session({ defaultAccessMode: mode, database: this.database });
    }
    override async execute<T>(cypher: string, params: any = {}, method?: 'all' | 'get' | 'run', ctx?: Transaction): Promise<QueryResult<T> | any | any[]> {
        const session = ctx ? (ctx as Neo4jTx) : this.getSession(method === 'run' ? 'write' : 'read');
        try {
            const paramObject = Array.isArray(params)
                ? params.reduce((acc, cur, i) => ({ ...acc, [`p${i}`]: cur }), {} as Record<string, unknown>)
                : params ?? {};
            const result = await session.run(cypher, paramObject);
            return {
                affectedRows: result.summary.counters.updates().length,
                insertId: 0 as any,
                insertedIds: [],
                rows: result.records.map(r => r.toObject()),
                row: result.records.length > 0 ? result.records[0].toObject() : undefined,
            } as unknown as QueryResult<T>;
        } finally {
            await session.close();
        }
    }

    async withTransaction<T>(cb: (tx: Neo4jTx) => Promise<T>, type: ConnectionType = 'write'): Promise<T> {
        const session = this.getSession(type);
        const tx = session.beginTransaction();
        try {
            const result = await cb(tx);
            await tx.commit();
            return result;
        } catch (e) {
            await tx.rollback().catch(() => undefined);
            throw e;
        } finally {
            await session.close();
        }
    }

    getDefaultClientUrl(): string {
        return 'bolt://localhost:7687';
    }

    override getConnectionOptions(): ConnectionConfig & { url: string; user: string; password: string; driverOptions?: Record<string, unknown>; database?: string } {
        const base = super.getConnectionOptions();
        const { user = 'neo4j', password = 'test', database } = base as Neo4jConnectionOptions;
        return {
            ...base,
            url: this.getClientUrl(),
            user,
            password,
            database,
            driverOptions: (base as Neo4jConnectionOptions).driverOptions,
        };
    }

    override getClientUrl(): string {
        const url = this.config.getClientUrl();
        return url ?? this.getDefaultClientUrl();
    }


}
