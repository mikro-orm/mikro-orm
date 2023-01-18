(global as any).process.env.FORCE_COLOR = 0;

import { Migrator } from '@mikro-orm/migrations';
import { MikroORM } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';
import { CLIHelper } from '@mikro-orm/cli';
import { MigrationCommandFactory } from '../../../packages/cli/src/commands/MigrationCommandFactory';
import { initORMSqlite } from '../../bootstrap';

const closeSpy = jest.spyOn(MikroORM.prototype, 'close');
jest.spyOn(CLIHelper, 'showHelp').mockImplementation(() => void 0);
const checkMigrationMock = jest.spyOn(Migrator.prototype, 'checkMigrationNeeded');
checkMigrationMock.mockResolvedValue(true);
const dumpMock = jest.spyOn(CLIHelper, 'dump');
dumpMock.mockImplementation(() => void 0);

describe('CheckMigrationCommand', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await initORMSqlite();
    const getORMMock = jest.spyOn(CLIHelper, 'getORM');
    getORMMock.mockResolvedValue(orm);
  });

  afterAll(async () => await orm.close(true));

  test('builder', async () => {
    const cmd = MigrationCommandFactory.create('check');
    const args = { option: jest.fn() };
    cmd.builder(args as any);
  });

  test('handler', async () => {
    const cmd = MigrationCommandFactory.create('check');

    const mockExit = jest.spyOn(process, 'exit').mockImplementationOnce(() => { throw new Error('Mock'); });

    await expect(cmd.handler({} as any)).rejects.toThrowError('Mock');
    expect(checkMigrationMock.mock.calls.length).toBe(1);
    expect(closeSpy).toBeCalledTimes(1);
    expect(dumpMock).toHaveBeenLastCalledWith('Changes detected. Please create migration to update schema.');
    expect(mockExit).toBeCalledTimes(1);

    checkMigrationMock.mockImplementationOnce(async () => false);
    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(checkMigrationMock.mock.calls.length).toBe(2);
    expect(closeSpy).toBeCalledTimes(2);
    expect(dumpMock).toHaveBeenLastCalledWith('No changes required, schema is up-to-date');
  });
});
