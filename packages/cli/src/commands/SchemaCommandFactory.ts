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
    fresh: 'Drop and recreate database schema based on current metadata',
  };

  static readonly SUCCESS_MESSAGES = {
    create: 'Schema successfully created',
    update: 'Schema successfully updated',
    drop: 'Schema successfully dropped',
    fresh: 'Schema successfully dropped and recreated',
  };

  static create<U extends Options = Options>(command: SchemaMethod): CommandModule<unknown, U> & { builder: (args: Argv) => Argv<U>; handler: (args: Arguments<U>) => Promise<void> } {
    const successMessage = SchemaCommandFactory.SUCCESS_MESSAGES[command];

    return {
      command: `schema:${command}`,
      describe: SchemaCommandFactory.DESCRIPTIONS[command],
      builder: (args: Argv) => SchemaCommandFactory.configureSchemaCommand(args, command) as Argv<U>,
      handler: (args: Arguments<U>) => SchemaCommandFactory.handleSchemaCommand(args, command, successMessage),
    };
  }

  static configureSchemaCommand(args: Argv, command: SchemaMethod) {
    args.option('r', {
      alias: 'run',
      type: 'boolean',
      desc: 'Runs queries',
    });
    if (command !== 'fresh') {
      args.option('d', {
        alias: 'dump',
        type: 'boolean',
        desc: 'Dumps all queries to console',
      });
      args.option('fk-checks', {
        type: 'boolean',
        desc: 'Do not skip foreign key checks',
      });
    }

    if (command === 'create' || command === 'fresh') {
      args.option('seed', {
        type: 'string',
        desc: 'Allows to seed the database on create or drop and recreate',
        default: '',
      });
    }

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

  static async handleSchemaCommand(args: Arguments<Options>, method: SchemaMethod, successMessage: string) {
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
      CLIHelper.dump(dump, orm.config);
    } else if (method === 'fresh') {
      await generator.dropSchema(...SchemaCommandFactory.getOrderedParams(args, 'drop'));
      await generator.createSchema(...SchemaCommandFactory.getOrderedParams(args, 'create'));
    } else {
      const m = method + 'Schema';
      await generator[m](...params);
    }
    if (args.seed !== undefined) {
      const seeder = orm.getSeeder();
      await seeder.seedString(args.seed || orm.config.get('seeder').defaultSeeder);
    }
    CLIHelper.dump(c.green(successMessage));
    await orm.close(true);
  }

  private static getOrderedParams(args: Arguments<Options>, method: SchemaMethod): any[] {
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

type SchemaMethod = 'create' | 'update' | 'drop' | 'fresh';
export type Options = { dump: boolean; run: boolean; fkChecks: boolean; dropMigrationsTable: boolean; dropDb: boolean; dropTables: boolean; safe: boolean; seed: string };
