import type { ArgumentsCamelCase } from 'yargs';
import type { BaseArgs, BaseCommand } from '../CLIConfigurator.js';
import { CLIHelper } from '../CLIHelper.js';

export class CreateDatabaseCommand implements BaseCommand {
  command = 'database:create';
  describe = 'Create your database if it does not exist';

  /**
   * @inheritDoc
   */
  async handler(args: ArgumentsCamelCase<BaseArgs>) {
    CLIHelper.quiet = args.quiet;
    const orm = await CLIHelper.getORM(args.contextName, args.config);
    await orm.schema.ensureDatabase();
    await orm.close(true);
  }
}
