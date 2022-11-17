import type { ArgumentsCamelCase, Argv, CommandModule } from 'yargs';
import { colors } from '@mikro-orm/core';
import { CLIHelper } from '../CLIHelper';

export class DatabaseSeedCommand<T> implements CommandModule<T, { class: string }> {

  command = 'seeder:run';
  describe = 'Seed the database using the seeder class';
  builder = (args: Argv<T>) => {
    args.option('c', {
      alias: 'class',
      type: 'string',
      desc: 'Seeder class to run',
    });
    return args as Argv<{ class: string }>;
  };

  /**
   * @inheritDoc
   */
  async handler(args: ArgumentsCamelCase<{ class?: string }>) {
    const orm = await CLIHelper.getORM();
    const className = args.class ?? orm.config.get('seeder').defaultSeeder!;
    await orm.getSeeder().seedString(className);
    CLIHelper.dump(colors.green(`Seeder ${className} successfully executed`));
    await orm.close(true);
  }

}
