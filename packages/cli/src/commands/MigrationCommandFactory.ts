import type { ArgumentsCamelCase, Argv } from 'yargs';
import { Utils, colors, type Configuration, type Dictionary, type MikroORM, type Options, type IMigrator, type MigrateOptions } from '@mikro-orm/core';
import type { BaseArgs, BaseCommand } from '../CLIConfigurator.js';
import { CLIHelper } from '../CLIHelper.js';

export class MigrationCommandFactory {

  static readonly DESCRIPTIONS = {
    create: 'Create new migration with current schema diff',
    up: 'Migrate up to the latest version',
    down: 'Migrate one step down',
    list: 'List all executed migrations',
    check: 'Check if migrations are needed. Useful for bash scripts.',
    pending: 'List all pending migrations',
    fresh: 'Clear the database and rerun all migrations',
  };

  static create<const T extends MigratorMethod>(command: T) {
    return {
      command: `migration:${command}`,
      describe: MigrationCommandFactory.DESCRIPTIONS[command],
      builder: (args: Argv<BaseArgs>) => MigrationCommandFactory.configureMigrationCommand(args, command),
      handler: (args: ArgumentsCamelCase<MigrationOptionsMap[T]>) => MigrationCommandFactory.handleMigrationCommand(args as ArgumentsCamelCase<Opts>, command),
    } satisfies BaseCommand<MigrationOptionsMap[T]>;
  }

  static configureMigrationCommand<const T extends MigratorMethod>(args: Argv<BaseArgs>, method: T): Argv<MigrationOptionsMap[T]> {
    if (method === 'create') {
      return this.configureCreateCommand(args);
    }

    if (method === 'up' || method === 'down') {
      return this.configureUpDownCommand(args, method);
    }

    if (method === 'fresh') {
      return this.configureFreshCommand(args);
    }

    return args;
  }

  private static configureUpDownCommand(args: Argv<BaseArgs>, method: 'up' | 'down'): Argv<CliUpDownOptions> {
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

    return args as Argv<CliUpDownOptions>;
  }

  private static configureCreateCommand(args: Argv<BaseArgs>): Argv<MigratorCreateOptions> {
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
    args.option('n', {
      alias: 'name',
      type: 'string',
      desc: 'Specify custom name for the file',
    });

    return args as Argv<MigratorCreateOptions>;
  }

  static async handleMigrationCommand(args: ArgumentsCamelCase<Opts>, method: MigratorMethod): Promise<void> {
    // to be able to run have a master transaction, but run marked migrations outside of it, we need a second connection
    const options = { pool: { min: 1, max: 2 } } satisfies Options;
    const orm = await CLIHelper.getORM(args.contextName, args.config, options);
    const migrator = orm.getMigrator();

    switch (method) {
      case 'create':
        await this.handleCreateCommand(migrator, args, orm.config);
        break;
      case 'check':
        await this.handleCheckCommand(migrator, orm);
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
        break;
      case 'fresh':
        await this.handleFreshCommand(args, migrator, orm);
    }

    await orm.close(true);
  }

  private static configureFreshCommand(args: Argv<BaseArgs>): Argv<MigratorFreshOptions> {
    args.option('seed', {
      type: 'string',
      desc: 'Allows to seed the database after dropping it and rerunning all migrations',
    });
    args.option('drop-db', {
      type: 'boolean',
      desc: 'Drop the whole database',
    });

    return args as Argv<MigratorFreshOptions>;
  }

  private static async handleUpDownCommand(args: ArgumentsCamelCase<CliUpDownOptions>, migrator: IMigrator, method: 'up' | 'down') {
    const opts = MigrationCommandFactory.getUpDownOptions(args);
    await migrator[method](opts);
    const message = this.getUpDownSuccessMessage(method, opts);
    CLIHelper.dump(colors.green(message));
  }

  private static async handlePendingCommand(migrator: IMigrator) {
    const pending = await migrator.getPendingMigrations();
    CLIHelper.dumpTable({
      columns: ['Name'],
      rows: pending.map(row => [row.name]),
      empty: 'No pending migrations',
    });
  }

  private static async handleListCommand(migrator: IMigrator) {
    const executed = await migrator.getExecutedMigrations();

    CLIHelper.dumpTable({
      columns: ['Name', 'Executed at'],
      rows: executed.map(row => {
        /* v8 ignore next */
        const executedAt = (row.executed_at ?? (row as Dictionary).created_at)?.toISOString() ?? '';
        return [row.name.replace(/\.[jt]s$/, ''), executedAt];
      }),
      empty: 'No migrations executed yet',
    });
  }

  private static async handleCreateCommand(migrator: IMigrator, args: ArgumentsCamelCase<MigratorCreateOptions>, config: Configuration): Promise<void> {
    const ret = await migrator.createMigration(args.path, args.blank, args.initial, args.name);

    if (ret.diff.up.length === 0) {
      return CLIHelper.dump(colors.green(`No changes required, schema is up-to-date`));
    }

    if (args.dump) {
      CLIHelper.dump(colors.green('Creating migration with following queries:'));
      CLIHelper.dump(colors.green('up:'));
      CLIHelper.dump(ret.diff.up.map(sql => '  ' + sql).join('\n'), config);

      /* v8 ignore next 3 */
      if (config.getDriver().getPlatform().supportsDownMigrations()) {
        CLIHelper.dump(colors.green('down:'));
        CLIHelper.dump(ret.diff.down.map(sql => '  ' + sql).join('\n'), config);
      } else {
        CLIHelper.dump(colors.yellow(`(${config.getDriver().constructor.name} does not support automatic down migrations)`));
      }
    }

    CLIHelper.dump(colors.green(`${ret.fileName} successfully created`));
  }

  private static async handleCheckCommand(migrator: IMigrator, orm: MikroORM): Promise<void> {
    if (!(await migrator.checkMigrationNeeded())) {
      return CLIHelper.dump(colors.green(`No changes required, schema is up-to-date`));
    }
    await orm.close(true);
    CLIHelper.dump(colors.yellow(`Changes detected. Please create migration to update schema.`));
    process.exit(1);
  }

  private static async handleFreshCommand(args: ArgumentsCamelCase<MigratorFreshOptions>, migrator: IMigrator, orm: MikroORM) {
    const generator = orm.getSchemaGenerator();
    await generator.dropSchema({ dropMigrationsTable: true, dropDb: args.dropDb });
    CLIHelper.dump(colors.green('Dropped schema successfully'));
    const opts = MigrationCommandFactory.getUpDownOptions(args);
    await migrator.up(opts);
    const message = this.getUpDownSuccessMessage('up', opts);
    CLIHelper.dump(colors.green(message));

    if (args.seed !== undefined) {
      const seeder = orm.getSeeder();
      const seederClass = args.seed || orm.config.get('seeder').defaultSeeder!;
      await seeder.seedString(seederClass);
      CLIHelper.dump(colors.green(`Database seeded successfully with seeder class ${seederClass}`));
    }
  }

  private static getUpDownOptions(flags: CliUpDownOptions): MigrateOptions {
    if (!flags.to && !flags.from && flags.only) {
      return { migrations: flags.only.split(/[, ]+/) };
    }

    const ret: MigrateOptions = {};

    (['from', 'to'] as const).filter(k => flags[k]).forEach(k => ret[k] = flags[k] === '0' ? 0 : flags[k]);

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

type CliUpDownOptions = BaseArgs & { to?: string | number; from?: string | number; only?: string };
type MigratorFreshOptions = BaseArgs & { dropDb?: boolean; seed?: string };
type MigratorCreateOptions = BaseArgs & { blank?: boolean; initial?: boolean; path?: string; dump?: boolean;  name?: string };

type MigrationOptionsMap = {
  create: MigratorCreateOptions;
  check: BaseArgs;
  up: CliUpDownOptions;
  down: CliUpDownOptions;
  list: BaseArgs;
  pending: BaseArgs;
  fresh: MigratorFreshOptions;
};
type MigratorMethod = keyof MigrationOptionsMap;
type Opts = BaseArgs & MigratorCreateOptions & CliUpDownOptions & MigratorFreshOptions;
