(global as any).process.env.FORCE_COLOR = 0;

import { Migrator } from '@mikro-orm/migrations';
import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { CLIHelper } from '@mikro-orm/cli';
import { MigrationCommandFactory } from '../../../packages/cli/src/commands/MigrationCommandFactory.js';
import { initORMSqlite } from '../../bootstrap.js';

const closeSpy = vi.spyOn(MikroORM.prototype, 'close');
vi.spyOn(CLIHelper, 'showHelp').mockImplementation(() => void 0);
const getExecutedMigrations = vi.spyOn(Migrator.prototype, 'getExecutedMigrations');
getExecutedMigrations.mockResolvedValue([{ id: 1, name: '1', executed_at: new Date() }]);
const dumpMock = vi.spyOn(CLIHelper, 'dump');
dumpMock.mockImplementation(() => void 0);
vi.spyOn(CLIHelper, 'dumpTable').mockImplementation(() => void 0);

describe('ListMigrationsCommand', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await initORMSqlite();
    const getORMMock = vi.spyOn(CLIHelper, 'getORM');
    getORMMock.mockResolvedValue(orm);
  });

  afterAll(async () => await orm.close(true));

  test('builder', async () => {
    const cmd = MigrationCommandFactory.create('list');
    const args = { option: vi.fn() };
    cmd.builder(args as any);
  });

  test('handler', async () => {
    const cmd = MigrationCommandFactory.create('list');

    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(getExecutedMigrations.mock.calls.length).toBe(1);
    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

});
