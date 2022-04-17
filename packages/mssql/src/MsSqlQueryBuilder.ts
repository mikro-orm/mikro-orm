import type { AnyEntity, MetadataStorage, ConnectionType, RequiredEntityData } from '@mikro-orm/core';
import { MetadataError } from '@mikro-orm/core';
import type { AbstractSqlDriver, Knex, SqlEntityManager, InsertQueryBuilder } from '@mikro-orm/knex';
import { QueryBuilder } from '@mikro-orm/knex';

export class MsSqlQueryBuilder<T extends AnyEntity<T> = AnyEntity> extends QueryBuilder<T> {

    constructor(
        entityName: string,
        metadata: MetadataStorage,
        driver: AbstractSqlDriver,
        context?: Knex.Transaction,
        alias?: string,
        connectionType?: ConnectionType,
        em?: SqlEntityManager,
    ) {
        super(entityName, metadata, driver, context, alias, connectionType, em);
        this.opts = {
            entityName,
            metadata,
        };
    }

    private IDENTITY_INSERT_ON = false;
    private opts: {
        entityName: string;
        metadata: MetadataStorage;
    };

    setIdentityInsertOn() {
        this.IDENTITY_INSERT_ON = true;
    }

    private overrideToSql(qb: Knex.QueryBuilder, getSql: (results: Knex.Sql) => string) {
        const originalToSQL = qb.toSQL;
        const toSQL = () => {
            const results = originalToSQL.apply(qb);
            return {
                ...results,
                sql: getSql(results),
            };
        };
        qb.toSQL = toSQL;
    }

    private appendIdentityInsert(qb: Knex.QueryBuilder) {
        this.overrideToSql(qb, (results: Knex.Sql) => {
            const { metadata, entityName } = this.opts;
            const { tableName, schema } = metadata.get(entityName);
            const table = schema ? `${schema}.${tableName}` : tableName;
            return `SET IDENTITY_INSERT ${table} ON; ${results.sql}; SET IDENTITY_INSERT ${table} OFF;`;
        });
    }

    private checkIdentityInsert(data: RequiredEntityData<T> | RequiredEntityData<T>[]) {
        try {
            let originalData = data;
            if (!Array.isArray(originalData)) { originalData = [originalData]; }
            const values = originalData.flatMap(Object.keys);

            const { metadata, entityName } = this.opts;
            const { properties } = metadata.get(entityName);
            const identities = values.map(x => properties[x]).filter(x => x.autoincrement);

            if (identities.length > 0) { this.setIdentityInsertOn(); }
        } catch (err) {
            if (!(err instanceof MetadataError)) {
                throw err;
            }
        }
    }

    insert(data: RequiredEntityData<T> | RequiredEntityData<T>[]): InsertQueryBuilder<T> {
        this.checkIdentityInsert(data);
        return super.insert(data);
    }

    getKnex(): Knex.QueryBuilder {
        const qb = super.getKnex();
        if (this.IDENTITY_INSERT_ON) { this.appendIdentityInsert(qb); }
        return qb;
    }

}
