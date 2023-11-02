import type { ArgumentsCamelCase, Argv, CommandModule } from 'yargs';
import { colors } from '@mikro-orm/core';
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

  static create<U extends Options = Options>(command: SchemaMethod): CommandModule<unknown, U> & { builder: (args: Argv) => Argv<U>; handler: (args: ArgumentsCamelCase<U>) => Promise<void> } {
    const successMessage = SchemaCommandFactory.SUCCESS_MESSAGES[command];

    return {
      command: `schema:${command}`,
      describe: SchemaCommandFactory.DESCRIPTIONS[command],
      builder: (args: Argv) => SchemaCommandFactory.configureSchemaCommand(args, command) as Argv<U>,
      handler: (args: ArgumentsCamelCase<U>) => SchemaCommandFactory.handleSchemaCommand(args, command, successMessage),
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

    args.option('schema', {
      type: 'string',
      desc: 'Set the current schema for wildcard schema entities',
    });

    if (['create', 'fresh'].includes(command)) {
      args.option('seed', {
        type: 'string',
        desc: 'Allows to seed the database on create or drop and recreate',
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
    }

    if (['drop', 'fresh'].includes(command)) {
      args.option('drop-db', {
        type: 'boolean',
        desc: 'Drop the whole database',
      });
    }

    return args;
  }

  static async handleSchemaCommand(args: ArgumentsCamelCase<Options>, method: SchemaMethod, successMessage: string) {
    if (!args.run && !args.dump) {
      return CLIHelper.showHelp();
    }

    const orm = await CLIHelper.getORM();
    const generator = orm.getSchemaGenerator();
    const params = { wrap: args.fkChecks == null ? undefined : !args.fkChecks, ...args };

    if (args.dump) {
      const m = `get${method.substr(0, 1).toUpperCase()}${method.substr(1)}SchemaSQL` as 'getCreateSchemaSQL' | 'getUpdateSchemaSQL' | 'getDropSchemaSQL';
      const dump = await generator[m](params);

      /* istanbul ignore next */
      if (dump) {
        CLIHelper.dump(dump, orm.config);
        successMessage = '';
      } else {
        successMessage = 'Schema is up-to-date';
      }
    } else if (method === 'fresh') {
      await generator.dropSchema(params);
      await generator.createSchema(params);
    } else {
      const m = method + 'Schema' as 'createSchema';
      await generator[m](params);
    }

    if (args.seed !== undefined) {
      const seeder = orm.getSeeder();
      await seeder.seedString(args.seed || orm.config.get('seeder').defaultSeeder!);
    }

    CLIHelper.dump(colors.green(successMessage));
    await orm.close(true);
  }

}

type SchemaMethod = 'create' | 'update' | 'drop' | 'fresh';

export type Options = {
  dump: boolean;
  run: boolean;
  fkChecks: boolean;
  dropMigrationsTable: boolean;
  dropDb: boolean;
  dropTables: boolean;
  safe: boolean;
  seed: string;
  schema: string;
};
