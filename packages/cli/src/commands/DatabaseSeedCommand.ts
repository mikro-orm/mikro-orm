import c from 'ansi-colors';
import type { Arguments, Argv, CommandModule } from 'yargs';
import { CLIHelper } from '../CLIHelper';
import type { MikroORM } from '@mikro-orm/core';
import type { AbstractSqlDriver } from '@mikro-orm/knex';

export class DatabaseSeedCommand<T> implements CommandModule<T, { class: string }> {

  command = 'seeder:run';
  describe = 'Seed the database using the seeder class';
  builder = (args: Argv) => {
    args.option('c', {
      alias: 'class',
      type: 'string',
      desc: 'Seeder class to run',
    });
    return args as Argv<{ class: string }>;
  };

  /**
   * @inheritdoc
   */
  async handler(args: Arguments<{ class?: string }>) {
    const orm = await CLIHelper.getORM(undefined) as MikroORM<AbstractSqlDriver>;
    const seeder = orm.getSeeder();
    const seederClass = args.class || orm.config.get('seeder').defaultSeeder;
    await seeder.seedString(seederClass);
    CLIHelper.dump(c.green(`Seeder ${seederClass} successfully seeded`));
    await orm.close(true);
  }

}
