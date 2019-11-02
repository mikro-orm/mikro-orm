import { Arguments, Argv, CommandModule } from 'yargs';
import chalk from 'chalk';
import { CLIHelper } from './CLIHelper';
import { MigrateOptions } from '../migrations';
import { Utils } from '../utils';

export class MigrationCommandFactory {

  static readonly DESCRIPTIONS = {
    create: 'Create new migration with current schema diff',
    up: 'Migrate up to the latest version',
    down: 'Migrate one step down',
    list: 'List all executed migrations',
    pending: 'List all pending migrations',
  };

  static create<U extends Options = Options>(command: MigratorMethod): CommandModule<{}, U> & { builder: (args: Argv) => Argv<U>; handler: (args: Arguments<U>) => Promise<void> } {
    return {
      command: `migration:${command}`,
      describe: MigrationCommandFactory.DESCRIPTIONS[command],
      builder: (args: Argv) => MigrationCommandFactory.configureMigrationCommand(args, command) as Argv<U>,
      handler: (args: Arguments<U>) => MigrationCommandFactory.handleMigrationCommand(args, command),
    };
  }

  static configureMigrationCommand(args: Argv, method: MigratorMethod) {
    if (method === 'create') {
      args.option('b', {
        alias: 'blank',
        type: 'boolean',
        desc: 'Create blank migration',
      });
      args.option('d', {
        alias: 'dump',
        type: 'boolean',
        desc: 'Dumps all queries to console',
      });
      args.option('disable-fk-checks', {
        type: 'boolean',
        desc: 'Do not skip foreign key checks',
      });
      args.option('p', {
        alias: 'path',
        type: 'string',
        desc: 'Sets path to directory where to save entities',
      });
    }

    if (['up', 'down'].includes(method)) {
      args.option('t', {
        alias: 'to',
        type: 'string',
        desc: `Migrate ${method} to specific version`,
      });
      args.option('f', {
        alias: 'from',
        type: 'string',
        desc: 'Start migration from specific version',
      });
      args.option('o', {
        alias: 'only',
        type: 'string',
        desc: 'Migrate only specified versions',
      });
    }

    return args;
  }

  static async handleMigrationCommand(args: Arguments<Options>, method: MigratorMethod): Promise<void> {
    const orm = await CLIHelper.getORM();
    const migrator = orm.getMigrator();

    switch (method) {
      case 'create':
        const ret = await migrator.createMigration(args.path, args.blank);

        if (args.dump) {
          CLIHelper.dump(chalk.green('Creating migration with following queries:'));
          CLIHelper.dump(ret.diff.map(sql => '  ' + sql).join('\n'), orm.config, 'sql');
        }

        CLIHelper.dump(chalk.green(`${ret.fileName} successfully created`));
        break;
      case 'list':
        const executed = await migrator.getExecutedMigrations();

        CLIHelper.dumpTable({
          columns: ['Name', 'Executed at'],
          rows: executed.map(row => [row.name.replace(/\.[jt]s$/, ''), row.executed_at.toISOString()]),
          empty: 'No migrations executed yet',
        });
        break;
      case 'pending':
        const pending = await migrator.getPendingMigrations();
        CLIHelper.dumpTable({
          columns: ['Name'],
          rows: pending.map(row => [row.file.replace(/\.[jt]s$/, '')]),
          empty: 'No pending migrations',
        });
        break;
      case 'up':
      case 'down':
        const opts = MigrationCommandFactory.getUpDownOptions(args);
        await migrator[method](opts as string[]);
        const message = this.getUpDownSuccessMessage(method, opts);
        CLIHelper.dump(chalk.green(message));
    }

    await orm.close(true);
  }

  private static getUpDownOptions(flags: CliUpDownOptions): MigrateOptions {
    if (!flags.to && !flags.from && flags.only) {
      return { migrations: flags.only.split(/[, ]+/) };
    }

    const ret: MigrateOptions = {};

    ['from', 'to'].filter(k => flags[k]).forEach(k => ret[k] = flags[k] === '0' ? 0 : flags[k]);

    return ret;
  }

  private static getUpDownSuccessMessage(method: 'up' | 'down', options: MigrateOptions): string {
    const msg = `Successfully migrated ${method}`;

    if (method === 'down' && Utils.isEmpty(options)) {
      return msg + ' to previous version';
    }

    if (method === 'down' && options.to === 0) {
      return msg + ' to the first version';
    }

    if (method === 'up' && (Utils.isEmpty(options) || options.to === 0)) {
      return msg + ' to the latest version';
    }

    if (Utils.isString(options.to)) {
      return msg + ' to version ' + options.to;
    }

    if (options.migrations && options.migrations.length === 1) {
      return msg + ' to version ' + options.migrations[0];
    }

    return msg;
  }

}

type MigratorMethod = 'create' | 'up' | 'down' | 'list' | 'pending';
type CliUpDownOptions = { to?: string | number; from?: string | number; only?: string };
type GenerateOptions = { dump?: boolean; blank?: boolean; path?: string; disableFkChecks?: boolean };
type Options = GenerateOptions & CliUpDownOptions;
