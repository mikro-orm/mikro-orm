import { Configuration } from '../../lib/utils';

const showHelp = jest.fn();
const close = jest.fn();
const configureSchemaCommand = jest.fn();
const schemaGenerator = { updateSchema: jest.fn(() => []), getUpdateSchemaSQL: jest.fn(() => '') };
const config = new Configuration({} as any, false);
const getORM = async () => ({ getSchemaGenerator: () => schemaGenerator, config, close });
jest.mock('yargs', () => ({ showHelp }));
jest.mock('../../lib/cli/CLIHelper', () => ({ CLIHelper: { getORM, dump: jest.fn(), configureSchemaCommand } }));

(global as any).console.log = jest.fn();

import { SchemaCommandFactory } from '../../lib/cli/SchemaCommandFactory';

describe('UpdateSchemaCommand', () => {

  test('handler', async () => {
    const cmd = SchemaCommandFactory.create('update');

    expect(showHelp.mock.calls.length).toBe(0);
    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(showHelp.mock.calls.length).toBe(1);

    expect(schemaGenerator.updateSchema.mock.calls.length).toBe(0);
    expect(close.mock.calls.length).toBe(0);
    await expect(cmd.handler({ run: true } as any)).resolves.toBeUndefined();
    expect(schemaGenerator.updateSchema.mock.calls.length).toBe(1);
    expect(close.mock.calls.length).toBe(1);

    expect(schemaGenerator.getUpdateSchemaSQL.mock.calls.length).toBe(0);
    await expect(cmd.handler({ dump: true } as any)).resolves.toBeUndefined();
    expect(schemaGenerator.getUpdateSchemaSQL.mock.calls.length).toBe(1);
    expect(close.mock.calls.length).toBe(2);
  });

});
