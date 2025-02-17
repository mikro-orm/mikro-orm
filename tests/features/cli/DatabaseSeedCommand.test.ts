import { SeedManager } from '@mikro-orm/seeder';
import { Configuration, MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { MongoDriver } from '@mikro-orm/mongodb';
import { CLIHelper } from '@mikro-orm/cli';

const config = new Configuration({ driver: MongoDriver } as any, false);
const showHelpMock = vi.spyOn(CLIHelper, 'showHelp');
showHelpMock.mockImplementation(() => void 0);
const closeSpy = vi.spyOn(MikroORM.prototype, 'close');
const getConfigMock = vi.spyOn(CLIHelper, 'getConfiguration');
getConfigMock.mockResolvedValue(config as any);
const dumpMock = vi.spyOn(CLIHelper, 'dump');
dumpMock.mockImplementation(() => void 0);
const seed = vi.spyOn(SeedManager.prototype, 'seedString');
seed.mockImplementation(async () => void 0);

(global as any).console.log = vi.fn();

import { DatabaseSeedCommand } from '../../../packages/cli/src/commands/DatabaseSeedCommand.js';
import { initORMSqlite } from '../../bootstrap.js';

describe('DatabaseSeedCommand', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await initORMSqlite();
    const getORMMock = vi.spyOn(CLIHelper, 'getORM');
    getORMMock.mockResolvedValue(orm);
  });

  afterAll(async () => await orm.close(true));

  test('handler', async () => {
    const cmd = new DatabaseSeedCommand();

    const mockOption = vi.fn();
    const args = { option: mockOption };
    cmd.builder(args as any);
    expect(mockOption).toHaveBeenCalledWith('c', {
      alias: 'class',
      type: 'string',
      desc: 'Seeder class to run',
    });
    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(seed).toHaveBeenCalledTimes(1);
    expect(seed).toHaveBeenCalledWith((orm.config.get('seeder').defaultSeeder));
    expect(closeSpy).toHaveBeenCalledTimes(1);

    await expect(cmd.handler({ class: 'TestSeeder' } as any)).resolves.toBeUndefined();
    expect(seed).toHaveBeenCalledTimes(2);
    expect(seed).toHaveBeenCalledWith(('TestSeeder'));
    expect(closeSpy).toHaveBeenCalledTimes(2);
  });

});
