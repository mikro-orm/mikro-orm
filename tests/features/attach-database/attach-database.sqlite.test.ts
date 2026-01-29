import 'reflect-metadata';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  Collection,
  MikroORM,
  Ref,
  SimpleLogger,
} from '@mikro-orm/core';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { LibSqlDriver } from '@mikro-orm/libsql';

// Test entities for the main database
@Entity({ schema: 'main' })
class MainAuthor {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => MainBook, book => book.author)
  books = new Collection<MainBook>(this);

}

@Entity({ schema: 'main' })
class MainBook {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => MainAuthor, { ref: true })
  author!: Ref<MainAuthor>;

}

// Test entities for the attached 'users_db' database
@Entity({ schema: 'users_db' })
class UserProfile {

  @PrimaryKey()
  id!: number;

  @Property()
  username!: string;

  @Property()
  email!: string;

}

// Test entities for the attached 'logs_db' database
@Entity({ schema: 'logs_db' })
class LogEntry {

  @PrimaryKey()
  id!: number;

  @Property()
  level!: string;

  @Property()
  message!: string;

  @Property()
  createdAt: Date = new Date();

}

describe.each(['sqlite', 'libsql'] as const)('ATTACH DATABASE (%s)', driver => {
  const tempDir = join(tmpdir(), `mikro-orm-attach-test-${Date.now()}`);
  let orm: MikroORM<SqliteDriver | LibSqlDriver>;

  beforeAll(async () => {
    // Create temp directory for database files
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    const mainDbPath = join(tempDir, 'main.db');
    const usersDbPath = join(tempDir, 'users.db');
    const logsDbPath = join(tempDir, 'logs.db');

    orm = await MikroORM.init({
      entities: [MainAuthor, MainBook, UserProfile, LogEntry],
      dbName: mainDbPath,
      driver: driver === 'sqlite' ? SqliteDriver : LibSqlDriver as any,
      metadataProvider: ReflectMetadataProvider,
      debug: ['query'],
      logger: i => i,
      loggerFactory: SimpleLogger.create,
      attachDatabases: [
        { name: 'users_db', path: usersDbPath },
        { name: 'logs_db', path: logsDbPath },
      ],
    });

    // Create tables in all databases
    await orm.schema.create();
  });

  afterAll(async () => {
    await orm?.close(true);
    // Clean up temp directory - ignore errors on Windows where files may still be locked
    try {
      rmSync(tempDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    } catch {
      // noop
    }
  });

  test('should attach databases on connection', async () => {
    // Verify all databases are attached
    const connection = orm.em.getConnection();
    const databases = await connection.execute<{ name: string; file: string }[]>('pragma database_list');
    const dbNames = databases.map(d => d.name);

    expect(dbNames).toContain('main');
    expect(dbNames).toContain('users_db');
    expect(dbNames).toContain('logs_db');
  });

  test('should create tables in correct databases', async () => {
    const connection = orm.em.getConnection();

    // Check tables in main database
    const mainTables = await connection.execute<{ name: string }[]>(
      `select name from main.sqlite_master where type = 'table' and name not like 'sqlite_%'`,
    );
    const mainTableNames = mainTables.map(t => t.name);
    expect(mainTableNames).toContain('main_author');
    expect(mainTableNames).toContain('main_book');

    // Check tables in users_db database
    const usersTables = await connection.execute<{ name: string }[]>(
      `select name from users_db.sqlite_master where type = 'table' and name not like 'sqlite_%'`,
    );
    const usersTableNames = usersTables.map(t => t.name);
    expect(usersTableNames).toContain('user_profile');

    // Check tables in logs_db database
    const logsTables = await connection.execute<{ name: string }[]>(
      `select name from logs_db.sqlite_master where type = 'table' and name not like 'sqlite_%'`,
    );
    const logsTableNames = logsTables.map(t => t.name);
    expect(logsTableNames).toContain('log_entry');
  });

  test('should perform CRUD operations on main database entities', async () => {
    const author = new MainAuthor();
    author.name = 'Test Author';
    orm.em.persist(author);
    await orm.em.flush();
    orm.em.clear();

    const loadedAuthor = await orm.em.findOneOrFail(MainAuthor, { name: 'Test Author' });
    expect(loadedAuthor.name).toBe('Test Author');

    loadedAuthor.name = 'Updated Author';
    await orm.em.flush();
    orm.em.clear();

    const updatedAuthor = await orm.em.findOneOrFail(MainAuthor, loadedAuthor.id);
    expect(updatedAuthor.name).toBe('Updated Author');

    orm.em.remove(updatedAuthor);
    await orm.em.flush();

    const count = await orm.em.count(MainAuthor);
    expect(count).toBe(0);
  });

  test('should perform CRUD operations on attached database entities', async () => {
    // Test UserProfile in users_db
    const profile = new UserProfile();
    profile.username = 'testuser';
    profile.email = 'test@example.com';
    orm.em.persist(profile);
    await orm.em.flush();
    orm.em.clear();

    const loadedProfile = await orm.em.findOneOrFail(UserProfile, { username: 'testuser' });
    expect(loadedProfile.email).toBe('test@example.com');

    // Test LogEntry in logs_db
    const log = new LogEntry();
    log.level = 'info';
    log.message = 'Test log message';
    orm.em.persist(log);
    await orm.em.flush();
    orm.em.clear();

    const loadedLog = await orm.em.findOneOrFail(LogEntry, { level: 'info' });
    expect(loadedLog.message).toBe('Test log message');

    // Cleanup
    orm.em.remove(loadedProfile);
    orm.em.remove(loadedLog);
    await orm.em.flush();
  });

  test('should detect all tables across attached databases via schema generator', async () => {
    const schemaHelper = orm.em.getDriver().getPlatform().getSchemaHelper()!;
    const connection = orm.em.getConnection();

    // Get tables from all databases
    const tables = await schemaHelper.getAllTables(connection);
    const tableNames = tables.map(t => `${t.schema_name}.${t.table_name}`);

    expect(tableNames).toContain('main.main_author');
    expect(tableNames).toContain('main.main_book');
    expect(tableNames).toContain('users_db.user_profile');
    expect(tableNames).toContain('logs_db.log_entry');
  });

  test('should get namespaces (attached databases)', async () => {
    const schemaHelper = orm.em.getDriver().getPlatform().getSchemaHelper()!;
    const connection = orm.em.getConnection();

    const namespaces = await schemaHelper.getNamespaces(connection);
    expect(namespaces).toContain('main');
    expect(namespaces).toContain('users_db');
    expect(namespaces).toContain('logs_db');
  });

  test('should load views from attached databases', async () => {
    const connection = orm.em.getConnection();

    // Create a view in the users_db
    await connection.execute(`create view users_db.active_users as select * from users_db.user_profile`);

    const schemaHelper = orm.em.getDriver().getPlatform().getSchemaHelper()!;
    const { DatabaseSchema } = await import('@mikro-orm/sql');

    const schema = new DatabaseSchema(orm.em.getDriver().getPlatform(), 'main');
    await schemaHelper.loadViews(schema, connection);

    const views = schema.getViews();
    const viewNames = views.map(v => `${v.schema}.${v.name}`);
    expect(viewNames).toContain('users_db.active_users');

    // Cleanup
    await connection.execute('drop view users_db.active_users');
  });

  test('platform should report schema support', () => {
    const platform = orm.em.getDriver().getPlatform();
    expect(platform.supportsSchemas()).toBe(true);
    expect(platform.getDefaultSchemaName()).toBe('main');
  });

  test('schema.update() should work with attached databases', async () => {
    const connection = orm.em.getConnection();

    // Add a column via raw SQL to an attached database table
    await connection.execute('alter table users_db.user_profile add column bio text');

    // schema.update should detect the difference
    const updateSQL = await orm.schema.getUpdateSchemaSQL({ wrap: false, safe: false });
    // Should want to drop the extra 'bio' column
    expect(updateSQL).toContain('drop column');
    expect(updateSQL).toContain('bio');

    // Clean up - recreate the table without the extra column
    await connection.execute('drop table users_db.user_profile');
    await connection.execute('create table users_db.user_profile (id integer not null primary key autoincrement, username text not null, email text not null)');
  });

  test('schema.getCreateSchemaSQL() should not include CREATE SCHEMA statements', async () => {
    const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });
    // Should not contain CREATE SCHEMA since SQLite uses ATTACH DATABASE
    expect(sql).not.toContain('create schema');
    // But should contain table creation for attached databases
    expect(sql).toContain('users_db');
    expect(sql).toContain('logs_db');
  });

  test('schema.getUpdateSchemaSQL() should handle tables across multiple databases', async () => {
    const updateSQL = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    // Should not contain CREATE SCHEMA since SQLite uses ATTACH DATABASE
    expect(updateSQL).not.toContain('create schema');
  });

  test('should use dynamic schema from FindOptions', async () => {
    // Create a user in the users_db
    const profile = new UserProfile();
    profile.username = 'dynamictest';
    profile.email = 'dynamic@test.com';
    orm.em.persist(profile);
    await orm.em.flush();
    const profileId = profile.id;
    orm.em.clear();

    // Find using explicit schema in FindOptions (should work the same)
    const found = await orm.em.findOne(UserProfile, { id: profileId }, { schema: 'users_db' });
    expect(found).not.toBeNull();
    expect(found!.username).toBe('dynamictest');

    // Cleanup
    orm.em.remove(found!);
    await orm.em.flush();
  });

  test('should use schema from forked EntityManager', async () => {
    // Create a user in users_db
    const profile = new UserProfile();
    profile.username = 'forktest';
    profile.email = 'fork@test.com';
    orm.em.persist(profile);
    await orm.em.flush();
    const profileId = profile.id;
    orm.em.clear();

    // Fork EM with specific schema
    const fork = orm.em.fork({ schema: 'users_db' });

    // Find using forked EM - schema should be used
    const found = await fork.findOne(UserProfile, { id: profileId });
    expect(found).not.toBeNull();
    expect(found!.username).toBe('forktest');

    // Cleanup
    fork.remove(found!);
    await fork.flush();
  });

  test('should support QueryBuilder with schema', async () => {
    // Create test data
    const profile = new UserProfile();
    profile.username = 'qbtest';
    profile.email = 'qb@test.com';
    orm.em.persist(profile);
    await orm.em.flush();
    orm.em.clear();

    // Query using QueryBuilder
    const qb = orm.em.createQueryBuilder(UserProfile);
    const result = await qb.where({ username: 'qbtest' }).getSingleResult();
    expect(result).not.toBeNull();
    expect(result!.email).toBe('qb@test.com');

    // Cleanup
    orm.em.remove(result!);
    await orm.em.flush();
  });

});

@Entity({ schema: 'attached_db' })
class RelPathTestEntity {

  @PrimaryKey()
  id!: number;

  @Property()
  value!: string;

}

@Entity()
class RemoteTestEntity {

  @PrimaryKey()
  id!: number;

}

describe('ATTACH DATABASE - relative path resolution', () => {
  const tempDir = join(tmpdir(), `mikro-orm-attach-relpath-${Date.now()}`);
  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }
  });

  afterAll(async () => {
    await orm?.close(true);
    // Clean up temp directory - ignore errors on Windows where files may still be locked
    try {
      rmSync(tempDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    } catch {
      // noop
    }
  });

  test('should resolve relative paths from baseDir', async () => {
    const mainDbPath = join(tempDir, 'main.db');

    orm = await MikroORM.init({
      entities: [RelPathTestEntity],
      dbName: mainDbPath,
      baseDir: tempDir,
      driver: SqliteDriver,
      metadataProvider: ReflectMetadataProvider,
      logger: i => i,
      loggerFactory: SimpleLogger.create,
      attachDatabases: [
        // Relative path - should resolve from tempDir
        { name: 'attached_db', path: './attached.db' },
      ],
    });

    await orm.schema.create();

    // Verify the attached database was created in the baseDir
    expect(existsSync(join(tempDir, 'attached.db'))).toBe(true);

    // Verify we can use the attached database
    const connection = orm.em.getConnection();
    const databases = await connection.execute<{ name: string }[]>('pragma database_list');
    const dbNames = databases.map(d => d.name);
    expect(dbNames).toContain('attached_db');
  });
});

describe('ATTACH DATABASE - libSQL remote validation', () => {
  test('should throw error when trying to attach databases to remote libSQL', async () => {
    const orm = await MikroORM.init({
      entities: [RemoteTestEntity],
      dbName: 'libsql://example.turso.io',
      driver: LibSqlDriver,
      metadataProvider: ReflectMetadataProvider,
      logger: i => i,
      attachDatabases: [
        { name: 'attached_db', path: './attached.db' },
      ],
    });
    // Connection happens lazily - calling connect() should trigger the error
    await expect(orm.connect()).rejects.toThrow('ATTACH DATABASE is not supported for remote libSQL connections');
    await orm.close(true);
  });

  test('should throw error for https remote libSQL', async () => {
    const orm = await MikroORM.init({
      entities: [RemoteTestEntity],
      dbName: 'https://example.turso.io',
      driver: LibSqlDriver,
      metadataProvider: ReflectMetadataProvider,
      logger: i => i,
      attachDatabases: [
        { name: 'attached_db', path: './attached.db' },
      ],
    });
    // Connection happens lazily - calling connect() should trigger the error
    await expect(orm.connect()).rejects.toThrow('ATTACH DATABASE is not supported for remote libSQL connections');
    await orm.close(true);
  });
});
