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
      // Generate the SQL with the correct main user reference
      const sql = this.helper.getCreateNamespaceSQLWithMainUser(name, mainUser!);
      await this.execute(sql);
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

    // Get schema comparison to find new namespaces
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
    // This also grants the main user CREATE ANY TABLE, etc. privileges
    for (const newNamespace of diff.newNamespaces) {
      await this.createNamespace(newNamespace);
    }

    // Clear the newNamespaces so diffToSQL won't try to create them again
    diff.newNamespaces.clear();

    // Generate and execute the remaining SQL
    // The main user now has privileges to create objects in any schema
    const sql = this.diffToSQL(diff, options);
    if (sql.trim()) {
      await this.execute(sql);
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

    const schema = options?.schema ?? this.config.get('schema', this.platform.getDefaultSchemaName());

    // https://stackoverflow.com/questions/253849/cannot-truncate-table-because-it-is-being-referenced-by-a-foreign-key-constraint
    for (const meta of this.getOrderedMetadata(options?.schema).reverse()) {
      await this.driver.createQueryBuilder(meta.class, this.em?.getTransactionContext(), 'write', false)
        .withSchema(schema)
        .truncate()
        .execute();
      // const res = await this.driver.nativeDelete(meta.className, {}, options);
      const increments = meta.getPrimaryProps().filter(pk => pk.autoincrement);
      const tableName = this.driver.getTableName(meta, { schema: options?.schema }, false);

      for (const pk of increments) {
        await this.execute(`alter table "${tableName}" modify "${pk.fieldNames[0]}" generated by default as identity (start with limit value)`, {
          ctx: this.em?.getTransactionContext(),
        });
      }
    }

    this.clearIdentityMap();
  }

}
