(global as any).process.env.FORCE_COLOR = 0;

import { MikroORM } from '@mikro-orm/core';
import { SchemaGenerator, SqliteDriver } from '@mikro-orm/sqlite';
import { CLIHelper } from '@mikro-orm/cli';
import { SchemaCommandFactory } from '../../../packages/cli/src/commands/SchemaCommandFactory';
import { initORMSqlite } from '../../bootstrap';

const closeSpy = jest.spyOn(MikroORM.prototype, 'close');
const showHelpMock = jest.spyOn(CLIHelper, 'showHelp');
showHelpMock.mockImplementation(() => void 0);
const dropSchema = jest.spyOn(SchemaGenerator.prototype, 'dropSchema');
dropSchema.mockImplementation(async () => void 0);
const getDropSchemaSQL = jest.spyOn(SchemaGenerator.prototype, 'getDropSchemaSQL');
getDropSchemaSQL.mockImplementation(async () => '');
const dumpMock = jest.spyOn(CLIHelper, 'dump');
dumpMock.mockImplementation(() => void 0);

describe('DropSchemaCommand', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await initORMSqlite();
    const getORMMock = jest.spyOn(CLIHelper, 'getORM');
    getORMMock.mockResolvedValue(orm);
  });

  afterAll(async () => await orm.close(true));

  test('handler', async () => {
    const cmd = SchemaCommandFactory.create('drop');

    expect(showHelpMock.mock.calls.length).toBe(0);
    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(showHelpMock.mock.calls.length).toBe(1);

    expect(dropSchema.mock.calls.length).toBe(0);
    expect(closeSpy).toBeCalledTimes(0);
    await expect(cmd.handler({ run: true } as any)).resolves.toBeUndefined();
    expect(dropSchema.mock.calls.length).toBe(1);
    expect(closeSpy).toBeCalledTimes(1);

    await expect(cmd.handler({ run: true, dropMigrationsTable: true } as any)).resolves.toBeUndefined();
    expect(dropSchema.mock.calls.length).toBe(2);
    expect(dropSchema.mock.calls[1][0]).toEqual({ wrap: undefined, dropMigrationsTable: true, run: true });
    expect(closeSpy).toBeCalledTimes(2);

    expect(getDropSchemaSQL.mock.calls.length).toBe(0);
    await expect(cmd.handler({ dump: true } as any)).resolves.toBeUndefined();
    expect(getDropSchemaSQL.mock.calls.length).toBe(1);
    expect(closeSpy).toBeCalledTimes(3);

    await expect(cmd.handler({ dump: true, dropMigrationsTable: true } as any)).resolves.toBeUndefined();
    expect(getDropSchemaSQL.mock.calls.length).toBe(2);
    expect(getDropSchemaSQL.mock.calls[1][0]).toEqual({ wrap: undefined, dropMigrationsTable: true, dump: true });
    expect(closeSpy).toBeCalledTimes(4);

    await expect(cmd.handler({ run: true, dropDb: true } as any)).resolves.toBeUndefined();
    expect(dropSchema.mock.calls.length).toBe(3);
    expect(dropSchema.mock.calls[2][0]).toEqual({ wrap: undefined, dropMigrationsTable: undefined, dropDb: true, run: true });
    expect(closeSpy).toBeCalledTimes(5);
  });

});
