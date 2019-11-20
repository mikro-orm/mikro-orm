import { Configuration } from '../../lib/utils';

const showHelp = jest.fn();
const close = jest.fn();
const migrator = { getExecutedMigrations: jest.fn(() => [{ name: '1', executed_at: new Date() }]) };
const config = new Configuration({} as any, false);
const getORM = async () => ({ getMigrator: () => migrator, config, close });
jest.mock('yargs', () => ({ showHelp }));
jest.mock('../../lib/cli/CLIHelper', () => ({ CLIHelper: { getORM, dump: jest.fn(), dumpTable: jest.fn() } }));

(global as any).console.log = jest.fn();

import { MigrationCommandFactory } from '../../lib/cli/MigrationCommandFactory';

describe('ListMigrationsCommand', () => {

  test('builder', async () => {
    const cmd = MigrationCommandFactory.create('list');
    const args = { option: jest.fn() };
    cmd.builder(args as any);
  });

  test('handler', async () => {
    const cmd = MigrationCommandFactory.create('list');

    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(migrator.getExecutedMigrations.mock.calls.length).toBe(1);
    expect(close.mock.calls.length).toBe(1);
  });

});
