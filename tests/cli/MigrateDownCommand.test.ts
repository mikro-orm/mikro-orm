import { Configuration } from '../../lib/utils';
import { CLIHelper } from '../../lib/cli/CLIHelper';

const close = jest.fn();
const migrator = { down: jest.fn((...args) => []) };
const config = new Configuration({} as any, false);
const showHelpMock = jest.spyOn(require('yargs'), 'showHelp');
showHelpMock.mockReturnValue('');
const getORMMock = jest.spyOn(CLIHelper, 'getORM');
getORMMock.mockResolvedValue({ getMigrator: () => migrator, config, close } as any);
const dumpMock = jest.spyOn(CLIHelper, 'dump');
dumpMock.mockImplementation(() => {});

(global as any).console.log = jest.fn();

import { MigrationCommandFactory } from '../../lib/cli/MigrationCommandFactory';

describe('MigrateDownCommand', () => {

  test('builder', async () => {
    const cmd = MigrationCommandFactory.create('down');
    const args = { option: jest.fn() };
    cmd.builder(args as any);
  });

  test('handler', async () => {
    const cmd = MigrationCommandFactory.create('down');

    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(migrator.down.mock.calls.length).toBe(1);
    expect(close.mock.calls.length).toBe(1);
    await expect(cmd.handler({ only: '1,2' } as any)).resolves.toBeUndefined();
    expect(migrator.down.mock.calls.length).toBe(2);
    expect(close.mock.calls.length).toBe(2);
    await expect(cmd.handler({ from: '1', to: '2' } as any)).resolves.toBeUndefined();
    expect(migrator.down.mock.calls.length).toBe(3);
    expect(close.mock.calls.length).toBe(3);
    await expect(cmd.handler({ from: '0', to: '0' } as any)).resolves.toBeUndefined();
    expect(migrator.down.mock.calls.length).toBe(4);
    expect(close.mock.calls.length).toBe(4);
    await expect(cmd.handler('test' as any)).resolves.toBeUndefined();
    expect(migrator.down.mock.calls.length).toBe(5);
    expect(close.mock.calls.length).toBe(5);
  });

});
