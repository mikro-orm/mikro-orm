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
      describe: 'Name for the seeder class. (e.g. "test" will generate "TestSeeder" or "TestSeeder" will generate "TestSeeder")',
    });
    args.demandOption('seeder');
    return args as Argv<{ seeder: string }>;
  };

  /**
   * @inheritdoc
   */
  async handler(args: Arguments<{ seeder: string }>) {
    const seederName = CreateSeederCommand.getSeederClassName(args.seeder);
    const orm = await CLIHelper.getORM(undefined) as MikroORM<AbstractSqlDriver>;
    const seeder = orm.getSeeder();
    const path = await seeder.createSeeder(seederName);
    CLIHelper.dump(c.green(`Seeder ${args.seeder} successfully created at ${path}`));
    await orm.close(true);
  }

  /**
   * Will return a seeder name that is formatted like this EntitySeeder
   * @param seedName
   * @private
   */
  static getSeederClassName(seedName: string): string {
    const seedNameMatches = seedName.match(/(.+)(seeder)/i);
    if (seedNameMatches) {
      seedName = seedNameMatches[1];
    }
    const seedNameSplit = seedName.split('-');
    return seedNameSplit.map(name => {
      return name.charAt(0).toUpperCase() + name.slice(1);
    }).join('') + 'Seeder';
  }

}
