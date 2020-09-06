import c from 'ansi-colors';
import { Arguments, Argv, CommandModule } from 'yargs';
import { MigrateOptions, Migrator } from '@mikro-orm/migrations';
import { Configuration, MikroORM, Utils } from '@mikro-orm/core';
import { AbstractSqlDriver } from '@mikro-orm/knex';
import { CLIHelper } from '../CLIHelper';

export class MigrationCommandFactory {

  static readonly DESCRIPTIONS = {
    create: 'Create new migration with current schema diff',
    up: 'Migrate up to the latest version',
    down: 'Migrate one step down',
    list: 'List all executed migrations',
    pending: 'List all pending migrations',
  };

  static create<U extends Options = Options>(command: MigratorMethod): CommandModule<unknown, U> & { builder: (args: Argv) => Argv<U>; handler: (args: Arguments<U>) => Promise<void> } {
    return {
      command: `migration:${command}`,
      describe: MigrationCommandFactory.DESCRIPTIONS[command],
      builder: (args: Argv) => MigrationCommandFactory.configureMigrationCommand(args, command) as Argv<U>,
      handler: (args: Arguments<U>) => MigrationCommandFactory.handleMigrationCommand(args, command),
    };
  }

  static configureMigrationCommand(args: Argv, method: MigratorMethod) {
    if (method === 'create') {
      this.configureCreateCommand(args);
    }

    if (['up', 'down'].includes(method)) {
      this.configureUpDownCommand(args, method);
    }

    return args;
  }

  private static configureUpDownCommand(args: Argv, method: MigratorMethod) {
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

  private static configureCreateCommand(args: Argv) {
    args.option('b', {
      alias: 'blank',
      type: 'boolean',
      desc: 'Create blank migration',
    });
    args.option('i', {
      alias: 'initial',
      type: 'boolean',
      desc: 'Create initial migration',
    });
    args.option('d', {
      alias: 'dump',
      type: 'boolean',
      desc: 'Dumps all queries to console',
    });
    args.option('p', {
      alias: 'path',
      type: 'string',
      desc: 'Sets path to directory where to save entities',
    });
  }

  static async handleMigrationCommand(args: Arguments<Options>, method: MigratorMethod): Promise<void> {
    const options = { pool: { min: 1, max: 1 } } as Partial<Configuration>;
    const orm = await CLIHelper.getORM(undefined, options) as MikroORM<AbstractSqlDriver>;
    const migrator = new Migrator(orm.em);

    switch (method) {
      case 'create':
        await this.handleCreateCommand(migrator, args, orm.config);
        break;
      case 'list':
        await this.handleListCommand(migrator);
        break;
      case 'pending':
        await this.handlePendingCommand(migrator);
        break;
      case 'up':
      case 'down':
        await this.handleUpDownCommand(args, migrator, method);
    }

    await orm.close(true);
  }

  private static async handleUpDownCommand(args: Arguments<Options>, migrator: Migrator, method: MigratorMethod) {
    const opts = MigrationCommandFactory.getUpDownOptions(args);
    await migrator[method](opts as string[]);
    const message = this.getUpDownSuccessMessage(method as 'up' | 'down', opts);
    CLIHelper.dump(c.green(message));
  }

  private static async handlePendingCommand(migrator: Migrator) {
    const pending = await migrator.getPendingMigrations();
    CLIHelper.dumpTable({
      columns: ['Name'],
      rows: pending.map(row => [row.file.replace(/\.[jt]s$/, '')]),
      empty: 'No pending migrations',
    });
  }

  private static async handleListCommand(migrator: Migrator) {
    const executed = await migrator.getExecutedMigrations();

    CLIHelper.dumpTable({
      columns: ['Name', 'Executed at'],
      rows: executed.map(row => [row.name.replace(/\.[jt]s$/, ''), row.executed_at.toISOString()]),
      empty: 'No migrations executed yet',
    });
  }

  private static async handleCreateCommand(migrator: Migrator, args: Arguments<Options>, config: Configuration): Promise<void> {
    const ret = await migrator.createMigration(args.path, args.blank, args.initial);

    if (ret.diff.length === 0) {
      return CLIHelper.dump(c.green(`No changes required, schema is up-to-date`));
    }

    if (args.dump) {
      CLIHelper.dump(c.green('Creating migration with following queries:'));
      CLIHelper.dump(ret.diff.map(sql => '  ' + sql).join('\n'), config);
    }

    CLIHelper.dump(c.green(`${ret.fileName} successfully created`));
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

    if (options.to === 0) {
      const v = { down: 'first', up: 'latest' }[method];
      return `${msg} to the ${v} version`;
    }

    if (method === 'up' && Utils.isEmpty(options)) {
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
type GenerateOptions = { dump?: boolean; blank?: boolean; initial?: boolean; path?: string; disableFkChecks?: boolean };
type Options = GenerateOptions & CliUpDownOptions;
