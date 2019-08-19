import yargs, { Arguments, Argv, CommandModule } from 'yargs';
import chalk from 'chalk';
import { CLIHelper } from './CLIHelper';

export type Options = { dump: boolean; run: boolean; noFk: boolean };

export class CreateSchemaCommand<U extends Options = Options> implements CommandModule<{}, U> {

  command = 'schema:create';
  describe = 'Create database schema based on current metadata';

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
      const dump = await generator.getCreateSchemaSQL(args.noFk);
      // tslint:disable-next-line:no-console
      console.log(dump);
    } else {
      await generator.createSchema(args.noFk);
      // tslint:disable-next-line:no-console
      console.log(chalk.green('Schema successfully created'));
    }

    await orm.close(true);
  }

}
