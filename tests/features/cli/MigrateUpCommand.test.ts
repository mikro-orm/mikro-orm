(global as any).process.env.FORCE_COLOR = 0;

import { Migrator } from '@mikro-orm/migrations';
import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { CLIHelper } from '@mikro-orm/cli';
import { MigrationCommandFactory } from '../../../packages/cli/src/commands/MigrationCommandFactory';
import { initORMSqlite } from '../../bootstrap';

const closeSpy = jest.spyOn(MikroORM.prototype, 'close');
jest.spyOn(CLIHelper, 'showHelp').mockImplementation(() => void 0);
const up = jest.spyOn(Migrator.prototype, 'up');
up.mockResolvedValue([]);
const dumpMock = jest.spyOn(CLIHelper, 'dump');
dumpMock.mockImplementation(() => void 0);
jest.spyOn(CLIHelper, 'dumpTable').mockImplementation(() => void 0);

describe('MigrateUpCommand', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await initORMSqlite();
    const getORMMock = jest.spyOn(CLIHelper, 'getORM');
    getORMMock.mockResolvedValue(orm);
  });

  afterAll(async () => await orm.close(true));

  test('builder', async () => {
    const cmd = MigrationCommandFactory.create('up');
    const args = { option: jest.fn() };
    cmd.builder(args as any);
  });

  test('builder', async () => {
    const cmd = MigrationCommandFactory.create('up');
    const args = { option: jest.fn() };
    cmd.builder(args as any);
  });

  test('handler', async () => {
    const cmd = MigrationCommandFactory.create('up');

    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(up.mock.calls.length).toBe(1);
    expect(up.mock.calls[0][0]).toEqual({});
    expect(closeSpy).toBeCalledTimes(1);
    await expect(cmd.handler({ only: '1,2' } as any)).resolves.toBeUndefined();
    expect(up.mock.calls.length).toBe(2);
    expect(up.mock.calls[1][0]).toEqual({ migrations: ['1', '2'] });
    expect(closeSpy).toBeCalledTimes(2);
    await expect(cmd.handler({ from: '1', to: '2' } as any)).resolves.toBeUndefined();
    expect(up.mock.calls.length).toBe(3);
    expect(up.mock.calls[2][0]).toEqual({ from: '1', to: '2' });
    expect(closeSpy).toBeCalledTimes(3);
    await expect(cmd.handler({ from: '0', to: '0' } as any)).resolves.toBeUndefined();
    expect(up.mock.calls.length).toBe(4);
    expect(up.mock.calls[3][0]).toEqual({ from: 0, to: 0 });
    expect(closeSpy).toBeCalledTimes(4);
    await expect(cmd.handler({ to: 'a' } as any)).resolves.toBeUndefined();
    expect(up.mock.calls.length).toBe(5);
    expect(up.mock.calls[4][0]).toEqual({ to: 'a' });
    expect(closeSpy).toBeCalledTimes(5);
    await expect(cmd.handler({ only: 'a' } as any)).resolves.toBeUndefined();
    expect(up.mock.calls.length).toBe(6);
    expect(up.mock.calls[5][0]).toEqual({ migrations: ['a'] });
    expect(closeSpy).toBeCalledTimes(6);
  });

});
