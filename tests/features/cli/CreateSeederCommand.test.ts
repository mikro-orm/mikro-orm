import { SeedManager } from '@mikro-orm/seeder';

(global as any).process.env.FORCE_COLOR = 0;
(global as any).console.log = jest.fn();

import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { CLIHelper } from '@mikro-orm/cli';
import { CreateSeederCommand } from '../../../packages/cli/src/commands/CreateSeederCommand';
import { initORMSqlite } from '../../bootstrap';

const close = jest.fn();
jest.spyOn(MikroORM.prototype, 'close').mockImplementation(close);
jest.spyOn(require('yargs'), 'showHelp').mockReturnValue('');
const createSeederMock = jest.spyOn(SeedManager.prototype, 'createSeeder');
createSeederMock.mockResolvedValue('database/seeders/database.seeder.ts');

describe('CreateSeederCommand', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await initORMSqlite();
    const getORMMock = jest.spyOn(CLIHelper, 'getORM');
    getORMMock.mockResolvedValue(orm);
  });

  afterAll(async () => await orm.close(true));

  test('handler', async () => {
    const cmd = new CreateSeederCommand();
    const mockPositional = jest.fn();
    const mockDemand = jest.fn();
    const args = { positional: mockPositional, demandOption: mockDemand };
    cmd.builder(args as any);
    expect(mockPositional).toBeCalledWith('seeder', {
      describe: 'Seeder class to create (use PascalCase and end with `Seeder` e.g. DatabaseSeeder)',
    });
    expect(mockDemand).toBeCalledWith('seeder');

    await expect(cmd.handler({ seeder: 'DatabaseSeeder' } as any)).resolves.toBeUndefined();
    expect(createSeederMock).toBeCalledTimes(1);
    expect(close).toBeCalledTimes(1);
  });

});
