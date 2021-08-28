(global as any).process.env.FORCE_COLOR = 0;

import { MikroORM } from '@mikro-orm/core';
import { SchemaGenerator, SqliteDriver } from '@mikro-orm/sqlite';
import { CLIHelper } from '@mikro-orm/cli';
import { CreateDatabaseCommand } from '../../../packages/cli/src/commands/CreateDatabaseCommand';
import { initORMSqlite } from '../../bootstrap';

const closeSpy = jest.spyOn(MikroORM.prototype, 'close');
const showHelpMock = jest.spyOn(CLIHelper, 'showHelp');
showHelpMock.mockImplementation(() => void 0);
const ensureDatabase = jest.spyOn(SchemaGenerator.prototype, 'ensureDatabase');
ensureDatabase.mockImplementation(async () => void 0);
const dumpMock = jest.spyOn(CLIHelper, 'dump');
dumpMock.mockImplementation(() => void 0);

describe('CreateDatabaseCommand', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await initORMSqlite();
    const getORMMock = jest.spyOn(CLIHelper, 'getORM');
    getORMMock.mockResolvedValue(orm);
  });

  test('handler', async () => {
    const cmd = new CreateDatabaseCommand();

    await expect(cmd.handler({} as any)).resolves.toBeUndefined();

    expect(ensureDatabase).toHaveBeenCalled();
    expect(closeSpy).toBeCalledTimes(1);
  });

});
