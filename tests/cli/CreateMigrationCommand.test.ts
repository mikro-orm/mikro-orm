import { Configuration } from '../../lib/utils';
import { CLIHelper } from '../../lib/cli/CLIHelper';

const close = jest.fn();
const migrator = { createMigration: jest.fn(() => ({ fileName: '1', code: '2', diff: ['3'] })) };
const config = new Configuration({} as any, false);
const showHelpMock = jest.spyOn(require('yargs'), 'showHelp');
showHelpMock.mockReturnValue('');
const getORMMock = jest.spyOn(CLIHelper, 'getORM');
getORMMock.mockResolvedValue({ getMigrator: () => migrator, config, close } as any);
const dumpMock = jest.spyOn(CLIHelper, 'dump');
dumpMock.mockImplementation(() => {});

(global as any).console.log = jest.fn();

import { MigrationCommandFactory } from '../../lib/cli/MigrationCommandFactory';

describe('CreateMigrationCommand', () => {

  test('builder', async () => {
    const cmd = MigrationCommandFactory.create('create');
    const args = { option: jest.fn() };
    cmd.builder(args as any);
  });

  test('handler', async () => {
    const cmd = MigrationCommandFactory.create('create');

    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(migrator.createMigration.mock.calls.length).toBe(1);
    expect(close.mock.calls.length).toBe(1);
    await expect(cmd.handler({ blank: true, dump: true } as any)).resolves.toBeUndefined();
    expect(migrator.createMigration.mock.calls.length).toBe(2);
    expect(close.mock.calls.length).toBe(2);
  });

});
