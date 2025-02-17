(global as any).process.env.FORCE_COLOR = 0;

import { MikroORM } from '@mikro-orm/core';
import { SchemaGenerator, SqliteDriver } from '@mikro-orm/sqlite';
import { CLIHelper } from '@mikro-orm/cli';
import { SchemaCommandFactory } from '../../../packages/cli/src/commands/SchemaCommandFactory.js';
import { initORMSqlite } from '../../bootstrap.js';

describe('UpdateSchemaCommand', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await initORMSqlite();
  });

  afterAll(async () => await orm.close(true));

  test('handler', async () => {
    const getORMMock = vi.spyOn(CLIHelper, 'getORM');
    getORMMock.mockResolvedValue(orm);
    const showHelpMock = vi.spyOn(CLIHelper, 'showHelp');
    showHelpMock.mockImplementation(() => void 0);
    const closeSpy = vi.spyOn(MikroORM.prototype, 'close');
    const updateSchema = vi.spyOn(SchemaGenerator.prototype, 'updateSchema');
    updateSchema.mockImplementation(async () => void 0);
    const getUpdateSchemaSQL = vi.spyOn(SchemaGenerator.prototype, 'getUpdateSchemaSQL');
    getUpdateSchemaSQL.mockImplementation(async () => '');
    const dumpMock = vi.spyOn(CLIHelper, 'dump');
    dumpMock.mockImplementation(() => void 0);

    const cmd = SchemaCommandFactory.create('update');

    expect(showHelpMock.mock.calls.length).toBe(0);
    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(showHelpMock.mock.calls.length).toBe(1);

    expect(updateSchema.mock.calls.length).toBe(0);
    expect(closeSpy).toHaveBeenCalledTimes(0);
    await expect(cmd.handler({ run: true } as any)).resolves.toBeUndefined();
    expect(updateSchema.mock.calls.length).toBe(1);
    expect(closeSpy).toHaveBeenCalledTimes(1);

    expect(getUpdateSchemaSQL.mock.calls.length).toBe(0);
    await expect(cmd.handler({ dump: true } as any)).resolves.toBeUndefined();
    expect(getUpdateSchemaSQL.mock.calls.length).toBe(1);
    expect(closeSpy).toHaveBeenCalledTimes(2);
  });

});
