import { colors } from '@mikro-orm/core';
import type { ArgumentsCamelCase, Argv } from 'yargs';
import type { BaseArgs, BaseCommand } from '../CLIConfigurator.js';
import { CLIHelper } from '../CLIHelper.js';

export class SchemaCommandFactory {

  static readonly DESCRIPTIONS = {
    create: 'Create database schema based on current metadata',
    update: 'Update database schema based on current metadata',
    drop: 'Drop database schema based on current metadata',
    fresh: 'Drop and recreate database schema based on current metadata',
  } as const;

  static readonly SUCCESS_MESSAGES = {
    create: 'Schema successfully created',
    update: 'Schema successfully updated',
    drop: 'Schema successfully dropped',
    fresh: 'Schema successfully dropped and recreated',
  } as const;

  static create<const T extends SchemaMethod>(command: T) {
    const successMessage = SchemaCommandFactory.SUCCESS_MESSAGES[command];

    return {
      command: `schema:${command}`,
      describe: SchemaCommandFactory.DESCRIPTIONS[command],
      builder: (args: Argv<BaseArgs>) => SchemaCommandFactory.configureSchemaCommand(args, command),
      handler: (args: ArgumentsCamelCase<OptionsMap[T]>) => SchemaCommandFactory.handleSchemaCommand(args as ArgumentsCamelCase<Options>, command, successMessage),
    } satisfies BaseCommand<OptionsMap[T]>;
  }

  static configureSchemaCommand<const T extends SchemaMethod>(args: Argv<BaseArgs>, command: T): Argv<OptionsMap[T]> {
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

    return args as Argv<OptionsMap[T]>;
  }

  static async handleSchemaCommand(args: ArgumentsCamelCase<Options>, method: SchemaMethod, successMessage: string): Promise<void> {
    if (!args.run && !args.dump) {
      return CLIHelper.showHelp();
    }

    const orm = await CLIHelper.getORM(args.contextName, args.config);
    const generator = orm.getSchemaGenerator();
    const params = { wrap: args.fkChecks == null ? undefined : !args.fkChecks, ...args };

    if (args.dump) {
      const m = `get${method.substr(0, 1).toUpperCase()}${method.substr(1)}SchemaSQL` as 'getCreateSchemaSQL' | 'getUpdateSchemaSQL' | 'getDropSchemaSQL';
      const dump = await generator[m](params);

      /* v8 ignore next 3 */
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

    if (typeof args.seed !== 'undefined') {
      const seeder = orm.getSeeder();
      await seeder.seedString(args.seed || orm.config.get('seeder').defaultSeeder!);
    }

    CLIHelper.dump(colors.green(successMessage));
    await orm.close(true);
  }

}

type SchemaOptions = BaseArgs & {
  run?: boolean;
  schema?: string;
};

type NonFreshOptions = SchemaOptions & {
  dump?: boolean;
  fkChecks?: boolean;
};

export type SchemaCreateOptions = NonFreshOptions & {
  seed?: string;
};

export type SchemaUpdateOptions = NonFreshOptions & {
  safe?: boolean;
  dropTables?: boolean;
};

export type SchemaDropOptions = NonFreshOptions & {
  dropDb?: boolean;
};

export type SchemaFreshOptions = SchemaOptions & Omit<SchemaCreateOptions & SchemaDropOptions, keyof NonFreshOptions>;

type OptionsMap = {
  create: SchemaCreateOptions;
  update: SchemaUpdateOptions;
  drop: SchemaDropOptions;
  fresh: SchemaFreshOptions;
};

type SchemaMethod = keyof OptionsMap;

export type Options = SchemaCreateOptions & SchemaUpdateOptions & SchemaDropOptions & SchemaFreshOptions;
