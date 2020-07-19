import yargs, { Arguments, Argv, CommandModule } from 'yargs';
import c from 'ansi-colors';
import { MikroORM } from '@mikro-orm/core';
import { AbstractSqlDriver, SchemaGenerator } from '@mikro-orm/knex';
import { CLIHelper } from '../CLIHelper';

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

  static create<U extends Options = Options>(command: 'create' | 'update' | 'drop'): CommandModule<unknown, U> & { builder: (args: Argv) => Argv<U>; handler: (args: Arguments<U>) => Promise<void> } {
    const successMessage = SchemaCommandFactory.SUCCESS_MESSAGES[command];

    return {
      command: `schema:${command}`,
      describe: SchemaCommandFactory.DESCRIPTIONS[command],
      builder: (args: Argv) => SchemaCommandFactory.configureSchemaCommand(args, command) as Argv<U>,
      handler: (args: Arguments<U>) => SchemaCommandFactory.handleSchemaCommand(args, command, successMessage),
    };
  }

  static configureSchemaCommand(args: Argv, command: 'create' | 'update' | 'drop') {
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

    if (command === 'update') {
      args.option('safe', {
        type: 'boolean',
        desc: 'Allows to disable table and column dropping',
        default: false,
      });
      args.option('drop-tables', {
        type: 'boolean',
        desc: 'Allows to disable table dropping',
        default: true,
      });
    }

    if (command === 'drop') {
      args.option('drop-migrations-table', {
        type: 'boolean',
        desc: 'Drop also migrations table',
      });
      args.option('drop-db', {
        type: 'boolean',
        desc: 'Drop the whole database',
      });
    }

    return args;
  }

  static async handleSchemaCommand(args: Arguments<Options>, method: 'create' | 'update' | 'drop', successMessage: string) {
    if (!args.run && !args.dump) {
      yargs.showHelp();
      return;
    }

    const orm = await CLIHelper.getORM() as MikroORM<AbstractSqlDriver>;
    const generator = new SchemaGenerator(orm.em);
    const params = SchemaCommandFactory.getOrderedParams(args, method);

    if (args.dump) {
      const m = `get${method.substr(0, 1).toUpperCase()}${method.substr(1)}SchemaSQL`;
      const dump = await generator[m](...params);
      CLIHelper.dump(dump, orm.config, 'sql');
    } else {
      const m = method + 'Schema';
      await generator[m](...params);
      CLIHelper.dump(c.green(successMessage));
    }

    await orm.close(true);
  }

  private static getOrderedParams(args: Arguments<Options>, method: 'create' | 'update' | 'drop'): any[] {
    const ret: any[] = [!args.fkChecks];

    if (method === 'update') {
      ret.push(args.safe, args.dropTables);
    }

    if (method === 'drop') {
      ret.push(args.dropMigrationsTable);

      if (!args.dump) {
        ret.push(args.dropDb);
      }
    }

    return ret;
  }

}

export type Options = { dump: boolean; run: boolean; fkChecks: boolean; dropMigrationsTable: boolean; dropDb: boolean; dropTables: boolean; safe: boolean };
