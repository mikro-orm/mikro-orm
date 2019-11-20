import { Configuration } from '../../lib/utils';

const close = jest.fn();
const connection = { loadFile: jest.fn() };
const em = { getConnection: () => connection };
const config = new Configuration({} as any, false);
const getORM = async () => ({ em, config, close });
jest.mock('../../lib/cli/CLIHelper', () => ({ CLIHelper: { getORM, dump: jest.fn() } }));

(global as any).console.log = jest.fn();

import { ImportCommand } from '../../lib/cli/ImportCommand';

describe('ImportDatabaseCommand', () => {

  test('handler', async () => {
    const cmd = new ImportCommand();

    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(close.mock.calls.length).toBe(1);
    expect(connection.loadFile.mock.calls.length).toBe(1);
  });

});
