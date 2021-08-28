import { SeedManager } from '@mikro-orm/seeder';
import { Configuration, CLIHelper, MikroORM } from '../../../packages/mikro-orm/src';

const config = new Configuration({ type: 'mongo' } as any, false);
const showHelpMock = jest.spyOn(CLIHelper, 'showHelp');
showHelpMock.mockImplementation(() => void 0);
const closeSpy = jest.spyOn(MikroORM.prototype, 'close');
const getConfigMock = jest.spyOn(CLIHelper, 'getConfiguration');
getConfigMock.mockResolvedValue(config as any);
const dumpMock = jest.spyOn(CLIHelper, 'dump');
dumpMock.mockImplementation(() => void 0);
const seed = jest.spyOn(SeedManager.prototype, 'seedString');
seed.mockImplementation(async () => void 0);

(global as any).console.log = jest.fn();

import { DatabaseSeedCommand } from '../../../packages/cli/src/commands/DatabaseSeedCommand';
import { initORMSqlite } from '../../bootstrap';
import { SqliteDriver } from '@mikro-orm/sqlite';

describe('DatabaseSeedCommand', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await initORMSqlite();
    const getORMMock = jest.spyOn(CLIHelper, 'getORM');
    getORMMock.mockResolvedValue(orm);
  });

  afterAll(async () => await orm.close(true));

  test('handler', async () => {
    const cmd = new DatabaseSeedCommand();

    const mockOption = jest.fn();
    const args = { option: mockOption };
    cmd.builder(args as any);
    expect(mockOption).toBeCalledWith('c', {
      alias: 'class',
      type: 'string',
      desc: 'Seeder class to run',
    });
    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(seed).toBeCalledTimes(1);
    expect(seed).toBeCalledWith((orm.config.get('seeder').defaultSeeder));
    expect(closeSpy).toBeCalledTimes(1);

    await expect(cmd.handler({ class: 'TestSeeder' } as any)).resolves.toBeUndefined();
    expect(seed).toBeCalledTimes(2);
    expect(seed).toBeCalledWith(('TestSeeder'));
    expect(closeSpy).toBeCalledTimes(2);
  });

});
