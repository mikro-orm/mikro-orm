import {
  type Dictionary,
  type DropSchemaOptions,
  type MikroORM,
  type SqlEntityManager,
  type UpdateSchemaOptions,
  SchemaGenerator,
  SchemaComparator,
  DatabaseSchema,
  type DatabaseTable,
  type EnsureDatabaseOptions,
  type ClearDatabaseOptions,
} from '@mikro-orm/sql';
import type { OracleSchemaHelper } from './OracleSchemaHelper.js';
import type { OracleConnection } from './OracleConnection.js';

/** Schema generator with Oracle-specific behavior for multi-schema support and privilege management. */
export class OracleSchemaGenerator extends SchemaGenerator {
  declare protected helper: OracleSchemaHelper;
  declare protected connection: OracleConnection;

  /** Tracks whether the main user has been granted DBA (or equivalent) privileges. */
  private hasDbaGrant = false;

  static override register(orm: MikroORM): void {
    orm.config.registerExtension(
      '@mikro-orm/schema-generator',
      () => new OracleSchemaGenerator(orm.em as SqlEntityManager),
    );
  }

  /**
   * creates new database and connects to it
   */
  override async createDatabase(name?: string): Promise<void> {
    name ??= this.config.get('user')!;
    /* v8 ignore next: tableSpace fallback */
    const tableSpace = this.config.get('schemaGenerator').tableSpace ?? 'mikro_orm';
    const password = this.connection.mapOptions({}).password;

    try {
      await this.execute(
        `create tablespace ${this.platform.quoteIdentifier(tableSpace)} datafile '${tableSpace.replaceAll(`'`, `''`)}.dbf' size 100M autoextend on`,
      );
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

  /**
   * Oracle uses CASCADE CONSTRAINT in DROP TABLE and has no native enums,
   * so we can generate drop SQL from metadata alone — no DB introspection needed.
   */
  override async getDropSchemaSQL(options: Omit<DropSchemaOptions, 'dropDb'> = {}): Promise<string> {
    await this.ensureDatabase();
    const metadata = this.getOrderedMetadata(options.schema).reverse();
    const ret: string[] = [];

    for (const meta of metadata) {
      const schemaName = options.schema ?? this.config.get('schema');
      /* v8 ignore next: wildcard schema branch */
      const resolved = meta.schema === '*' ? schemaName : (meta.schema ?? schemaName);
      /* v8 ignore next: default schema resolution */
      const schema = resolved === this.platform.getDefaultSchemaName() ? undefined : resolved;
      this.helper.append(ret, this.helper.dropTableIfExists(meta.tableName, schema));
    }

    if (options.dropMigrationsTable) {
      this.helper.append(
        ret,
        this.helper.dropTableIfExists(this.config.get('migrations').tableName!, this.config.get('schema')),
      );
    }

    /* v8 ignore next: empty result branch */
    return ret.join('\n') + (ret.length ? '\n' : '');
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
      if (e.code === 'ORA-01017' && this.config.get('user') !== this.helper.getManagementDbName()) {
        this.config.set('user', this.helper.getManagementDbName());
        await this.driver.reconnect();
        const result = await this.ensureDatabase();

        // Restore connection to the original user (createDatabase does this
        // when the user doesn't exist, but we must handle the case where
        // the user already exists and ensureDatabase returned early)
        if (this.config.get('user') !== dbName) {
          this.config.set('user', dbName);
          await this.driver.reconnect();
        }

        return result;
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

  private getOriginalUser(): string {
    return this.config.get('user') ?? this.config.get('dbName')!;
  }

  /**
   * Connects as the management (system) user if not already connected as admin.
   * Returns the original user to restore later, or undefined if no reconnect was needed.
   */
  private async connectAsAdmin(): Promise<string | undefined> {
    if (this.hasDbaGrant) {
      return undefined;
    }

    // Check if the current user already has DBA privileges (avoids pool reconnect churn)
    const res = await this.connection.execute<{ granted_role: string }[]>(
      `select granted_role from user_role_privs where granted_role = 'DBA'`,
    );

    if (res.length > 0) {
      this.hasDbaGrant = true;
      return undefined;
    }

    const originalUser = this.getOriginalUser();
    this.config.set('user', this.helper.getManagementDbName());
    await this.driver.reconnect();

    return originalUser;
  }

  /**
   * Restores the connection to the original user after admin operations.
   */
  private async restoreConnection(originalUser: string | undefined): Promise<void> {
    if (originalUser == null) {
      return;
    }

    this.config.set('user', originalUser);
    await this.driver.reconnect();
  }

  /**
   * Grants DBA (or fallback individual privileges) to the main user.
   * Only executed once — subsequent calls are no-ops.
   */
  private async ensureDbaGrant(originalUser: string): Promise<void> {
    if (this.hasDbaGrant) {
      return;
    }

    try {
      await this.execute(`grant dba to ${this.platform.quoteIdentifier(originalUser)}`);
    } catch {
      await this.execute(`grant create any table to ${this.platform.quoteIdentifier(originalUser)}`);
      await this.execute(`grant alter any table to ${this.platform.quoteIdentifier(originalUser)}`);
      await this.execute(`grant drop any table to ${this.platform.quoteIdentifier(originalUser)}`);
      await this.execute(`grant create any index to ${this.platform.quoteIdentifier(originalUser)}`);
      await this.execute(`grant drop any index to ${this.platform.quoteIdentifier(originalUser)}`);
    }

    this.hasDbaGrant = true;
  }

  override async createNamespace(name: string): Promise<void> {
    const originalUser = this.getOriginalUser();
    const reconnectUser = await this.connectAsAdmin();

    try {
      await this.execute(this.helper.getCreateNamespaceSQL(name));
    } catch (e: any) {
      /* v8 ignore next 3: unexpected createNamespace error rethrow */
      if (e.code !== 'ORA-01920') {
        throw e;
      }
    }

    await this.execute(`grant connect, resource to ${this.platform.quoteIdentifier(name)}`);
    await this.ensureDbaGrant(originalUser);
    await this.grantReferencesForSchema(name);

    await this.restoreConnection(reconnectUser);
  }

  override async dropNamespace(name: string): Promise<void> {
    const reconnectUser = await this.connectAsAdmin();

    // Try drop first; only kill sessions if the user is currently connected
    try {
      await this.execute(this.helper.getDropNamespaceSQL(name));
    } catch (e: any) {
      if (e.code === 'ORA-01918') {
        // User does not exist — nothing to do
      } else if (e.code === 'ORA-01940') {
        try {
          const sessions = await this.connection.execute<{ sid: number; serial: number }[]>(
            `select sid, serial# as "serial" from v$session where username = ${this.platform.quoteValue(name.toUpperCase())}`,
          );

          for (const session of sessions) {
            try {
              await this.execute(`alter system kill session '${session.sid},${session.serial}' immediate`);
            } catch (e3: any) {
              this.config
                .getLogger()
                .warn('schema', `Failed to kill session ${session.sid},${session.serial}: ${e3.message}`);
            }
          }
        } catch (e3: any) {
          this.config.getLogger().warn('schema', `Cannot query v$session: ${e3.message}`);
        }

        try {
          await this.execute(this.helper.getDropNamespaceSQL(name));
        } catch (e2: any) {
          if (e2.code !== 'ORA-01918' && e2.code !== 'ORA-01940') {
            throw e2;
          }
        }
      } else {
        throw e;
      }
    }

    await this.restoreConnection(reconnectUser);
  }

  override async update(options: UpdateSchemaOptions<DatabaseSchema> = {}): Promise<void> {
    await this.ensureDatabase();
    options.safe ??= false;
    options.dropTables ??= true;
    const toSchema = this.getTargetSchema(options.schema);
    const schemas = toSchema.getNamespaces();
    const fromSchema =
      options.fromSchema ??
      (await DatabaseSchema.create(
        this.connection,
        this.platform,
        this.config,
        options.schema,
        schemas,
        undefined,
        this.options.skipTables,
        this.options.skipViews,
      ));
    const wildcardSchemaTables = [...this.metadata.getAll().values()]
      .filter(meta => meta.schema === '*')
      .map(/* v8 ignore next */ meta => meta.tableName);
    fromSchema.prune(options.schema, wildcardSchemaTables);
    toSchema.prune(options.schema, wildcardSchemaTables);

    const comparator = new SchemaComparator(this.platform);
    const diff = comparator.compare(fromSchema, toSchema);

    // Phase 1: Create namespaces — requires elevated privileges.
    // After granting DBA, we reconnect back to the original user so that
    // unqualified object names (e.g. indexes) are created in the correct schema.
    /* v8 ignore start: requires multi-schema Oracle setup */
    if (diff.newNamespaces.size > 0) {
      const originalUser = this.getOriginalUser();
      const reconnectUser = await this.connectAsAdmin();

      for (const ns of diff.newNamespaces) {
        try {
          await this.execute(this.helper.getCreateNamespaceSQL(ns));
        } catch (e: any) {
          if (e.code !== 'ORA-01920') {
            throw e;
          }
        }

        await this.execute(`grant connect, resource to ${this.platform.quoteIdentifier(ns)}`);
      }

      await this.ensureDbaGrant(originalUser);

      for (const ns of diff.newNamespaces) {
        await this.grantReferencesForSchema(ns);
      }

      await this.restoreConnection(reconnectUser);
    }
    /* v8 ignore stop */

    // Phase 2: Execute table creation and alterations (without FKs)
    // Build SQL without FK-related parts, and clear newNamespaces since we handled them in Phase 1
    const tableOnlyDiff = { ...diff, orphanedForeignKeys: [], newNamespaces: new Set<string>() };
    const savedChangedTables = { ...diff.changedTables };

    // Strip FK additions from changedTables for Phase 2
    // Keep removedForeignKeys so old FKs are dropped before column changes (via preAlterTable)
    // changedForeignKeys are dropped in preAlterTable but re-created in alterTable,
    // so we move them to removedForeignKeys for drop-only and handle re-creation in Phase 3
    const strippedChangedTables: Dictionary = {};
    for (const [key, table] of Object.entries(savedChangedTables)) {
      strippedChangedTables[key] = {
        ...table,
        addedForeignKeys: {},
        changedForeignKeys: {},
        removedForeignKeys: {
          ...table.removedForeignKeys,
          ...table.changedForeignKeys,
        },
      };
    }

    tableOnlyDiff.changedTables = strippedChangedTables;

    // Temporarily override getForeignKeys on new tables to suppress FK constraints in Phase 2
    // (Oracle requires REFERENCES grants before FK creation, handled in Phase 2.5 / Phase 3)
    const originalGetForeignKeys = new Map<DatabaseTable, () => Dictionary>();

    for (const table of Object.values(diff.newTables)) {
      originalGetForeignKeys.set(table, table.getForeignKeys.bind(table));
      table.getForeignKeys = () => ({});
    }

    tableOnlyDiff.newTables = diff.newTables;
    const tableSQL = this.diffToSQL(tableOnlyDiff, options);

    // Restore original getForeignKeys
    for (const [table, origFn] of originalGetForeignKeys) {
      table.getForeignKeys = origFn;
    }

    if (tableSQL) {
      await this.execute(tableSQL);
    }

    // Phase 2.5: Grant REFERENCES on newly created tables to all other schemas
    const allSchemas = [...schemas];

    for (const table of Object.values(diff.newTables)) {
      /* v8 ignore next: schema fallback chain */
      const tableSchema = table.schema ?? this.platform.getDefaultSchemaName() ?? '';

      for (const schema of allSchemas) {
        if (schema === tableSchema || schema === this.platform.getDefaultSchemaName()) {
          continue;
        }

        /* v8 ignore start: requires multi-schema Oracle setup */
        try {
          await this.execute(
            `grant references on ${this.platform.quoteIdentifier(tableSchema)}.${this.platform.quoteIdentifier(table.name)} to ${this.platform.quoteIdentifier(schema)}`,
          );
        } catch {
          // ignore errors (e.g., table doesn't exist yet in that schema)
        }
        /* v8 ignore stop */
      }
    }

    // Phase 3: Execute FK creation for new tables and FK changes for altered tables
    const fkStatements: string[] = [];

    // FK constraints for new tables
    for (const table of Object.values(diff.newTables)) {
      for (const fk of Object.values(table.getForeignKeys())) {
        fkStatements.push(this.helper.createForeignKey(table, fk));
      }
    }

    // FK drop for orphaned foreign keys (FKs pointing to removed tables)
    /* v8 ignore next 5: orphaned FKs are cascade-dropped with their referenced tables in Phase 2 */
    for (const orphanedForeignKey of diff.orphanedForeignKeys) {
      const [schemaName, tableName] = this.helper.splitTableName(orphanedForeignKey.localTableName, true);
      const name = (schemaName ? schemaName + '.' : '') + tableName;
      fkStatements.push(this.helper.dropForeignKey(name, orphanedForeignKey.constraintName));
    }

    // FK additions and re-creation of changed FKs (drops already handled in Phase 2)
    /* v8 ignore next 9: FK change branches depend on schema diff state */
    for (const table of Object.values(savedChangedTables)) {
      for (const fk of Object.values(table.addedForeignKeys ?? {})) {
        fkStatements.push(this.helper.createForeignKey(table.toTable, fk));
      }

      for (const fk of Object.values(table.changedForeignKeys ?? {})) {
        fkStatements.push(this.helper.createForeignKey(table.toTable, fk));
      }
    }

    for (const stmt of fkStatements.filter(s => s)) {
      await this.execute(stmt);
    }
  }

  override async clear(options?: ClearDatabaseOptions): Promise<void> {
    // truncate by default, so no value is considered as true
    if (options?.truncate === false) {
      return super.clear(options);
    }

    const stmts: string[] = [];

    for (const meta of this.getOrderedMetadata(options?.schema).reverse()) {
      const schema =
        meta.schema && meta.schema !== '*'
          ? meta.schema
          : (options?.schema ?? this.config.get('schema', this.platform.getDefaultSchemaName()));

      const tableName = this.driver.getTableName(meta, { schema }, false);
      const quoted = tableName
        .split('.')
        .map(p => this.platform.quoteIdentifier(p))
        .join('.');
      // Use DELETE instead of TRUNCATE to avoid ORA-02266 (FK constraint check regardless of data)
      stmts.push(
        `begin execute immediate 'delete from ${quoted}'; exception when others then if sqlcode != -942 then raise; end if; end;`,
      );

      for (const pk of meta.getPrimaryProps().filter(p => p.autoincrement)) {
        stmts.push(
          `begin execute immediate 'alter table ${quoted} modify ${this.platform.quoteIdentifier(pk.fieldNames[0])} generated by default as identity (start with limit value)'; exception when others then null; end;`,
        );
      }
    }

    /* v8 ignore next 5: empty stmts branch */
    if (stmts.length > 0) {
      // Use driver.execute directly to bypass the ;\n splitting in this.execute()
      // DELETE is DML (not DDL), so we must commit explicitly
      await this.driver.execute(`begin ${stmts.join(' ')} commit; end;`);
    }

    this.clearIdentityMap();
  }

  private async grantReferencesForSchema(schemaName: string): Promise<void> {
    const defaultSchema = this.platform.getDefaultSchemaName();
    const allSchemas = [...this.getTargetSchema().getNamespaces()];

    for (const otherSchema of allSchemas) {
      if (otherSchema === schemaName || otherSchema === defaultSchema) {
        continue;
      }

      // Get tables in the other schema and grant REFERENCES to the new schema
      const tables = await this.connection.execute<{ table_name: string }[]>(
        `select table_name from all_tables where owner = ${this.platform.quoteValue(otherSchema)}`,
      );

      for (const table of tables) {
        try {
          await this.execute(
            `grant references on ${this.platform.quoteIdentifier(otherSchema)}.${this.platform.quoteIdentifier(table.table_name)} to ${this.platform.quoteIdentifier(schemaName)}`,
          );
        } catch {
          // ignore errors
        }
      }

      // Also grant REFERENCES on new schema's tables to the other schema
      const newTables = await this.connection.execute<{ table_name: string }[]>(
        `select table_name from all_tables where owner = ${this.platform.quoteValue(schemaName)}`,
      );

      for (const table of newTables) {
        try {
          await this.execute(
            `grant references on ${this.platform.quoteIdentifier(schemaName)}.${this.platform.quoteIdentifier(table.table_name)} to ${this.platform.quoteIdentifier(otherSchema)}`,
          );
        } catch {
          // ignore errors
        }
      }
    }
  }
}
