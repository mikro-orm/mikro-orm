(global as any).process.env.FORCE_COLOR = 0;

import { Migrator } from '@mikro-orm/migrations';
import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { CLIHelper } from '@mikro-orm/cli';
import { MigrationCommandFactory } from '../../../packages/cli/src/commands/MigrationCommandFactory.js';
import { initORMSqlite } from '../../bootstrap.js';

const closeSpy = vi.spyOn(MikroORM.prototype, 'close');
vi.spyOn(CLIHelper, 'showHelp').mockImplementation(() => void 0);
const getPendingMigrations = vi.spyOn(Migrator.prototype, 'getPendingMigrations');
getPendingMigrations.mockResolvedValue([{ name: '1' }]);
const dumpMock = vi.spyOn(CLIHelper, 'dump');
dumpMock.mockImplementation(() => void 0);
vi.spyOn(CLIHelper, 'dumpTable').mockImplementation(() => void 0);

describe('PendingMigrationsCommand', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await initORMSqlite();
    const getORMMock = vi.spyOn(CLIHelper, 'getORM');
    getORMMock.mockResolvedValue(orm);
  });

  afterAll(async () => await orm.close(true));

  test('builder', async () => {
    const cmd = MigrationCommandFactory.create('pending');
    const args = { option: vi.fn() };
    cmd.builder(args as any);
  });

  test('handler', async () => {
    const cmd = MigrationCommandFactory.create('pending');

    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(getPendingMigrations.mock.calls.length).toBe(1);
    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

});
