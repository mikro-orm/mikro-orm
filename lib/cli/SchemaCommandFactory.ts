import yargs, { Arguments, Argv, CommandModule } from 'yargs';
import chalk from 'chalk';
import { CLIHelper } from './CLIHelper';

export type Options = { dump: boolean; run: boolean; fkChecks: boolean };

export class SchemaCommandFactory {

  static readonly DESCRIPTIONS = {
    create: 'Create database schema based on current metadata',
    update: 'Update database schema based on current metadata',
    drop: 'Drop database schema based on current metadata',
  };

  static readonly SUCCESS_MESSAGES = {
    create: 'Schema successfully created',
    update: 'Schema successfully updated',
    drop: 'Schema successfully dropped',
  };

  static create<U extends Options = Options>(command: 'create' | 'update' | 'drop'): CommandModule<{}, U> & { builder: (args: Argv) => Argv<U>; handler: (args: Arguments<U>) => Promise<void> } {
    const successMessage = SchemaCommandFactory.SUCCESS_MESSAGES[command];

    return {
      command: `schema:${command}`,
      describe: SchemaCommandFactory.DESCRIPTIONS[command],
      builder: (args: Argv) => SchemaCommandFactory.configureSchemaCommand(args) as Argv<U>,
      handler: (args: Arguments<U>) => SchemaCommandFactory.handleSchemaCommand(args, command, successMessage),
    };
  }

  static configureSchemaCommand(args: Argv) {
    args.option('r', {
      alias: 'run',
      type: 'boolean',
      desc: 'Runs queries',
    });
    args.option('d', {
      alias: 'dump',
      type: 'boolean',
      desc: 'Dumps all queries to console',
    });
    args.option('fk-checks', {
      type: 'boolean',
      desc: 'Do not skip foreign key checks',
    });

    return args;
  }

  static async handleSchemaCommand(args: Arguments<{ dump: boolean; run: boolean; fkChecks: boolean }>, method: 'create' | 'update' | 'drop', successMessage: string) {
    if (!args.run && !args.dump) {
      yargs.showHelp();
      return;
    }

    const orm = await CLIHelper.getORM();
    const generator = orm.getSchemaGenerator();

    if (args.dump) {
      const m = `get${method.substr(0, 1).toUpperCase()}${method.substr(1)}SchemaSQL`;
      const dump = await generator[m](!args.fkChecks);
      CLIHelper.dump(dump, orm.config, 'sql');
    } else {
      const m = method + 'Schema';
      await generator[m](!args.fkChecks);
      CLIHelper.dump(chalk.green(successMessage));
    }

    await orm.close(true);
  }

}
