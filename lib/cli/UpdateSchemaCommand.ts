import yargs, { Arguments, Argv, CommandModule } from 'yargs';
import chalk from 'chalk';
import { CLIHelper } from './CLIHelper';

export type Options = { dump: boolean; run: boolean; noFk: boolean };

export class UpdateSchemaCommand<U extends Options = Options> implements CommandModule<{}, U> {

  command = 'schema:update';
  describe = 'Update database schema based on current metadata';

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
      const dump = await generator.getUpdateSchemaSQL(args.noFk);
      // tslint:disable-next-line:no-console
      console.log(dump + '\n');
    } else {
      await generator.updateSchema(args.noFk);
      // tslint:disable-next-line:no-console
      console.log(chalk.green('Schema successfully updated') + '\n');
    }

    await orm.close(true);
  }

}
