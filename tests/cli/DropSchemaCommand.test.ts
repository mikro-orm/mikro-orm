const showHelp = jest.fn();
const close = jest.fn();
const configureSchemaCommand = jest.fn();
const schemaGenerator = { dropSchema: jest.fn(() => []), getDropSchemaSQL: jest.fn(() => '') };
const getORM = async () => ({ getSchemaGenerator: () => schemaGenerator, close });
jest.mock('yargs', () => ({ showHelp }));
jest.mock('../../lib/cli/CLIHelper', () => ({ CLIHelper: { getORM, configureSchemaCommand } }));

(global as any).console.log = jest.fn();

import { DropSchemaCommand } from '../../lib/cli/DropSchemaCommand';

describe('DropSchemaCommand', () => {

  test('builder', async () => {
    const cmd = new DropSchemaCommand();

    const args = { option: 123 };
    expect(configureSchemaCommand.mock.calls.length).toBe(0);
    cmd.builder(args as any);
    expect(configureSchemaCommand.mock.calls.length).toBe(1);
  });

  test('handler', async () => {
    const cmd = new DropSchemaCommand();

    expect(showHelp.mock.calls.length).toBe(0);
    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(showHelp.mock.calls.length).toBe(1);

    expect(schemaGenerator.dropSchema.mock.calls.length).toBe(0);
    expect(close.mock.calls.length).toBe(0);
    await expect(cmd.handler({ run: true } as any)).resolves.toBeUndefined();
    expect(schemaGenerator.dropSchema.mock.calls.length).toBe(1);
    expect(close.mock.calls.length).toBe(1);

    expect(schemaGenerator.getDropSchemaSQL.mock.calls.length).toBe(0);
    await expect(cmd.handler({ dump: true } as any)).resolves.toBeUndefined();
    expect(schemaGenerator.getDropSchemaSQL.mock.calls.length).toBe(1);
    expect(close.mock.calls.length).toBe(2);
  });

});
