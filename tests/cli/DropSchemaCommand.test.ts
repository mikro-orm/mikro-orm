import { Configuration } from '../../lib/utils';
import { CLIHelper } from '../../lib/cli/CLIHelper';

const close = jest.fn();
const schemaGenerator = { dropSchema: jest.fn(() => []), getDropSchemaSQL: jest.fn(() => '') };
const config = new Configuration({} as any, false);
const showHelpMock = jest.spyOn(require('yargs'), 'showHelp');
showHelpMock.mockReturnValue('');
const getORMMock = jest.spyOn(CLIHelper, 'getORM');
getORMMock.mockResolvedValue({ getSchemaGenerator: () => schemaGenerator, config, close } as any);
const dumpMock = jest.spyOn(CLIHelper, 'dump');
dumpMock.mockImplementation(() => {});

(global as any).console.log = jest.fn();

import { SchemaCommandFactory } from '../../lib/cli/SchemaCommandFactory';

describe('DropSchemaCommand', () => {

  test('handler', async () => {
    const cmd = SchemaCommandFactory.create('drop');

    expect(showHelpMock.mock.calls.length).toBe(0);
    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(showHelpMock.mock.calls.length).toBe(1);

    expect(schemaGenerator.dropSchema.mock.calls.length).toBe(0);
    expect(close.mock.calls.length).toBe(0);
    await expect(cmd.handler({ run: true } as any)).resolves.toBeUndefined();
    expect(schemaGenerator.dropSchema.mock.calls.length).toBe(1);
    expect(close.mock.calls.length).toBe(1);

    await expect(cmd.handler({ run: true, dropMigrationsTable: true } as any)).resolves.toBeUndefined();
    expect(schemaGenerator.dropSchema.mock.calls.length).toBe(2);
    expect(schemaGenerator.dropSchema.mock.calls[1]).toEqual([true, true, undefined]);
    expect(close.mock.calls.length).toBe(2);

    expect(schemaGenerator.getDropSchemaSQL.mock.calls.length).toBe(0);
    await expect(cmd.handler({ dump: true } as any)).resolves.toBeUndefined();
    expect(schemaGenerator.getDropSchemaSQL.mock.calls.length).toBe(1);
    expect(close.mock.calls.length).toBe(3);

    await expect(cmd.handler({ dump: true, dropMigrationsTable: true } as any)).resolves.toBeUndefined();
    expect(schemaGenerator.getDropSchemaSQL.mock.calls.length).toBe(2);
    expect(schemaGenerator.getDropSchemaSQL.mock.calls[1]).toEqual([true, true]);
    expect(close.mock.calls.length).toBe(4);

    await expect(cmd.handler({ run: true, dropDb: true } as any)).resolves.toBeUndefined();
    expect(schemaGenerator.dropSchema.mock.calls.length).toBe(3);
    expect(schemaGenerator.dropSchema.mock.calls[2]).toEqual([true, undefined, true]);
    expect(close.mock.calls.length).toBe(5);
  });

});
