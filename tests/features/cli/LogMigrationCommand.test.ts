process.env.FORCE_COLOR = '0';

import { MigrationStorage } from '@mikro-orm/migrations';
import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { CLIHelper } from '@mikro-orm/cli';
import { MigrationCommandFactory } from '../../../packages/cli/src/commands/MigrationCommandFactory.js';
import { initORMSqlite } from '../../bootstrap.js';

describe('LogMigrationCommand', () => {
  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await initORMSqlite();
    const getORMMock = vi.spyOn(CLIHelper, 'getORM');
    getORMMock.mockResolvedValue(orm);
  });

  afterAll(async () => orm.close(true));

  test('builder', async () => {
    const cmd = MigrationCommandFactory.create('log');
    const args = { option: vi.fn() };
    cmd.builder(args as any);
  });

  test('handler', async () => {
    const closeSpy = vi.spyOn(MikroORM.prototype, 'close');
    vi.spyOn(CLIHelper, 'showHelp').mockImplementation(() => void 0);
    const logMigration = vi.spyOn(MigrationStorage.prototype, 'logMigration');
    logMigration.mockResolvedValue(void 0);
    const ensureTable = vi.spyOn(MigrationStorage.prototype, 'ensureTable');
    ensureTable.mockResolvedValue(void 0);
    const dumpMock = vi.spyOn(CLIHelper, 'dump');
    dumpMock.mockImplementation(() => void 0);

    const cmd = MigrationCommandFactory.create('log');

    await expect(cmd.handler({ name: 'Migration20240101' } as any)).resolves.toBeUndefined();
    expect(ensureTable).toHaveBeenCalled();
    expect(logMigration).toHaveBeenCalledWith({ name: 'Migration20240101' });
    expect(dumpMock).toHaveBeenCalledWith(expect.stringContaining('logged'));
    expect(closeSpy).toHaveBeenCalledTimes(1);
  });
});
