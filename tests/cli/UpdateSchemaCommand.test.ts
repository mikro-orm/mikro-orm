const showHelp = jest.fn();
const close = jest.fn();
const configureSchemaCommand = jest.fn();
const schemaGenerator = { updateSchema: jest.fn(() => []), getUpdateSchemaSQL: jest.fn(() => '') };
const getORM = async () => ({ getSchemaGenerator: () => schemaGenerator, close });
jest.mock('yargs', () => ({ showHelp }));
jest.mock('../../lib/cli/CLIHelper', () => ({ CLIHelper: { getORM, configureSchemaCommand } }));

(global as any).console.log = jest.fn();

import { UpdateSchemaCommand } from '../../lib/cli/UpdateSchemaCommand';

describe('UpdateSchemaCommand', () => {

  test('builder', async () => {
    const cmd = new UpdateSchemaCommand();

    const args = { option: 123 };
    expect(configureSchemaCommand.mock.calls.length).toBe(0);
    cmd.builder(args as any);
    expect(configureSchemaCommand.mock.calls.length).toBe(1);
  });

  test('handler', async () => {
    const cmd = new UpdateSchemaCommand();

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
