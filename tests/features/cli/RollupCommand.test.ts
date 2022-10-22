(global as any).process.env.FORCE_COLOR = 0;

import { Migrator } from '@mikro-orm/migrations';
import { MikroORM } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';
import { CLIHelper } from '@mikro-orm/cli';
import { MigrationCommandFactory } from '../../../packages/cli/src/commands/MigrationCommandFactory';
import { initORMSqlite } from '../../bootstrap';

const closeSpy = jest.spyOn(MikroORM.prototype, 'close');
jest.spyOn(CLIHelper, 'showHelp').mockImplementation(() => void 0);
const up = jest.spyOn(Migrator.prototype, 'up');
up.mockResolvedValue([]);
const down = jest.spyOn(Migrator.prototype, 'down');
down.mockResolvedValue([]);
const createMigrationMock = jest.spyOn(Migrator.prototype, 'createMigration');
createMigrationMock.mockResolvedValue({ fileName: '1', code: '2', diff: { up: ['3'], down: [] } });
const dumpMock = jest.spyOn(CLIHelper, 'dump');
dumpMock.mockImplementation(() => void 0);
jest.spyOn(CLIHelper, 'dumpTable').mockImplementation(() => void 0);

describe('RollupCommand', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await initORMSqlite();
    const getORMMock = jest.spyOn(CLIHelper, 'getORM');
    getORMMock.mockResolvedValue(orm);
  });

  afterAll(async () => await orm.close(true));

  test('builder', async () => {
    const cmd = MigrationCommandFactory.create('rollup');
    const args = { option: jest.fn() };
    cmd.builder(args as any);
  });

  test('builder', async () => {
    const cmd = MigrationCommandFactory.create('rollup');
    const args = { option: jest.fn() };
    cmd.builder(args as any);
  });

  test('handler', async () => {
    const cmd = MigrationCommandFactory.create('rollup');

    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(down.mock.calls.length).toBe(1);
    expect(down.mock.calls[0][0]).toEqual({});
    expect(closeSpy).toBeCalledTimes(1);
    await expect(cmd.handler({ to: 'a' } as any)).resolves.toBeUndefined();
    expect(down.mock.calls.length).toBe(2);
    expect(down.mock.calls[1][0]).toEqual({ to: 'a' });
    expect(closeSpy).toBeCalledTimes(2);
  });

});
