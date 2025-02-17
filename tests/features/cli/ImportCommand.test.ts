import { Configuration } from '@mikro-orm/core';
import { CLIHelper } from '@mikro-orm/cli';
import { MongoDriver } from '@mikro-orm/mongodb';

(global as any).console.log = vi.fn();

import { ImportCommand } from '../../../packages/cli/src/commands/ImportCommand.js';

describe('ImportDatabaseCommand', () => {

  test('handler', async () => {
    const close = vi.fn();
    const config = new Configuration({ driver: MongoDriver } as any, false);
    const connection = { loadFile: vi.fn() };
    const em = { getConnection: () => connection };
    const showHelpMock = vi.spyOn(CLIHelper, 'showHelp');
    showHelpMock.mockImplementation(() => void 0);
    const getORMMock = vi.spyOn(CLIHelper, 'getORM');
    getORMMock.mockResolvedValue({ em, config, close } as any);
    const dumpMock = vi.spyOn(CLIHelper, 'dump');
    dumpMock.mockImplementation(() => void 0);

    const cmd = new ImportCommand();

    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(close).toHaveBeenCalledTimes(1);
    expect(connection.loadFile.mock.calls.length).toBe(1);
  });

});
