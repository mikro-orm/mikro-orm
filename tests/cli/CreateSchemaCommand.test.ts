const showHelp = jest.fn();
const close = jest.fn();
const configureSchemaCommand = jest.fn();
const schemaGenerator = { createSchema: jest.fn(() => []), getCreateSchemaSQL: jest.fn(() => '') };
const getORM = async () => ({ getSchemaGenerator: () => schemaGenerator, close });
jest.mock('yargs', () => ({ showHelp }));
jest.mock('../../lib/cli/CLIHelper', () => ({ CLIHelper: { getORM, configureSchemaCommand } }));

(global as any).console.log = jest.fn();

import { CreateSchemaCommand } from '../../lib/cli/CreateSchemaCommand';

describe('CreateSchemaCommand', () => {

  test('builder', async () => {
    const cmd = new CreateSchemaCommand();

    const args = { option: 123 };
    expect(configureSchemaCommand.mock.calls.length).toBe(0);
    cmd.builder(args as any);
    expect(configureSchemaCommand.mock.calls.length).toBe(1);
  });

  test('handler', async () => {
    const cmd = new CreateSchemaCommand();

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
