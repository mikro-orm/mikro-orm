import type { ArgumentsCamelCase, Argv } from 'yargs';
import { colors } from '@mikro-orm/core';
import type { BaseArgs, BaseCommand } from '../CLIConfigurator.js';
import { CLIHelper } from '../CLIHelper.js';

type CreateSeederCommandArgs = BaseArgs & { seeder: string };

export class CreateSeederCommand implements BaseCommand<CreateSeederCommandArgs> {

  command = 'seeder:create <seeder>';
  describe = 'Create a new seeder class';
  builder = (args: Argv<BaseArgs>) => {
    args.positional('seeder', {
      describe: 'Name for the seeder class. (e.g. "test" will generate "TestSeeder" or "TestSeeder" will generate "TestSeeder")',
      demandOption: true,
    });
    return args as Argv<CreateSeederCommandArgs>;
  };

  /**
   * @inheritDoc
   */
  async handler(args: ArgumentsCamelCase<CreateSeederCommandArgs>) {
    const className = CreateSeederCommand.getSeederClassName(args.seeder);
    const orm = await CLIHelper.getORM(args.contextName, args.config);
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
