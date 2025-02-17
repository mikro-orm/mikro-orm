(global as any).process.env.FORCE_COLOR = 0;
(global as any).console.log = vi.fn();

import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { CLIHelper } from '@mikro-orm/cli';
import { SeedManager } from '@mikro-orm/seeder';
import { CreateSeederCommand } from '../../../packages/cli/src/commands/CreateSeederCommand.js';
import { initORMSqlite } from '../../bootstrap.js';

describe('CreateSeederCommand', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await initORMSqlite();
    const getORMMock = vi.spyOn(CLIHelper, 'getORM');
    getORMMock.mockResolvedValue(orm);
  });

  afterAll(async () => await orm.close(true));

  test('handler', async () => {
    const closeSpy = vi.spyOn(MikroORM.prototype, 'close');
    vi.spyOn(CLIHelper, 'showHelp').mockImplementation(() => void 0);
    const createSeederMock = vi.spyOn(SeedManager.prototype, 'createSeeder');
    createSeederMock.mockResolvedValue('database/seeders/database.seeder.ts');

    const cmd = new CreateSeederCommand();
    const mockPositional = vi.fn();
    const mockDemand = vi.fn();
    const args = { positional: mockPositional };
    cmd.builder(args as any);
    expect(mockPositional).toHaveBeenCalledWith('seeder', {
      demandOption: true,
      describe: 'Name for the seeder class. (e.g. "test" will generate "TestSeeder" or "TestSeeder" will generate "TestSeeder")',
    });

    await expect(cmd.handler({ seeder: 'DatabaseSeeder' } as any)).resolves.toBeUndefined();
    expect(createSeederMock).toHaveBeenCalledTimes(1);
    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  test('should generate seeder class with all kind of names', async () => {
    const cmd = new CreateSeederCommand();
    // @ts-expect-error private method
    const spy = vi.spyOn(CreateSeederCommand, 'getSeederClassName');
    await cmd.handler({ seeder: 'DatabaseSeeder' } as any);
    expect(spy).toHaveLastReturnedWith('DatabaseSeeder');

    await cmd.handler({ seeder: 'database' } as any);
    expect(spy).toHaveLastReturnedWith('DatabaseSeeder');

    await cmd.handler({ seeder: 'Test' } as any);
    expect(spy).toHaveLastReturnedWith('TestSeeder');

    await cmd.handler({ seeder: 'project-names' } as any);
    expect(spy).toHaveLastReturnedWith('ProjectNamesSeeder');

    await cmd.handler({ seeder: 'project-names-seeder' } as any);
    expect(spy).toHaveLastReturnedWith('ProjectNamesSeeder');
  });
});
