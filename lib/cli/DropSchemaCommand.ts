import yargs, { Arguments, Argv, CommandModule } from 'yargs';
import chalk from 'chalk';
import { CLIHelper } from './CLIHelper';

export type Options = { dump: boolean; run: boolean; noFk: boolean };

export class DropSchemaCommand<U extends Options = Options> implements CommandModule<{}, U> {

  command = 'schema:drop';
  describe = 'Drop all tables based on current metadata';

  builder(args: Argv) {
    return CLIHelper.configureSchemaCommand(args) as Argv<U>;
  }

  async handler(args: Arguments<U>) {
    if (!args.run && !args.dump) {
      yargs.showHelp();
      return;
    }

    const orm = await CLIHelper.getORM();
    const generator = orm.getSchemaGenerator();

    if (args.dump) {
      const dump = await generator.getDropSchemaSQL(args.noFk);
      // tslint:disable-next-line:no-console
      console.log(dump);
    } else {
      await generator.dropSchema(args.noFk);
      // tslint:disable-next-line:no-console
      console.log(chalk.green('Schema successfully dropped') + '\n');
    }

    await orm.close(true);
  }

}
