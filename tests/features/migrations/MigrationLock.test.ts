import { writeFile } from 'node:fs/promises';
import { MsSqlPlatform } from '@mikro-orm/mssql';
import { MySqlPlatform } from '@mikro-orm/mysql';
import { PostgreSqlPlatform } from '@mikro-orm/postgresql';
import { SqlitePlatform } from '@mikro-orm/sqlite';
import { withMigrationFileLock } from '../../../packages/sql/src/dialects/sqlite/migrationFileLock.js';
import { TEMP_DIR } from '../../helpers.js';

describe('migration lock SQL', () => {
  test('postgresql advisory lock is a stable session lock and releases the same key', () => {
    const helper = new PostgreSqlPlatform().getSchemaHelper()!;
    const acquire = helper.getAcquireMigrationLockSQL('public.mikro_orm_migrations');
    const release = helper.getReleaseMigrationLockSQL('public.mikro_orm_migrations');

    expect(acquire).toBe(helper.getAcquireMigrationLockSQL('public.mikro_orm_migrations'));
    expect(acquire).toMatch(/^select pg_advisory_lock\(-?\d+, -?\d+\)$/);
    expect(release).toBe(acquire.replace('pg_advisory_lock', 'pg_advisory_unlock'));
    expect(helper.getAcquireMigrationLockSQL('other.mikro_orm_migrations')).not.toBe(acquire);
    expect(helper.getMigrationLockTimeoutSettings()).toEqual(['lock_timeout', 'statement_timeout']);
    expect(helper.migrationLockReportsStatus()).toBe(false);
  });

  test('mysql and mariadb wait with GET_LOCK instead of a negative timeout', () => {
    const helper = new MySqlPlatform().getSchemaHelper()!;
    const acquire = helper.getAcquireMigrationLockSQL('mikro_orm_migrations');

    expect(acquire).toMatch(/^select get_lock\('mikro-orm:[0-9a-f]{16}', 16777215\)$/);
    expect(helper.getReleaseMigrationLockSQL('mikro_orm_migrations')).toBe(
      acquire.replace('get_lock', 'release_lock').replace(', 16777215', ''),
    );
    expect(helper.migrationLockReportsStatus()).toBe(true);
    expect(helper.getMigrationLockTimeoutSettings()).toEqual([]);
  });

  test('sql server takes a session application lock', () => {
    const helper = new MsSqlPlatform().getSchemaHelper()!;
    const acquire = helper.getAcquireMigrationLockSQL('dbo.mikro_orm_migrations');

    expect(acquire).toContain('sp_getapplock');
    expect(acquire).toContain("@LockOwner = 'Session'");
    expect(acquire).toContain('@LockTimeout = -1');
    expect(acquire).toMatch(/@Resource = N'mikro-orm:[0-9a-f]{16}'/);
    expect(helper.getReleaseMigrationLockSQL('dbo.mikro_orm_migrations')).toContain('sp_releaseapplock');
    expect(helper.migrationLockReportsStatus()).toBe(false);
  });

  test('sqlite has no session lock statement', () => {
    const helper = new SqlitePlatform().getSchemaHelper()!;

    expect(helper.getAcquireMigrationLockSQL('mikro_orm_migrations')).toBe('');
    expect(helper.getReleaseMigrationLockSQL('mikro_orm_migrations')).toBe('');
  });
});

describe('sqlite migration file lock', () => {
  const lockPath = `${TEMP_DIR}/migration-file-lock.lock`;

  test('serialises overlapping critical sections', async () => {
    let inside = 0;
    let maxInside = 0;

    await Promise.all(
      [0, 1, 2].map(() =>
        withMigrationFileLock(lockPath, async () => {
          inside++;
          maxInside = Math.max(maxInside, inside);
          await new Promise(resolve => setTimeout(resolve, 20));
          inside--;
        }),
      ),
    );

    expect(maxInside).toBe(1);
    expect(inside).toBe(0);
  });

  test('takes over a lock whose owner process is gone', async () => {
    await writeFile(lockPath, '999999');
    let ran = false;

    await withMigrationFileLock(lockPath, async () => {
      ran = true;
    });

    expect(ran).toBe(true);
  });
});
