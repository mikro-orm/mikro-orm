import { Configuration, CLIHelper } from '../../packages/mikro-orm/src';

const close = jest.fn();
const config = new Configuration({} as any, false);
const connection = { loadFile: jest.fn() };
const em = { getConnection: () => connection };
const showHelpMock = jest.spyOn(require('yargs'), 'showHelp');
showHelpMock.mockReturnValue('');
const getORMMock = jest.spyOn(CLIHelper, 'getORM');
getORMMock.mockResolvedValue({ em, config, close } as any);
const dumpMock = jest.spyOn(CLIHelper, 'dump');
dumpMock.mockImplementation(() => void 0);

(global as any).console.log = jest.fn();

// noinspection ES6PreferShortImport
import { ImportCommand } from '../../packages/cli/src/commands/ImportCommand';

describe('ImportDatabaseCommand', () => {

  test('handler', async () => {
    const cmd = new ImportCommand();

    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(close.mock.calls.length).toBe(1);
    expect(connection.loadFile.mock.calls.length).toBe(1);
  });

});
