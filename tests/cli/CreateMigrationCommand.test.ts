import { Configuration } from '../../lib/utils';

const showHelp = jest.fn();
const close = jest.fn();
const migrator = { createMigration: jest.fn(() => ({ fileName: '1', code: '2', diff: ['3'] })) };
const config = new Configuration({} as any, false);
const getORM = async () => ({ getMigrator: () => migrator, config, close });
jest.mock('yargs', () => ({ showHelp }));
jest.mock('../../lib/cli/CLIHelper', () => ({ CLIHelper: { getORM, dump: jest.fn() } }));

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
