import { Configuration } from '../../lib/utils';
import { CLIHelper } from '../../lib/cli/CLIHelper';

const close = jest.fn();
const migrator = { up: jest.fn((...args) => []) };
const config = new Configuration({} as any, false);
const showHelpMock = jest.spyOn(require('yargs'), 'showHelp');
showHelpMock.mockReturnValue('');
const getORMMock = jest.spyOn(CLIHelper, 'getORM');
getORMMock.mockResolvedValue({ getMigrator: () => migrator, config, close } as any);
const dumpMock = jest.spyOn(CLIHelper, 'dump');
dumpMock.mockImplementation(() => {});

(global as any).console.log = jest.fn();

import { MigrationCommandFactory } from '../../lib/cli/MigrationCommandFactory';

describe('MigrateUpCommand', () => {

  test('builder', async () => {
    const cmd = MigrationCommandFactory.create('up');
    const args = { option: jest.fn() };
    cmd.builder(args as any);
  });

  test('handler', async () => {
    const cmd = MigrationCommandFactory.create('up');

    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(migrator.up.mock.calls.length).toBe(1);
    expect(migrator.up.mock.calls[0][0]).toEqual({});
    expect(close.mock.calls.length).toBe(1);
    await expect(cmd.handler({ only: '1,2' } as any)).resolves.toBeUndefined();
    expect(migrator.up.mock.calls.length).toBe(2);
    expect(migrator.up.mock.calls[1][0]).toEqual({ migrations: ['1', '2'] });
    expect(close.mock.calls.length).toBe(2);
    await expect(cmd.handler({ from: '1', to: '2' } as any)).resolves.toBeUndefined();
    expect(migrator.up.mock.calls.length).toBe(3);
    expect(migrator.up.mock.calls[2][0]).toEqual({ from: '1', to: '2' });
    expect(close.mock.calls.length).toBe(3);
    await expect(cmd.handler({ from: '0', to: '0' } as any)).resolves.toBeUndefined();
    expect(migrator.up.mock.calls.length).toBe(4);
    expect(migrator.up.mock.calls[3][0]).toEqual({ from: 0, to: 0 });
    expect(close.mock.calls.length).toBe(4);
    await expect(cmd.handler({ to: 'a' } as any)).resolves.toBeUndefined();
    expect(migrator.up.mock.calls.length).toBe(5);
    expect(migrator.up.mock.calls[4][0]).toEqual({ to: 'a' });
    expect(close.mock.calls.length).toBe(5);
    await expect(cmd.handler({ only: 'a' } as any)).resolves.toBeUndefined();
    expect(migrator.up.mock.calls.length).toBe(6);
    expect(migrator.up.mock.calls[5][0]).toEqual({ migrations: ['a'] });
    expect(close.mock.calls.length).toBe(6);
  });

});
