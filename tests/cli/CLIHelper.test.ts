import { Configuration } from '../../lib/utils';

jest.mock(('../../tests/cli-config').replace(/\\/g, '/'), () => ({ dbName: 'foo_bar', entitiesDirs: ['.'] }));
(global as any).process.cwd = () => '../../tests';

import { CLIHelper } from '../../lib/cli/CLIHelper';
import { MikroORM } from '../../lib';
import { DropSchemaCommand } from '../../lib/cli/DropSchemaCommand';

describe('CLIHelper', () => {

  test('configures yargs instance', async () => {
    const cli = CLIHelper.configure() as any;
    expect(cli.$0).toBe('mikro-orm');
    expect(cli.getCommandInstance().getCommands()).toEqual(['cache:clear', 'generate-entities', 'schema:create', 'schema:drop', 'schema:update']);
    expect(cli.getCommandInstance());
  });

  test('gets ORM configuration', async () => {
    const conf = CLIHelper.getConfiguration();
    expect(conf).toBeInstanceOf(Configuration);
    expect(conf.get('dbName')).toBe('foo_bar');
    expect(conf.get('entitiesDirs')).toEqual(['.']);
  });

  test('gets ORM instance', async () => {
    const orm = await CLIHelper.getORM();
    expect(orm).toBeInstanceOf(MikroORM);
    await orm.close(true);
  });

  test('builder', async () => {
    const args = { option: jest.fn() };
    CLIHelper.configureSchemaCommand(args as any);
    expect(args.option.mock.calls.length).toBe(3);
    expect(args.option.mock.calls[0][0]).toBe('r');
    expect(args.option.mock.calls[0][1]).toMatchObject({ alias: 'run', type: 'boolean' });
    expect(args.option.mock.calls[1][0]).toBe('d');
    expect(args.option.mock.calls[1][1]).toMatchObject({ alias: 'dump', type: 'boolean' });
    expect(args.option.mock.calls[2][0]).toBe('no-fk');
    expect(args.option.mock.calls[2][1]).toMatchObject({ type: 'boolean' });
  });

});
