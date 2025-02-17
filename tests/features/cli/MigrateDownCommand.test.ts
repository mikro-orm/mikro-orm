(global as any).process.env.FORCE_COLOR = 0;

import { Migrator } from '@mikro-orm/migrations';
import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { CLIHelper } from '@mikro-orm/cli';
import { MigrationCommandFactory } from '../../../packages/cli/src/commands/MigrationCommandFactory.js';
import { initORMSqlite } from '../../bootstrap.js';

describe('MigrateDownCommand', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await initORMSqlite();
    const getORMMock = vi.spyOn(CLIHelper, 'getORM');
    getORMMock.mockResolvedValue(orm);
  });

  afterAll(async () => await orm.close(true));

  test('builder', async () => {
    const cmd = MigrationCommandFactory.create('down');
    const args = { option: vi.fn() };
    cmd.builder(args as any);
  });

  test('handler', async () => {
    const closeSpy = vi.spyOn(MikroORM.prototype, 'close');
    vi.spyOn(CLIHelper, 'showHelp').mockImplementation(() => void 0);
    const down = vi.spyOn(Migrator.prototype, 'down');
    down.mockResolvedValue([]);
    const dumpMock = vi.spyOn(CLIHelper, 'dump');
    dumpMock.mockImplementation(() => void 0);
    vi.spyOn(CLIHelper, 'dumpTable').mockImplementation(() => void 0);

    const cmd = MigrationCommandFactory.create('down');

    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(down.mock.calls.length).toBe(1);
    expect(closeSpy).toHaveBeenCalledTimes(1);
    await expect(cmd.handler({ only: '1,2' } as any)).resolves.toBeUndefined();
    expect(down.mock.calls.length).toBe(2);
    expect(closeSpy).toHaveBeenCalledTimes(2);
    await expect(cmd.handler({ from: '1', to: '2' } as any)).resolves.toBeUndefined();
    expect(down.mock.calls.length).toBe(3);
    expect(closeSpy).toHaveBeenCalledTimes(3);
    await expect(cmd.handler({ from: '0', to: '0' } as any)).resolves.toBeUndefined();
    expect(down.mock.calls.length).toBe(4);
    expect(closeSpy).toHaveBeenCalledTimes(4);
    await expect(cmd.handler('test' as any)).resolves.toBeUndefined();
    expect(down.mock.calls.length).toBe(5);
    expect(closeSpy).toHaveBeenCalledTimes(5);
  });

});
