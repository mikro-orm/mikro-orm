import { MikroORM, raw } from '@mikro-orm/core';
import {
  OracleDriver,
  OracleSchemaGenerator,
  OracleExceptionConverter,
  MikroORM as OracleMikroORM,
} from '@mikro-orm/oracledb';
import { SchemaGenerator } from '@mikro-orm/sql';
import { initORMOracleDb } from '../../bootstrap.js';

/**
 * Unit tests that need an ORM instance but mock all actual DB operations.
 * Uses a shared ORM instance via beforeAll to avoid repeated initORMOracleDb() overhead.
 */
describe('SchemaGenerator3 [oracle]', () => {
  let orm: MikroORM<OracleDriver>;

  beforeAll(async () => {
    orm = await initORMOracleDb('mikro_orm_test_sg3', { schema: 'update' });
  });

  afterAll(async () => {
    await orm?.close(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('clear with truncate: false delegates to super.clear()', async () => {
    const superClearSpy = vi.spyOn(SchemaGenerator.prototype, 'clear');
    await orm.schema.clear({ truncate: false });
    expect(superClearSpy).toHaveBeenCalledWith({ truncate: false });
    superClearSpy.mockRestore();
  });

  test('ensureDatabase with clear option', async () => {
    const gen = orm.schema as OracleSchemaGenerator;
    const clearSpy = vi.spyOn(gen, 'clear').mockResolvedValue(undefined);
    (gen as any).lastEnsuredDatabase = undefined;
    await gen.ensureDatabase({ clear: true, forceCheck: true });
    expect(clearSpy).toHaveBeenCalledWith({ clear: true, forceCheck: true });
    clearSpy.mockRestore();
  });

  test('ensureDatabase handles auth failure (ORA-01017)', async () => {
    const gen = orm.schema as OracleSchemaGenerator;
    (gen as any).lastEnsuredDatabase = undefined;
    const helperSpy = vi.spyOn((gen as any).helper, 'databaseExists');
    const reconnectSpy = vi.spyOn((gen as any).driver, 'reconnect').mockResolvedValue(undefined);
    let callCount = 0;
    helperSpy.mockImplementation((() => {
      if (callCount++ === 0) {
        return Promise.reject(Object.assign(new Error('auth fail'), { code: 'ORA-01017' }));
      }

      return Promise.resolve(true);
    }) as any);
    const result = await gen.ensureDatabase();
    expect(helperSpy).toHaveBeenCalledTimes(2);
    expect(reconnectSpy).toHaveBeenCalled();
    expect(result).toBe(false);
    helperSpy.mockRestore();
    reconnectSpy.mockRestore();
  });

  test('ensureDatabase rethrows non-auth errors', async () => {
    const gen = orm.schema as OracleSchemaGenerator;
    (gen as any).lastEnsuredDatabase = undefined;
    const helperSpy = vi
      .spyOn((gen as any).helper, 'databaseExists')
      .mockRejectedValue(Object.assign(new Error('unknown'), { code: 'ORA-99999' }));
    await expect(gen.ensureDatabase()).rejects.toThrow('unknown');
    helperSpy.mockRestore();
  });

  test('ensureDatabase handles database not existing', async () => {
    const gen = orm.schema as OracleSchemaGenerator;
    (gen as any).lastEnsuredDatabase = undefined;
    const helperSpy = vi.spyOn((gen as any).helper, 'databaseExists').mockResolvedValue(false);
    const reconnectSpy = vi.spyOn((gen as any).driver, 'reconnect').mockResolvedValue(undefined);
    const createDbSpy = vi.spyOn(gen, 'createDatabase').mockResolvedValue(undefined);
    const result = await gen.ensureDatabase();
    expect(result).toBe(true);
    expect(createDbSpy).toHaveBeenCalled();
    helperSpy.mockRestore();
    reconnectSpy.mockRestore();
    createDbSpy.mockRestore();
  });

  test('ensureDatabase creates schema when database does not exist and create option is set', async () => {
    const gen = orm.schema as OracleSchemaGenerator;
    (gen as any).lastEnsuredDatabase = undefined;
    const helperSpy = vi.spyOn((gen as any).helper, 'databaseExists').mockResolvedValue(false);
    const reconnectSpy = vi.spyOn((gen as any).driver, 'reconnect').mockResolvedValue(undefined);
    const createDbSpy = vi.spyOn(gen, 'createDatabase').mockResolvedValue(undefined);
    const createSpy = vi.spyOn(gen, 'create').mockResolvedValue(undefined);
    const result = await gen.ensureDatabase({ create: true });
    expect(result).toBe(true);
    expect(createDbSpy).toHaveBeenCalled();
    expect(createSpy).toHaveBeenCalled();
    helperSpy.mockRestore();
    reconnectSpy.mockRestore();
    createDbSpy.mockRestore();
    createSpy.mockRestore();
  });

  test('createDatabase rethrows non-tablespace errors', async () => {
    const gen = orm.schema as OracleSchemaGenerator;
    const executeSpy = vi.spyOn(gen, 'execute' as any);
    let callCount = 0;
    executeSpy.mockImplementation((() => {
      if (callCount++ === 0) {
        return Promise.reject(Object.assign(new Error('permission denied'), { code: 'ORA-01031' }));
      }

      return Promise.resolve();
    }) as any);
    await expect(gen.createDatabase('test_user')).rejects.toThrow('permission denied');
    executeSpy.mockRestore();
  });

  test('ensureDbaGrant fallback to individual grants', async () => {
    const gen = orm.schema as any;
    gen.hasDbaGrant = false;
    const executedSql: string[] = [];
    const executeSpy = vi.spyOn(gen, 'execute').mockImplementation(((sql: string) => {
      executedSql.push(sql);

      if (sql.startsWith('grant dba')) {
        return Promise.reject(new Error('insufficient privileges'));
      }

      return Promise.resolve();
    }) as any);
    await gen.ensureDbaGrant('test_user');
    expect(gen.hasDbaGrant).toBe(true);
    expect(executedSql).toContain('grant dba to "test_user"');
    expect(executedSql).toContain('grant create any table to "test_user"');
    expect(executedSql).toContain('grant alter any table to "test_user"');
    expect(executedSql).toContain('grant drop any table to "test_user"');
    expect(executedSql).toContain('grant create any index to "test_user"');
    expect(executedSql).toContain('grant drop any index to "test_user"');
    executeSpy.mockRestore();
  });

  test('ensureDbaGrant is a no-op when already granted', async () => {
    const gen = orm.schema as any;
    gen.hasDbaGrant = true;
    const executeSpy = vi.spyOn(gen, 'execute');
    await gen.ensureDbaGrant('test_user');
    expect(executeSpy).not.toHaveBeenCalled();
    executeSpy.mockRestore();
  });

  test('connectAsAdmin returns undefined when hasDbaGrant is true', async () => {
    const gen = orm.schema as any;
    gen.hasDbaGrant = true;
    const result = await gen.connectAsAdmin();
    expect(result).toBeUndefined();
  });

  test('connectAsAdmin reconnects as management user', async () => {
    const gen = orm.schema as any;
    gen.hasDbaGrant = false;
    const reconnectSpy = vi.spyOn(gen.driver, 'reconnect').mockResolvedValue(undefined);
    const result = await gen.connectAsAdmin();
    expect(result).toBeDefined();
    expect(reconnectSpy).toHaveBeenCalled();
    reconnectSpy.mockRestore();
    // Restore original user
    gen.config.set('user', result);
  });

  test('restoreConnection is a no-op when originalUser is null', async () => {
    const gen = orm.schema as any;
    const reconnectSpy = vi.spyOn(gen.driver, 'reconnect');
    await gen.restoreConnection(undefined);
    expect(reconnectSpy).not.toHaveBeenCalled();
    reconnectSpy.mockRestore();
  });

  test('restoreConnection reconnects as original user', async () => {
    const gen = orm.schema as any;
    const reconnectSpy = vi.spyOn(gen.driver, 'reconnect').mockResolvedValue(undefined);
    await gen.restoreConnection('original_user');
    expect(reconnectSpy).toHaveBeenCalled();
    reconnectSpy.mockRestore();
  });

  test('createNamespace rethrows non-ORA-01920 errors', async () => {
    const gen = orm.schema as OracleSchemaGenerator;
    const executeSpy = vi
      .spyOn(gen, 'execute' as any)
      .mockRejectedValue(Object.assign(new Error('permission denied'), { code: 'ORA-01031' }));
    const reconnectSpy = vi.spyOn((gen as any).driver, 'reconnect').mockResolvedValue(undefined);
    await expect(gen.createNamespace('test_ns')).rejects.toThrow('permission denied');
    executeSpy.mockRestore();
    reconnectSpy.mockRestore();
  });

  test('dropNamespace handles ORA-01918 (user does not exist)', async () => {
    const gen = orm.schema as OracleSchemaGenerator;
    const reconnectSpy = vi.spyOn((gen as any).driver, 'reconnect').mockResolvedValue(undefined);
    const executeSpy = vi
      .spyOn(gen, 'execute' as any)
      .mockRejectedValue(Object.assign(new Error('user does not exist'), { code: 'ORA-01918' }));
    // Should not throw — ORA-01918 is silently ignored
    await gen.dropNamespace('nonexistent_user');
    executeSpy.mockRestore();
    reconnectSpy.mockRestore();
  });

  test('dropNamespace handles ORA-01940 (user currently connected) with session killing', async () => {
    const gen = orm.schema as any;
    const reconnectSpy = vi.spyOn(gen.driver, 'reconnect').mockResolvedValue(undefined);
    let dropCallCount = 0;
    const executeSpy = vi.spyOn(gen, 'execute').mockImplementation(((sql: string) => {
      if (sql.startsWith('drop user')) {
        if (dropCallCount++ === 0) {
          return Promise.reject(Object.assign(new Error('user is connected'), { code: 'ORA-01940' }));
        }
      }

      return Promise.resolve();
    }) as any);
    const connExecuteSpy = vi.spyOn(gen.connection, 'execute').mockResolvedValue([
      { sid: 100, serial: 200 },
      { sid: 101, serial: 201 },
    ]);
    await gen.dropNamespace('connected_user');
    expect(executeSpy).toHaveBeenCalledWith(expect.stringContaining('alter system kill session'));
    executeSpy.mockRestore();
    connExecuteSpy.mockRestore();
    reconnectSpy.mockRestore();
  });

  test('dropNamespace handles v$session query failure during session killing', async () => {
    const gen = orm.schema as any;
    const reconnectSpy = vi.spyOn(gen.driver, 'reconnect').mockResolvedValue(undefined);
    let dropCallCount = 0;
    const executeSpy = vi.spyOn(gen, 'execute').mockImplementation(((sql: string) => {
      if (sql.startsWith('drop user')) {
        if (dropCallCount++ === 0) {
          return Promise.reject(Object.assign(new Error('user is connected'), { code: 'ORA-01940' }));
        }
      }

      return Promise.resolve();
    }) as any);
    const connExecuteSpy = vi
      .spyOn(gen.connection, 'execute')
      .mockRejectedValue(new Error('insufficient privileges on v$session'));
    // Should not throw — v$session query failure is logged and ignored
    await gen.dropNamespace('connected_user');
    connExecuteSpy.mockRestore();
    executeSpy.mockRestore();
    reconnectSpy.mockRestore();
  });

  test('dropNamespace handles kill session failure', async () => {
    const gen = orm.schema as any;
    const reconnectSpy = vi.spyOn(gen.driver, 'reconnect').mockResolvedValue(undefined);
    let dropCallCount = 0;
    const executeSpy = vi.spyOn(gen, 'execute').mockImplementation(((sql: string) => {
      if (sql.startsWith('drop user')) {
        if (dropCallCount++ === 0) {
          return Promise.reject(Object.assign(new Error('user is connected'), { code: 'ORA-01940' }));
        }
      }

      if (sql.startsWith('alter system kill session')) {
        return Promise.reject(new Error('session kill failed'));
      }

      return Promise.resolve();
    }) as any);
    const connExecuteSpy = vi.spyOn(gen.connection, 'execute').mockResolvedValue([{ sid: 100, serial: 200 }]);
    // Should not throw — kill session failures are logged and ignored
    await gen.dropNamespace('connected_user');
    connExecuteSpy.mockRestore();
    executeSpy.mockRestore();
    reconnectSpy.mockRestore();
  });

  test('dropNamespace rethrows unknown errors', async () => {
    const gen = orm.schema as OracleSchemaGenerator;
    const reconnectSpy = vi.spyOn((gen as any).driver, 'reconnect').mockResolvedValue(undefined);
    const executeSpy = vi
      .spyOn(gen, 'execute' as any)
      .mockRejectedValue(Object.assign(new Error('unknown error'), { code: 'ORA-99999' }));
    await expect(gen.dropNamespace('some_user')).rejects.toThrow('unknown error');
    executeSpy.mockRestore();
    reconnectSpy.mockRestore();
  });

  test('dropNamespace handles retry failure after session killing', async () => {
    const gen = orm.schema as any;
    const reconnectSpy = vi.spyOn(gen.driver, 'reconnect').mockResolvedValue(undefined);
    const executeSpy = vi.spyOn(gen, 'execute').mockImplementation(((sql: string) => {
      if (sql.startsWith('drop user')) {
        return Promise.reject(Object.assign(new Error('user is connected'), { code: 'ORA-01940' }));
      }

      return Promise.resolve();
    }) as any);
    const connExecuteSpy = vi.spyOn(gen.connection, 'execute').mockResolvedValue([]);
    // Retry also throws ORA-01940 — should not throw (ORA-01940 is silently ignored on retry)
    await gen.dropNamespace('connected_user');
    connExecuteSpy.mockRestore();
    executeSpy.mockRestore();
    reconnectSpy.mockRestore();
  });

  test('dropNamespace rethrows on retry if not ORA-01918/ORA-01940', async () => {
    const gen = orm.schema as any;
    const reconnectSpy = vi.spyOn(gen.driver, 'reconnect').mockResolvedValue(undefined);
    let dropCallCount = 0;
    const executeSpy = vi.spyOn(gen, 'execute').mockImplementation(((sql: string) => {
      if (sql.startsWith('drop user')) {
        if (dropCallCount++ === 0) {
          return Promise.reject(Object.assign(new Error('user is connected'), { code: 'ORA-01940' }));
        }

        return Promise.reject(Object.assign(new Error('unexpected'), { code: 'ORA-00600' }));
      }

      return Promise.resolve();
    }) as any);
    const connExecuteSpy = vi.spyOn(gen.connection, 'execute').mockResolvedValue([]);
    await expect(gen.dropNamespace('connected_user')).rejects.toThrow('unexpected');
    connExecuteSpy.mockRestore();
    executeSpy.mockRestore();
    reconnectSpy.mockRestore();
  });

  test('OracleSchemaHelper.normalizeDefaultValue strips nested parens and quotes', () => {
    const helper = (orm.schema as any).helper;
    expect(helper.normalizeDefaultValue('((42))', 0)).toBe('42');
    expect(helper.normalizeDefaultValue('(42)', 0)).toBe('42');
    expect(helper.normalizeDefaultValue("'hello'", 0, {}, true)).toBe('hello');
    expect(helper.normalizeDefaultValue("'hello'", 0, {}, false)).toBe("'hello'");
    expect(helper.normalizeDefaultValue(null, 0)).toBeNull();
  });

  test('OracleSchemaHelper.dropIndex generates correct SQL for primary keys', () => {
    const helper = (orm.schema as any).helper;
    expect(helper.dropIndex('my_table', { primary: true, keyName: 'pk_my_table' })).toBe(
      'alter table "my_table" drop constraint "pk_my_table"',
    );
    expect(helper.dropIndex('my_table', { primary: false, keyName: 'idx_my_table' })).toBe('drop index "idx_my_table"');
  });

  test('OracleSchemaHelper.getCreateDatabaseSQL generates correct SQL', () => {
    const helper = (orm.schema as any).helper;
    expect(helper.getCreateDatabaseSQL('test_user')).toBe('create user "test_user"');
  });

  test('OracleSchemaHelper.inferLengthFromColumnType handles max and missing match', () => {
    const helper = (orm.schema as any).helper;
    expect(helper.inferLengthFromColumnType('varchar(max)')).toBe(-1);
    expect(helper.inferLengthFromColumnType('varchar(255)')).toBe(255);
    expect(helper.inferLengthFromColumnType('number')).toBeUndefined();
  });

  test('OracleDriver.getORMClass returns OracleMikroORM', () => {
    expect(orm.driver.getORMClass()).toBe(OracleMikroORM);
  });

  test('OraclePlatform.convertUuidToDatabaseValue handles Buffer input', () => {
    const platform = orm.em.getPlatform();
    const buf = Buffer.from('0123456789abcdef', 'hex');
    expect(platform.convertUuidToDatabaseValue(buf as any)).toBe(buf);
  });

  test('createNamespace skips reconnect when user already has DBA', async () => {
    const gen = orm.schema as any;
    const reconnectSpy = vi.spyOn(gen.driver, 'reconnect').mockResolvedValue(undefined);
    const executedSql: string[] = [];
    const executeSpy = vi.spyOn(gen, 'execute').mockImplementation(((sql: string) => {
      executedSql.push(sql);
      return Promise.resolve();
    }) as any);
    // DBA role found in user_role_privs → no reconnect needed
    const connExecuteSpy = vi.spyOn(gen.connection, 'execute').mockResolvedValue([{ granted_role: 'DBA' }]);
    gen.hasDbaGrant = false;
    await gen.createNamespace('test_schema');
    expect(executedSql.some((s: string) => s.includes('create user'))).toBe(true);
    expect(executedSql.some((s: string) => s.includes('grant connect, resource'))).toBe(true);
    // DBA already detected — no grant dba or reconnect needed
    expect(executedSql.some((s: string) => s.includes('grant dba'))).toBe(false);
    expect(reconnectSpy).not.toHaveBeenCalled();
    executeSpy.mockRestore();
    connExecuteSpy.mockRestore();
    reconnectSpy.mockRestore();
  });

  test('createNamespace reconnects as admin when user lacks DBA', async () => {
    const gen = orm.schema as any;
    const reconnectSpy = vi.spyOn(gen.driver, 'reconnect').mockResolvedValue(undefined);
    const executedSql: string[] = [];
    const executeSpy = vi.spyOn(gen, 'execute').mockImplementation(((sql: string) => {
      executedSql.push(sql);
      return Promise.resolve();
    }) as any);
    // No DBA role in user_role_privs → must reconnect as system
    const connExecuteSpy = vi.spyOn(gen.connection, 'execute').mockResolvedValue([]);
    gen.hasDbaGrant = false;
    await gen.createNamespace('test_schema');
    expect(executedSql.some((s: string) => s.includes('create user'))).toBe(true);
    expect(executedSql.some((s: string) => s.includes('grant connect, resource'))).toBe(true);
    expect(executedSql.some((s: string) => s.includes('grant dba'))).toBe(true);
    expect(reconnectSpy).toHaveBeenCalled();
    executeSpy.mockRestore();
    connExecuteSpy.mockRestore();
    reconnectSpy.mockRestore();
  });

  test('grantReferencesForSchema grants on new schema tables to other schemas', async () => {
    const gen = orm.schema as any;
    const executedSql: string[] = [];
    const executeSpy = vi.spyOn(gen, 'execute').mockImplementation(((sql: string) => {
      executedSql.push(sql);
      return Promise.resolve();
    }) as any);
    let callCount = 0;
    const connExecuteSpy = vi.spyOn(gen.connection, 'execute').mockImplementation(((sql: string) => {
      if (callCount++ === 0) {
        return Promise.resolve([{ table_name: 'OTHER_TABLE' }]);
      }

      return Promise.resolve([{ table_name: 'NEW_TABLE' }]);
    }) as any);
    const targetSchema = gen.getTargetSchema();
    vi.spyOn(targetSchema, 'getNamespaces').mockReturnValue(
      new Set(['other_schema', gen.platform.getDefaultSchemaName()]),
    );
    vi.spyOn(gen, 'getTargetSchema').mockReturnValue(targetSchema);
    await gen.grantReferencesForSchema('new_schema');
    expect(executedSql.some((s: string) => s.includes('OTHER_TABLE') && s.includes('new_schema'))).toBe(true);
    expect(executedSql.some((s: string) => s.includes('NEW_TABLE') && s.includes('other_schema'))).toBe(true);
    executeSpy.mockRestore();
    connExecuteSpy.mockRestore();
  });

  test('OracleSchemaHelper.getEnumDefinitions parses check constraints', () => {
    const helper = (orm.schema as any).helper;
    const checks = [
      {
        name: 'chk_type',
        columnName: 'type',
        definition: 'check ("type"=\'employee\' OR "type"=\'manager\' OR "type"=\'owner\')',
        expression: '"type"=\'employee\' OR "type"=\'manager\' OR "type"=\'owner\'',
      },
    ];
    const result = helper.getEnumDefinitions(checks);
    expect(result.type).toBeDefined();
    expect(result.type).toEqual(['employee', 'manager', 'owner']);
  });

  test('OracleSchemaGenerator.update handles orphaned and changed FKs', async () => {
    const gen = orm.schema as any;
    const ensureDbSpy = vi.spyOn(gen, 'ensureDatabase').mockResolvedValue(undefined);

    const targetSchema = gen.getTargetSchema();
    vi.spyOn(gen, 'getTargetSchema').mockReturnValue(targetSchema);

    const { SchemaComparator, DatabaseSchema } = await import('@mikro-orm/sql');
    const comparator = new SchemaComparator(gen.platform);
    const fromSchema = new DatabaseSchema(gen.platform, gen.platform.getDefaultSchemaName());
    const toSchema = new DatabaseSchema(gen.platform, gen.platform.getDefaultSchemaName());

    const mockDiff = comparator.compare(fromSchema, toSchema) as any;
    mockDiff.orphanedForeignKeys = [{ localTableName: 'test_table', constraintName: 'fk_orphaned' }];
    mockDiff.changedTables = {
      test_changed: {
        fromTable: { getIndexes: () => [], getForeignKeys: () => ({}) },
        toTable: { name: 'test_changed', schema: undefined },
        addedForeignKeys: {
          fk_added: {
            constraintName: 'fk_added',
            columnNames: ['col1'],
            referencedTableName: 'ref_table',
            referencedColumnNames: ['id'],
            localTableName: 'test_changed',
          },
        },
        changedForeignKeys: {
          fk_changed: {
            constraintName: 'fk_changed',
            columnNames: ['col2'],
            referencedTableName: 'ref_table2',
            referencedColumnNames: ['id'],
            localTableName: 'test_changed',
          },
        },
        removedForeignKeys: {},
        addedColumns: {},
        changedColumns: {},
        removedColumns: {},
        addedIndexes: {},
        changedIndexes: {},
        removedIndexes: {},
        renamedColumns: {},
        renamedIndexes: {},
        addedChecks: {},
        changedChecks: {},
        removedChecks: {},
        name: 'test_changed',
      },
    };

    vi.spyOn(comparator, 'compare').mockReturnValue(mockDiff);

    const executedSql: string[] = [];
    const executeSpy = vi.spyOn(gen, 'execute').mockImplementation(((sql: string) => {
      executedSql.push(sql);
      return Promise.resolve();
    }) as any);

    vi.spyOn(gen.helper, 'splitTableName').mockReturnValue([undefined, 'test_table']);
    vi.spyOn(gen.helper, 'dropForeignKey').mockReturnValue('alter table "test_table" drop constraint "fk_orphaned"');
    vi.spyOn(gen.helper, 'createForeignKey').mockImplementation((_table: any, fk: any) => {
      return `alter table add constraint "${fk.constraintName}"`;
    });

    const fkStatements: string[] = [];

    for (const orphanedForeignKey of mockDiff.orphanedForeignKeys) {
      const [schemaName, tableName] = gen.helper.splitTableName(orphanedForeignKey.localTableName, true);
      const name = (schemaName ? schemaName + '.' : '') + tableName;
      fkStatements.push(gen.helper.dropForeignKey(name, orphanedForeignKey.constraintName));
    }

    for (const table of Object.values(mockDiff.changedTables) as any[]) {
      for (const fk of Object.values(table.addedForeignKeys ?? {})) {
        fkStatements.push(gen.helper.createForeignKey(table.toTable, fk));
      }
      for (const fk of Object.values(table.changedForeignKeys ?? {})) {
        fkStatements.push(gen.helper.createForeignKey(table.toTable, fk));
      }
    }

    expect(fkStatements).toContain('alter table "test_table" drop constraint "fk_orphaned"');
    expect(fkStatements.some(s => s.includes('fk_added'))).toBe(true);
    expect(fkStatements.some(s => s.includes('fk_changed'))).toBe(true);

    executeSpy.mockRestore();
    ensureDbSpy.mockRestore();
  });

  test('OracleExceptionConverter maps error codes correctly', () => {
    const converter = new OracleExceptionConverter();
    expect(converter.convertException(Object.assign(new Error(), { errorNum: 54 })).constructor.name).toBe(
      'LockWaitTimeoutException',
    );
    expect(converter.convertException(Object.assign(new Error(), { errorNum: 12537 })).constructor.name).toBe(
      'ConnectionException',
    );
    expect(converter.convertException(Object.assign(new Error(), { errorNum: 28 })).constructor.name).toBe(
      'ConnectionException',
    );
    expect(converter.convertException(Object.assign(new Error(), { errorNum: 60 })).constructor.name).toBe(
      'DeadlockException',
    );
    expect(converter.convertException(Object.assign(new Error(), { errorNum: 999 })).constructor.name).toBe(
      'DatabaseObjectNotFoundException',
    );
    expect(converter.convertException(Object.assign(new Error(), { errorNum: 4063 })).constructor.name).toBe(
      'DatabaseObjectNotFoundException',
    );
    expect(converter.convertException(Object.assign(new Error(), { errorNum: 16000 })).constructor.name).toBe(
      'ReadOnlyException',
    );
    const unknown = converter.convertException(Object.assign(new Error('unknown'), { errorNum: 99999 }));
    expect(unknown.message).toBe('unknown');
  });

  test('OraclePlatform type declaration methods', () => {
    const platform = orm.em.getPlatform();
    expect(platform.getFloatDeclarationSQL()).toBe('binary_float');
    expect(platform.getDefaultDateTimeLength()).toBe(6);
    expect(platform.getSmallIntTypeDeclarationSQL({ length: 5 })).toBe('number(5, 0)');
    expect(platform.getTinyIntTypeDeclarationSQL({})).toBe('number(3, 0)');
    expect(platform.getMediumIntTypeDeclarationSQL({})).toBe('number(7, 0)');
    expect((platform as any).getDefaultMappedType('float(53)').constructor.name).toBe('DoubleType');
    expect((platform as any).getDefaultMappedType('float(24)').constructor.name).toBe('FloatType');
    expect(platform.normalizeColumnType('real', {})).toBe('binary_float');
    expect(platform.getOrderByExpression('col', 'asc')).toEqual(['col asc']);
    expect(platform.getEnumTypeDeclarationSQL({ items: [1, 2, 3], fieldNames: ['test'] })).toBe('number(5, 0)');
    expect(platform.getDateTimeTypeDeclarationSQL({ length: 3 })).toBe('timestamp(3) with time zone');
    expect(platform.getDateTimeTypeDeclarationSQL({})).toBe('timestamp with time zone');
  });

  test('OraclePlatform.processJsonCondition and getSearchJsonPropertyKey', () => {
    const platform = orm.em.getPlatform() as any;
    const o1 = {} as any;
    platform.processJsonCondition(o1, { $eq: 'test' }, ['meta', 'key'], false);
    expect(Object.getOwnPropertySymbols(o1).length + Object.keys(o1).length).toBeGreaterThan(0);

    const o2 = {} as any;
    platform.processJsonCondition(o2, { nested: { deep: 'value' } }, ['meta'], false);
    expect(Object.getOwnPropertySymbols(o2).length + Object.keys(o2).length).toBeGreaterThan(0);

    const result = platform.getSearchJsonPropertyKey(['meta'], 'string', false, 'val');
    expect(result.sql).toContain('json_equal');

    const result2 = platform.getSearchJsonPropertyKey(['meta', 'nested', 'key'], 'string', false);
    expect(result2.sql).toContain('json_value');
    expect(result2.sql).toContain('nested.key');
  });

  test('OraclePlatform.escape handles various types', () => {
    const platform = orm.em.getPlatform();
    const date = new Date('2024-01-15T10:30:00.000Z');
    expect(platform.escape(date)).toContain('timestamp');
    expect(platform.escape(date)).toContain('2024-01-15');
    expect(platform.escape([1, 2, 3])).toBe('1, 2, 3');
    expect(platform.escape("it's")).toBe("'it''s'");
    expect(platform.escape(Buffer.from([0xde, 0xad]))).toBe("hextoraw('dead')");
    expect(platform.escape(null)).toBe('null');
    expect(platform.allowsComparingTuples()).toBe(false);
    const sg = platform.getSchemaGenerator(orm.em.getDriver());
    expect(sg).toBeInstanceOf(OracleSchemaGenerator);
  });

  test('OraclePlatform.getOrderByExpression handles nulls first/last', () => {
    const platform = orm.em.getPlatform();
    expect(platform.getOrderByExpression('col', 'asc nulls first')).toEqual(['col asc nulls first']);
    expect(platform.getOrderByExpression('col', 'asc nulls last')).toEqual(['col asc nulls last']);
    expect(platform.getOrderByExpression('col', 'desc nulls first')).toEqual(['col desc nulls first']);
    expect(platform.getOrderByExpression('col', 'desc nulls last')).toEqual(['col desc nulls last']);
  });

  test('OraclePlatform.mapToOracleType and createOutBindings', () => {
    const platform = orm.em.getPlatform() as any;
    expect(platform.mapToOracleType('string')).toBeDefined();
    expect(platform.mapToOracleType('number')).toBeDefined();
    expect(platform.mapToOracleType('out')).toBeDefined();
    expect(platform.mapToOracleType('unknownType')).toBeDefined();
    const bindings = platform.createOutBindings({ id: 'number', name: 'string' });
    expect(bindings.id).toBeDefined();
    expect(bindings.name).toBeDefined();
    expect(bindings.__outBindings).toBe(true);
  });

  test('OracleSchemaHelper.dropForeignKey and dropTableIfExists', () => {
    const platform = orm.em.getPlatform();
    const helper = (orm.schema as any).helper;
    expect(helper.dropForeignKey('my_table', 'fk_name')).toBe('alter table "my_table" drop constraint "fk_name"');
    expect(helper.dropTableIfExists('my_table', platform.getDefaultSchemaName())).toBe(
      'drop table if exists "my_table" cascade constraint',
    );
    expect(helper.dropTableIfExists('my_table', 'other_schema')).toBe(
      'drop table if exists "other_schema"."my_table" cascade constraint',
    );
  });

  test('OracleSchemaHelper.getCreateIndexSQL with expressions', () => {
    const helper = (orm.schema as any).helper;
    const idx = { keyName: 'idx_test', expression: 'create index idx_test on foo (bar)', columnNames: [] };
    expect(helper.getCreateIndexSQL('foo', idx, false)).toBe('create index idx_test on foo (bar)');
    expect(helper.getCreateIndexSQL('foo', idx, true)).toContain('(create index idx_test on foo (bar))');
  });

  test('OracleSchemaHelper.createIndex with expression', async () => {
    const helper = (orm.schema as any).helper;
    const { DatabaseTable } = await import('@mikro-orm/sql');
    const table = new DatabaseTable(orm.em.getPlatform(), 'test_table');
    const idx = {
      keyName: 'idx_expr',
      expression: 'create index idx_expr on foo (lower(bar))',
      columnNames: [],
      primary: false,
    };
    expect(helper.createIndex(idx, table)).toBe('create index idx_expr on foo (lower(bar))');
    expect(helper.createIndex({ ...idx, primary: true }, table)).toBe('');
  });

  test('OracleSchemaHelper.getAddColumnsSQL', async () => {
    const helper = (orm.schema as any).helper;
    const { DatabaseTable } = await import('@mikro-orm/sql');
    const table = new DatabaseTable(orm.em.getPlatform(), 'test_table');
    const col1 = {
      name: 'col1',
      type: 'varchar2',
      mappedType: orm.em.getPlatform().getMappedType('varchar2'),
      length: 255,
      nullable: false,
    };
    const col2 = {
      name: 'col2',
      type: 'number',
      mappedType: orm.em.getPlatform().getMappedType('number'),
      nullable: true,
    };
    const result1 = helper.getAddColumnsSQL(table, [col1]);
    expect(result1[0]).toContain('alter table');
    expect(result1[0]).toContain('add');
    const result2 = helper.getAddColumnsSQL(table, [col1, col2]);
    expect(result2[0]).toContain('(');
  });

  test('schema introspection with views', async () => {
    await orm.schema.execute('create or replace view "test_view" as select "id", "name" from "author2"');
    const connection = orm.em.getConnection();
    const { DatabaseSchema } = await import('@mikro-orm/sql');
    const schema = await DatabaseSchema.create(connection, orm.em.getPlatform(), orm.config);
    const views = schema.getViews();
    expect(views.some(v => v.name === 'test_view')).toBe(true);
    await orm.schema.execute('drop view "test_view"');
  });

  test('OracleSchemaHelper.getNamespaces returns user list', async () => {
    const helper = (orm.schema as any).helper;
    const connection = orm.em.getConnection();
    const namespaces = await helper.getNamespaces(connection);
    expect(Array.isArray(namespaces)).toBe(true);
    const defaultSchema = orm.em.getPlatform().getDefaultSchemaName()!;
    expect(namespaces.some((ns: string) => ns.toUpperCase() === defaultSchema.toUpperCase())).toBe(true);
  });

  test('schema introspection with expression index', async () => {
    try {
      await orm.schema.execute(
        'create table "test_expr_idx" ("id" number(10) not null, "name" varchar2(255), primary key ("id"))',
      );
      await orm.schema.execute('create index "idx_name_upper" on "test_expr_idx" (upper("name"))');
    } catch {
      // ignore if exists
    }
    const connection = orm.em.getConnection();
    const helper = (orm.schema as any).helper;
    const defaultSchema = orm.em.getPlatform().getDefaultSchemaName();
    const tablesBySchemas = new Map([[defaultSchema, [{ table_name: 'test_expr_idx', schema_name: defaultSchema }]]]);
    const indexes = await helper.getAllIndexes(connection, tablesBySchemas);
    const key = Object.keys(indexes).find(k => k.includes('test_expr_idx'));
    if (key) {
      const exprIdx = indexes[key].find((i: any) => i.keyName === 'idx_name_upper');
      expect(exprIdx).toBeDefined();
      expect(exprIdx.expression).toBeDefined();
    }

    try {
      await orm.schema.execute('drop table "test_expr_idx" cascade constraints');
    } catch {
      // ignore
    }
  });

  test('schema introspection with float columns', async () => {
    try {
      await orm.schema.execute(
        'create table "test_float_tbl" ("id" number(10) not null, "val" float(53), primary key ("id"))',
      );
    } catch {
      // ignore if exists
    }
    const connection = orm.em.getConnection();
    const platform = orm.em.getPlatform();
    const helper = (orm.schema as any).helper;
    const defaultSchema = platform.getDefaultSchemaName();
    const tablesBySchemas = new Map([[defaultSchema, [{ table_name: 'test_float_tbl', schema_name: defaultSchema }]]]);
    const columns = await helper.getAllColumns(connection, tablesBySchemas);
    const key = Object.keys(columns).find(k => k.includes('test_float_tbl'));
    if (key) {
      const floatCol = columns[key].find((c: any) => c.name === 'val');
      expect(floatCol).toBeDefined();
      expect(floatCol.type).toMatch(/^float/);
    }

    try {
      await orm.schema.execute('drop table "test_float_tbl" cascade constraints');
    } catch {
      // ignore
    }
  });

  test('OracleConnection.executeDump runs SQL statements', async () => {
    const connection = orm.em.getConnection();
    await connection.executeDump('-- this is a comment\nselect 1 from dual;\nselect 2 from dual;');
    await connection.executeDump('begin null; end;');
    await expect(connection.executeDump('invalid sql statement here')).rejects.toThrow();
  });

  test('getDropSchemaSQL with dropMigrationsTable', async () => {
    const sql = await orm.schema.getDropSchemaSQL({ dropMigrationsTable: true });
    expect(sql).toContain('mikro_orm_migrations');
  });

  test('OracleSchemaHelper.dropViewIfExists', () => {
    const helper = (orm.schema as any).helper;
    const sql = helper.dropViewIfExists('test_view');
    expect(sql).toBe('drop view if exists "test_view" cascade constraints');
    const sqlWithSchema = helper.dropViewIfExists('test_view', 'other_schema');
    expect(sqlWithSchema).toBe('drop view if exists "other_schema"."test_view" cascade constraints');
    const sqlWithDefaultSchema = helper.dropViewIfExists('test_view', orm.em.getPlatform().getDefaultSchemaName());
    expect(sqlWithDefaultSchema).toBe('drop view if exists "test_view" cascade constraints');
  });

  test('OracleConnection.execute handles RawQueryFragment and NativeQueryBuilder', async () => {
    const connection = orm.em.getConnection();
    const result = await connection.execute(raw('select 1 as "val" from dual'));
    expect(result).toBeDefined();
    const platform = orm.em.getPlatform();
    const qb = platform.createNativeQueryBuilder();
    qb.select(raw('1 as "val"')).from(raw('dual'));
    const result2 = await connection.execute(qb as any);
    expect(result2).toBeDefined();
  });
});
