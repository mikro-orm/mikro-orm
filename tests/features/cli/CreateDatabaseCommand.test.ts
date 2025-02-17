(global as any).process.env.FORCE_COLOR = 0;

import { MikroORM } from '@mikro-orm/core';
import { SchemaGenerator, SqliteDriver } from '@mikro-orm/sqlite';
import { CLIHelper } from '@mikro-orm/cli';
import { CreateDatabaseCommand } from '../../../packages/cli/src/commands/CreateDatabaseCommand.js';
import { initORMSqlite } from '../../bootstrap.js';

const closeSpy = vi.spyOn(MikroORM.prototype, 'close');
const showHelpMock = vi.spyOn(CLIHelper, 'showHelp');
showHelpMock.mockImplementation(() => void 0);
const ensureDatabase = vi.spyOn(SchemaGenerator.prototype, 'ensureDatabase');
ensureDatabase.mockImplementation(async () => false);
const dumpMock = vi.spyOn(CLIHelper, 'dump');
dumpMock.mockImplementation(() => void 0);

describe('CreateDatabaseCommand', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await initORMSqlite();
    const getORMMock = vi.spyOn(CLIHelper, 'getORM');
    getORMMock.mockResolvedValue(orm);
  });

  test('handler', async () => {
    const cmd = new CreateDatabaseCommand();

    await expect(cmd.handler({} as any)).resolves.toBeUndefined();

    expect(ensureDatabase).toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

});
