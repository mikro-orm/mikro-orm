process.env.FORCE_COLOR = '0';

import { MikroORM } from '@mikro-orm/sqlite';
import { CLIHelper } from '@mikro-orm/cli';
import { MigrationCommandFactory } from '../../../packages/cli/src/commands/MigrationCommandFactory.js';
import yargs from 'yargs';

describe('BreakpointMigrationCommand', () => {
  afterEach(() => vi.restoreAllMocks());

  test('requires a migration name and accepts aliases, removal and schema options', async () => {
    const command = MigrationCommandFactory.create('breakpoint');
    const parser = yargs([])
      .option('config', { type: 'string', array: true })
      .option('contextName', { type: 'string', default: 'default' })
      .option('quiet', { type: 'boolean', default: false })
      .exitProcess(false)
      .fail(message => {
        throw new Error(message);
      })
      .command({ ...command, handler: () => void 0 });
    await expect(async () => parser.parseAsync('migration:breakpoint')).rejects.toThrow(
      'Missing required argument: name',
    );
    const args = await parser.parseAsync('migration:breakpoint -n Migration1 --remove -s tenant_a');
    expect(args).toMatchObject({ name: 'Migration1', remove: true, schema: 'tenant_a' });
  });

  test.each([false, true])('sets or removes a breakpoint through the migrator: remove=%s', async remove => {
    const setBreakpoint = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(CLIHelper, 'getORM').mockResolvedValue({ migrator: { setBreakpoint }, close } as unknown as MikroORM);
    const info = vi.spyOn(CLIHelper, 'info').mockImplementation(() => void 0);
    const command = MigrationCommandFactory.create('breakpoint');

    await command.handler({ name: 'Migration1', remove, schema: 'tenant_a' } as any);
    expect(setBreakpoint).toHaveBeenCalledWith('Migration1', !remove, { schema: 'tenant_a' });
    expect(info).toHaveBeenCalledWith(expect.stringContaining(remove ? 'removed from' : 'set on'));
    expect(close).toHaveBeenCalledWith(true);
  });
});
