(global as any).process.env.FORCE_COLOR = 0;

import { Migrator } from '@mikro-orm/migrations';
import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { CLIHelper } from '@mikro-orm/cli';
import { MigrationCommandFactory } from '../../../packages/cli/src/commands/MigrationCommandFactory';
import { initORMSqlite } from '../../bootstrap';

const closeSpy = jest.spyOn(MikroORM.prototype, 'close');
jest.spyOn(CLIHelper, 'showHelp').mockImplementation(() => void 0);
const down = jest.spyOn(Migrator.prototype, 'down');
down.mockResolvedValue([]);
const dumpMock = jest.spyOn(CLIHelper, 'dump');
dumpMock.mockImplementation(() => void 0);
jest.spyOn(CLIHelper, 'dumpTable').mockImplementation(() => void 0);

describe('MigrateDownCommand', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await initORMSqlite();
    const getORMMock = jest.spyOn(CLIHelper, 'getORM');
    getORMMock.mockResolvedValue(orm);
  });

  afterAll(async () => await orm.close(true));

  test('builder', async () => {
    const cmd = MigrationCommandFactory.create('down');
    const args = { option: jest.fn() };
    cmd.builder(args as any);
  });

  test('handler', async () => {
    const cmd = MigrationCommandFactory.create('down');

    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(down.mock.calls.length).toBe(1);
    expect(closeSpy).toBeCalledTimes(1);
    await expect(cmd.handler({ only: '1,2' } as any)).resolves.toBeUndefined();
    expect(down.mock.calls.length).toBe(2);
    expect(closeSpy).toBeCalledTimes(2);
    await expect(cmd.handler({ from: '1', to: '2' } as any)).resolves.toBeUndefined();
    expect(down.mock.calls.length).toBe(3);
    expect(closeSpy).toBeCalledTimes(3);
    await expect(cmd.handler({ from: '0', to: '0' } as any)).resolves.toBeUndefined();
    expect(down.mock.calls.length).toBe(4);
    expect(closeSpy).toBeCalledTimes(4);
    await expect(cmd.handler('test' as any)).resolves.toBeUndefined();
    expect(down.mock.calls.length).toBe(5);
    expect(closeSpy).toBeCalledTimes(5);
  });

});
