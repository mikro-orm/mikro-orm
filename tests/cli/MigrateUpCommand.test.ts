import { Configuration } from '../../lib/utils';

const showHelp = jest.fn();
const close = jest.fn();
const migrator = { up: jest.fn(() => []) };
const config = new Configuration({} as any, false);
const getORM = async () => ({ getMigrator: () => migrator, config, close });
jest.mock('yargs', () => ({ showHelp }));
jest.mock('../../lib/cli/CLIHelper', () => ({ CLIHelper: { getORM, dump: jest.fn() } }));

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
    expect(close.mock.calls.length).toBe(1);
    await expect(cmd.handler({ only: '1,2' } as any)).resolves.toBeUndefined();
    expect(migrator.up.mock.calls.length).toBe(2);
    expect(close.mock.calls.length).toBe(2);
    await expect(cmd.handler({ from: '1', to: '2' } as any)).resolves.toBeUndefined();
    expect(migrator.up.mock.calls.length).toBe(3);
    expect(close.mock.calls.length).toBe(3);
    await expect(cmd.handler({ from: '0', to: '0' } as any)).resolves.toBeUndefined();
    expect(migrator.up.mock.calls.length).toBe(4);
    expect(close.mock.calls.length).toBe(4);
    await expect(cmd.handler('test' as any)).resolves.toBeUndefined();
    expect(migrator.up.mock.calls.length).toBe(5);
    expect(close.mock.calls.length).toBe(5);
  });

});
