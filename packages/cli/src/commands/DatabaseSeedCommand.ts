import type { ArgumentsCamelCase, Argv } from 'yargs';
import { colors } from '@mikro-orm/core';
import type { BaseArgs, BaseCommand } from '../CLIConfigurator.js';
import { CLIHelper } from '../CLIHelper.js';

type DatabaseSeedArgs = BaseArgs & { class?: string };

export class DatabaseSeedCommand implements BaseCommand<DatabaseSeedArgs> {

  command = 'seeder:run';
  describe = 'Seed the database using the seeder class';
  builder = (args: Argv<BaseArgs>) => {
    args.option('c', {
      alias: 'class',
      type: 'string',
      desc: 'Seeder class to run',
    });
    return args as Argv<DatabaseSeedArgs>;
  };

  /**
   * @inheritDoc
   */
  async handler(args: ArgumentsCamelCase<DatabaseSeedArgs>) {
    const orm = await CLIHelper.getORM(args.contextName, args.config);
    const className = args.class ?? orm.config.get('seeder').defaultSeeder!;
    await orm.getSeeder().seedString(className);
    CLIHelper.dump(colors.green(`Seeder ${className} successfully executed`));
    await orm.close(true);
  }

}
