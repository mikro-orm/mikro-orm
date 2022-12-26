import { Configuration, Utils } from '@mikro-orm/core';
import { CLIHelper } from '@mikro-orm/cli';
import { DebugCommand } from '../../packages/cli/src/commands/DebugCommand';
import { MongoDriver } from '../../packages/mongodb/src/MongoDriver';

(global as any).process.env.FORCE_COLOR = 0;

describe('Issue #3855', () => {
  const dump = jest.spyOn(CLIHelper, 'dump');
  dump.mockImplementation(() => void 0);

  ignoreDependencies();
  stubConfigPaths();
  stubConfig();

  it('should print error message when fail to connect', async () => {
    const cmd = new DebugCommand();

    simulateFailedConnection();
    await expect(cmd.handler()).resolves.toBeUndefined();
    expect(dump.mock.calls).toEqual([
      ['Current MikroORM CLI configuration'],
      [' - searched config paths:'],
      [`   - ${Utils.normalizePath(process.cwd() + '/path/orm-config.ts')} (not found)`],
      [' - Database Connection failed'],
    ]);
  });

});


function ignoreDependencies() {
  const dumpDependencies = jest.spyOn(CLIHelper, 'dumpDependencies');
  dumpDependencies.mockImplementation(async () => void 0);
}

function stubConfigPaths() {
  const getConfigPaths = jest.spyOn(CLIHelper, 'getConfigPaths');
  getConfigPaths.mockResolvedValue(['./path/orm-config.ts']);
}

function simulateFailedConnection() {
  const connection = jest.spyOn(DebugCommand, 'connect');
  connection.mockImplementation(() => {
    throw new Error('Connection Error');
  });
}

function stubConfig() {
  const getConfiguration = jest.spyOn(CLIHelper, 'getConfiguration');
  getConfiguration.mockResolvedValue(new Configuration({ driver: MongoDriver } as any, false));
}

