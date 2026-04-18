process.env.FORCE_COLOR = '0';

import { Migrator } from '@mikro-orm/migrations';
import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { CLIHelper } from '@mikro-orm/cli';
import { MigrationCommandFactory } from '../../../packages/cli/src/commands/MigrationCommandFactory.js';
import { initORMSqlite } from '../../bootstrap.js';

describe('RollupMigrationCommand', () => {
  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await initORMSqlite();
    const getORMMock = vi.spyOn(CLIHelper, 'getORM');
    getORMMock.mockResolvedValue(orm);
  });

  afterAll(async () => orm.close(true));

  test('builder', async () => {
    const cmd = MigrationCommandFactory.create('rollup');
    const args = { option: vi.fn() };
    cmd.builder(args as any);
  });

  test('handler', async () => {
    const closeSpy = vi.spyOn(MikroORM.prototype, 'close');
    vi.spyOn(CLIHelper, 'showHelp').mockImplementation(() => void 0);
    const rollupMock = vi.spyOn(Migrator.prototype, 'rollup');
    rollupMock.mockResolvedValue({ fileName: 'Migration20250401000000.ts', code: '...', diff: { up: [], down: [] } });
    const dumpMock = vi.spyOn(CLIHelper, 'dump');
    dumpMock.mockImplementation(() => void 0);

    const cmd = MigrationCommandFactory.create('rollup');

    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(rollupMock).toHaveBeenCalledTimes(1);
    expect(closeSpy).toHaveBeenCalledTimes(1);
    expect(dumpMock).toHaveBeenLastCalledWith('Migration20250401000000.ts successfully created (rollup)');
  });
});
