import { Configuration } from '../../lib/utils';
import { CLIHelper } from '../../lib/cli/CLIHelper';

const close = jest.fn();
const config = new Configuration({} as any, false);
const migrator = { getPendingMigrations: jest.fn(() => [{ file: '1' }]) };
const showHelpMock = jest.spyOn(require('yargs'), 'showHelp');
showHelpMock.mockReturnValue('');
const getORMMock = jest.spyOn(CLIHelper, 'getORM');
getORMMock.mockResolvedValue({ getMigrator: () => migrator, config, close } as any);
const dumpMock = jest.spyOn(CLIHelper, 'dump');
dumpMock.mockImplementation(() => {});
const dumpTableMock = jest.spyOn(CLIHelper, 'dumpTable');
dumpTableMock.mockImplementation(() => {});

(global as any).console.log = jest.fn();

import { MigrationCommandFactory } from '../../lib/cli/MigrationCommandFactory';

describe('PendingMigrationsCommand', () => {

  test('builder', async () => {
    const cmd = MigrationCommandFactory.create('pending');
    const args = { option: jest.fn() };
    cmd.builder(args as any);
  });

  test('handler', async () => {
    const cmd = MigrationCommandFactory.create('pending');

    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(migrator.getPendingMigrations.mock.calls.length).toBe(1);
    expect(close.mock.calls.length).toBe(1);
  });

});
