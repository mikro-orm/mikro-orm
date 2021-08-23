(global as any).process.env.FORCE_COLOR = 0;

import { Migrator } from '@mikro-orm/migrations';
import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { CLIHelper } from '@mikro-orm/cli';
import { MigrationCommandFactory } from '../../../packages/cli/src/commands/MigrationCommandFactory';
import { initORMSqlite } from '../../bootstrap';

const close = jest.fn();
jest.spyOn(MikroORM.prototype, 'close').mockImplementation(close);
jest.spyOn(require('yargs'), 'showHelp').mockReturnValue('');
const createMigrationMock = jest.spyOn(Migrator.prototype, 'createMigration');
createMigrationMock.mockResolvedValue({ fileName: '1', code: '2', diff: { up: ['3'], down: [] } });
const dumpMock = jest.spyOn(CLIHelper, 'dump');
dumpMock.mockImplementation(() => void 0);

describe('CreateMigrationCommand', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await initORMSqlite();
    const getORMMock = jest.spyOn(CLIHelper, 'getORM');
    getORMMock.mockResolvedValue(orm);
  });

  afterAll(async () => await orm.close(true));

  test('builder', async () => {
    const cmd = MigrationCommandFactory.create('create');
    const args = { option: jest.fn() };
    cmd.builder(args as any);
  });

  test('handler', async () => {
    const cmd = MigrationCommandFactory.create('create');

    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(createMigrationMock.mock.calls.length).toBe(1);
    expect(close.mock.calls.length).toBe(1);

    await expect(cmd.handler({ blank: true, dump: true } as any)).resolves.toBeUndefined();
    expect(createMigrationMock.mock.calls.length).toBe(2);
    expect(close.mock.calls.length).toBe(2);
    expect(dumpMock).toHaveBeenLastCalledWith('1 successfully created');

    createMigrationMock.mockImplementationOnce(async () => ({ fileName: '', code: '', diff: { up: [], down: [] } }));
    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(createMigrationMock.mock.calls.length).toBe(3);
    expect(close.mock.calls.length).toBe(3);
    expect(dumpMock).toHaveBeenLastCalledWith('No changes required, schema is up-to-date');
  });

});
