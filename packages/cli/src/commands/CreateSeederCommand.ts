import type { ArgumentsCamelCase, Argv, CommandModule } from 'yargs';
import { colors } from '@mikro-orm/core';
import { CLIHelper } from '../CLIHelper';

export class CreateSeederCommand<T> implements CommandModule<T, { seeder: string }> {

  command = 'seeder:create <seeder>';
  describe = 'Create a new seeder class';
  builder = (args: Argv<T>) => {
    args.positional('seeder', {
      describe: 'Name for the seeder class. (e.g. "test" will generate "TestSeeder" or "TestSeeder" will generate "TestSeeder")',
    });
    args.demandOption('seeder');
    return args as Argv<{ seeder: string }>;
  };

  /**
   * @inheritDoc
   */
  async handler(args: ArgumentsCamelCase<{ seeder: string }>) {
    const className = CreateSeederCommand.getSeederClassName(args.seeder);
    const orm = await CLIHelper.getORM();
    const seeder = orm.getSeeder();
    const path = await seeder.createSeeder(className);
    CLIHelper.dump(colors.green(`Seeder ${args.seeder} successfully created at ${path}`));
    await orm.close(true);
  }

  /**
   * Will return a seeder name that is formatted like this EntitySeeder
   */
  private static getSeederClassName(name: string): string {
    name = name.match(/(.+)seeder/i)?.[1] ?? name;
    const parts = name.split('-');

    return parts.map(name => name.charAt(0).toUpperCase() + name.slice(1)).join('') + 'Seeder';
  }

}
