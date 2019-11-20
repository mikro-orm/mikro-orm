import { Configuration } from '../../lib/utils';

const showHelp = jest.fn();
const close = jest.fn();
const schemaGenerator = { createSchema: jest.fn(() => []), getCreateSchemaSQL: jest.fn(() => '') };
const config = new Configuration({} as any, false);
const getORM = async () => ({ getSchemaGenerator: () => schemaGenerator, config, close });
jest.mock('yargs', () => ({ showHelp }));
jest.mock('../../lib/cli/CLIHelper', () => ({ CLIHelper: { getORM, dump: jest.fn() } }));

(global as any).console.log = jest.fn();

import { SchemaCommandFactory } from '../../lib/cli/SchemaCommandFactory';

describe('CreateSchemaCommand', () => {

  test('builder', async () => {
    const cmd = SchemaCommandFactory.create('create');
    const args = { option: jest.fn() };
    cmd.builder(args as any);
  });

  test('handler', async () => {
    const cmd = SchemaCommandFactory.create('create');

    expect(showHelp.mock.calls.length).toBe(0);
    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(showHelp.mock.calls.length).toBe(1);

    expect(schemaGenerator.createSchema.mock.calls.length).toBe(0);
    expect(close.mock.calls.length).toBe(0);
    await expect(cmd.handler({ run: true } as any)).resolves.toBeUndefined();
    expect(schemaGenerator.createSchema.mock.calls.length).toBe(1);
    expect(close.mock.calls.length).toBe(1);

    expect(schemaGenerator.getCreateSchemaSQL.mock.calls.length).toBe(0);
    await expect(cmd.handler({ dump: true } as any)).resolves.toBeUndefined();
    expect(schemaGenerator.getCreateSchemaSQL.mock.calls.length).toBe(1);
    expect(close.mock.calls.length).toBe(2);
  });

});
