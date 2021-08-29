import c from 'ansi-colors';
import type { Arguments, Argv, CommandModule } from 'yargs';
import type { MikroORM } from '@mikro-orm/core';
import type { AbstractSqlDriver } from '@mikro-orm/knex';
import { CLIHelper } from '../CLIHelper';

export class CreateSeederCommand<T> implements CommandModule<T, { seeder: string }> {

  command = 'seeder:create <seeder>';
  describe = 'Create a new seeder class';
  builder = (args: Argv) => {
    args.positional('seeder', {
      describe: 'Seeder class to create (use PascalCase and end with `Seeder` e.g. DatabaseSeeder)',
    });
    args.demandOption('seeder');
    return args as Argv<{ seeder: string }>;
  };

  /**
   * @inheritdoc
   */
  async handler(args: Arguments<{ seeder: string }>) {
    const orm = await CLIHelper.getORM(undefined) as MikroORM<AbstractSqlDriver>;
    const seeder = orm.getSeeder();
    const path = await seeder.createSeeder(args.seeder);
    CLIHelper.dump(c.green(`Seeder ${args.seeder} successfully created at ${path}`));
    await orm.close(true);
  }

}
