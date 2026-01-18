import {
  type MikroORM,
  type SqlEntityManager,
  SchemaGenerator,
  type EnsureDatabaseOptions, type ClearDatabaseOptions,
  type UpdateSchemaOptions,
  DatabaseSchema,
  SchemaComparator,
} from '@mikro-orm/sql';
import type { OracleSchemaHelper } from './OracleSchemaHelper.js';
import type { OracleConnection } from './OracleConnection.js';

export class OracleSchemaGenerator extends SchemaGenerator {

  declare protected helper: OracleSchemaHelper;
  declare protected connection: OracleConnection;

  static override register(orm: MikroORM): void {
    orm.config.registerExtension('@mikro-orm/schema-generator', () => new OracleSchemaGenerator(orm.em as SqlEntityManager));
  }

  /**
   * creates new database and connects to it
   */
  override async createDatabase(name?: string): Promise<void> {
    name ??= this.config.get('user')!;
    const tableSpace = this.config.get('schemaGenerator').tableSpace ?? 'mikro_orm';
    const password = this.connection.mapOptions({}).password;

    try {
      await this.execute(`create tablespace ${this.platform.quoteIdentifier(tableSpace)} datafile '${tableSpace}.dbf' size 100M autoextend on`);
    } catch (e: any) {
      if (e.code !== 'ORA-01543') {
        throw e;
      }
    }
    const sql = [
      `create user ${this.platform.quoteIdentifier(name)}`,
      `identified by ${this.platform.quoteIdentifier(password!)}`,
      `default tablespace ${this.platform.quoteIdentifier(tableSpace)}`,
      `quota unlimited on ${this.platform.quoteIdentifier(tableSpace)}`,
    ].join(' ');

    await this.execute(sql);
    await this.execute(`grant connect, resource to ${this.platform.quoteIdentifier(name)}`);

    this.config.set('user', name);
    await this.driver.reconnect();
  }

  override async dropDatabase(name?: string): Promise<void> {
    name ??= this.config.get('dbName')!;
    this.config.set('user', this.helper.getManagementDbName());
    await this.driver.reconnect();
    await this.execute(this.helper.getDropDatabaseSQL(name));
    this.config.set('user', name);
  }

  override async createNamespace(name: string): Promise<void> {
    const currentUser = this.config.get('user');
    const dbName = this.config.get('dbName');
    // mainUser is the user that will access the schema at runtime
    const mainUser = currentUser ?? dbName;

    this.config.set('user', this.helper.getManagementDbName());
    await this.driver.reconnect();

    try {
      const password = this.connection.mapOptions({}).password;
      const tableSpace = this.config.get('schemaGenerator').tableSpace ?? 'users';

      // Create user (schema) - similar to createDatabase
      try {
        const createUserSql = [
          `create user ${this.platform.quoteIdentifier(name)}`,
          `identified by ${password}`,
          `default tablespace ${this.platform.quoteIdentifier(tableSpace)}`,
          `quota unlimited on ${this.platform.quoteIdentifier(tableSpace)}`,
        ].join(' ');
        await this.execute(createUserSql);
      } catch (e: any) {
        // ORA-01920: user name conflicts with another user or role name
        if (e.code !== 'ORA-01920') {
          throw e;
        }
      }

      // Grant privileges to the new schema user so it can create its own objects
      await this.execute(`grant connect, resource to ${this.platform.quoteIdentifier(name)}`);

      // Grant DBA role to the main user for multi-schema support
      // This allows the main user to create tables in any schema and reference tables across schemas
      // DBA role includes CREATE ANY TABLE, SELECT ANY TABLE, REFERENCES on any table, etc.
      try {
        await this.execute(`grant dba to ${this.platform.quoteIdentifier(mainUser!)}`);
      } catch {
        // If DBA grant fails (e.g., insufficient privileges), fall back to individual grants
        // Note: This may not include REFERENCES privilege needed for cross-schema FKs
        await this.execute(`grant create any table, alter any table, drop any table, select any table, insert any table, update any table, delete any table, create any index, drop any index, create any sequence, select any sequence to ${this.platform.quoteIdentifier(mainUser!)}`);
      }

      // Grant REFERENCES on all existing tables in all other schemas to the new schema
      // This is needed for cross-schema FKs in Oracle
      const allSchemas = await this.helper.getNamespaces(this.connection);
      for (const otherSchema of allSchemas) {
        if (otherSchema.toLowerCase() !== name.toLowerCase() && otherSchema.toLowerCase() !== 'system') {
          // Connect as the other schema owner to grant REFERENCES on their tables
          this.config.set('user', otherSchema);
          await this.driver.reconnect();

          try {
            // Get all tables in the other schema
            const tables = await this.connection.execute<{ table_name: string }[]>(
              `select table_name from user_tables`,
            );
            for (const table of tables) {
              try {
                await this.execute(`grant references on ${this.platform.quoteIdentifier(table.table_name)} to ${this.platform.quoteIdentifier(name)}`);
              } catch {
                // Ignore errors
              }
            }
          } catch {
            // Ignore errors (e.g., if we can't connect as this user)
          }
        }
      }
    } finally {
      this.config.set('user', currentUser);
      await this.driver.reconnect();
    }
  }

  override async dropNamespace(name: string): Promise<void> {
    const currentUser = this.config.get('user');
    this.config.set('user', this.helper.getManagementDbName());
    await this.driver.reconnect();

    try {
      await super.dropNamespace(name);
    } finally {
      this.config.set('user', currentUser);
      await this.driver.reconnect();
    }
  }

  override async update(options: UpdateSchemaOptions<DatabaseSchema> = {}): Promise<void> {
    await this.ensureDatabase();

    // First, determine what namespaces need to be created
    options.safe ??= false;
    options.dropTables ??= true;
    const toSchema = this.getTargetSchema(options.schema);
    const schemas = toSchema.getNamespaces();
    const fromSchema = options.fromSchema ?? (await DatabaseSchema.create(this.connection, this.platform, this.config, options.schema, schemas, undefined, this.options.skipTables));
    const wildcardSchemaTables = [...this.metadata.getAll().values()].filter(meta => meta.schema === '*').map(meta => meta.tableName);
    fromSchema.prune(options.schema, wildcardSchemaTables);
    toSchema.prune(options.schema, wildcardSchemaTables);

    const comparator = new SchemaComparator(this.platform);
    const diff = comparator.compare(fromSchema, toSchema);

    // Create namespaces with privileged user first
    // This also grants DBA to the main user and REFERENCES on existing tables to new schemas
    for (const newNamespace of diff.newNamespaces) {
      await this.createNamespace(newNamespace);
    }

    // Clear newNamespaces so diffToSQL won't try to create them again
    // (they were just created above with proper privilege handling)
    diff.newNamespaces.clear();

    // Separate table creation from FK creation
    // Create a diff with only table creation (no orphaned FKs or changed tables)
    const tableOnlyDiff = {
      ...diff,
      orphanedForeignKeys: [],
      changedTables: {},
    };
    const tableSql = this.diffToSQL(tableOnlyDiff, options);

    if (tableSql.trim()) {
      await this.execute(tableSql);
    }

    // After tables are created, grant REFERENCES on them to all existing schemas
    // This is needed for cross-schema FKs in Oracle
    const currentUser = this.config.get('user');
    const allSchemas = await this.helper.getNamespaces(this.connection);

    for (const table of Object.values(diff.newTables)) {
      if (table.schema && table.schema !== this.platform.getDefaultSchemaName()) {
        // Connect as the table owner to grant REFERENCES
        this.config.set('user', table.schema);
        await this.driver.reconnect();

        try {
          // Grant REFERENCES on this table to all other schemas
          for (const otherSchema of allSchemas) {
            if (otherSchema.toLowerCase() !== table.schema.toLowerCase() && otherSchema.toLowerCase() !== 'system') {
              try {
                await this.execute(`grant references on ${this.platform.quoteIdentifier(table.name)} to ${this.platform.quoteIdentifier(otherSchema)}`);
              } catch {
                // Ignore errors (e.g., if other schema doesn't exist)
              }
            }
          }
          // Also grant to the main user
          const mainUser = currentUser ?? this.config.get('dbName');
          if (mainUser && mainUser.toLowerCase() !== table.schema.toLowerCase()) {
            try {
              await this.execute(`grant references on ${this.platform.quoteIdentifier(table.name)} to ${this.platform.quoteIdentifier(mainUser)}`);
            } catch {
              // Ignore errors
            }
          }
        } finally {
          this.config.set('user', currentUser);
          await this.driver.reconnect();
        }
      }
    }

    // Now execute any remaining SQL (FKs from changed tables, orphaned FKs)
    // Create a diff with only FK/index changes (no new tables)
    const fkOnlyDiff = {
      ...diff,
      newTables: {},
      newNativeEnums: [],
      removedNativeEnums: [],
      newNamespaces: new Set<string>(),
    };
    const fkSql = this.diffToSQL(fkOnlyDiff, options);

    if (fkSql.trim()) {
      await this.execute(fkSql);
    }
  }

  override async ensureDatabase(options?: EnsureDatabaseOptions): Promise<boolean> {
    const dbName = this.config.get('dbName')!;

    if (this.lastEnsuredDatabase === dbName && !options?.forceCheck) {
      return true;
    }

    let exists = false;

    try {
      exists = await this.helper.databaseExists(this.connection, dbName);
    } catch (e: any) {
      if (e.code === 'ORA-01017') {
        this.config.set('user', this.helper.getManagementDbName());
        await this.driver.reconnect();
        return await this.ensureDatabase();
      }

      throw e;
    }

    this.lastEnsuredDatabase = dbName;

    if (!exists) {
      this.config.set('user', this.helper.getManagementDbName());
      await this.driver.reconnect();
      await this.createDatabase(dbName);

      if (options?.create) {
        await this.create(options);
      }

      return true;
    }

    if (options?.clear) {
      await this.clear(options);
    }

    return false;
  }

  override async clear(options?: ClearDatabaseOptions): Promise<void> {
    // truncate by default, so no value is considered as true
    /* v8 ignore next 3 */
    if (options?.truncate === false) {
      return super.clear(options);
    }

    const targetSchema = options?.schema ?? this.config.get('schema', this.platform.getDefaultSchemaName());

    // https://stackoverflow.com/questions/253849/cannot-truncate-table-because-it-is-being-referenced-by-a-foreign-key-constraint
    for (const meta of this.getOrderedMetadata(options?.schema).reverse()) {
      // Use entity's explicit schema if defined, otherwise use target schema
      // This respects Oracle's schema = user model where tables only exist in their owner's schema
      const entitySchema = meta.schema && meta.schema !== '*' ? meta.schema : targetSchema;

      try {
        await this.driver.createQueryBuilder(meta.class, this.em?.getTransactionContext(), 'write', false)
          .withSchema(entitySchema)
          .truncate()
          .execute();
      } catch (e: any) {
        // Ignore "table does not exist" errors - the table might not exist in this schema
        if (e.code !== 'ORA-00942') {
          throw e;
        }
      }

      // const res = await this.driver.nativeDelete(meta.className, {}, options);
      const increments = meta.getPrimaryProps().filter(pk => pk.autoincrement);
      const tableName = this.driver.getTableName(meta, { schema: entitySchema }, false);

      for (const pk of increments) {
        try {
          await this.execute(`alter table "${tableName}" modify "${pk.fieldNames[0]}" generated by default as identity (start with limit value)`, {
            ctx: this.em?.getTransactionContext(),
          });
        } catch (e: any) {
          // Ignore "table does not exist" errors
          if (e.code !== 'ORA-00942') {
            throw e;
          }
        }
      }
    }

    this.clearIdentityMap();
  }

}
