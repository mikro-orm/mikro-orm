import type { ArgumentsCamelCase, Argv, CommandModule } from 'yargs';
import type { Configuration, MikroORM, Options, IMigrator, MigrateOptions } from '@mikro-orm/core';
import { Utils, colors } from '@mikro-orm/core';
import { CLIHelper } from '../CLIHelper';

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

  static create<U extends Opts = Opts>(command: MigratorMethod): CommandModule<unknown, U> & { builder: (args: Argv) => Argv<U>; handler: (args: ArgumentsCamelCase<U>) => Promise<void> } {
    return {
      command: `migration:${command}`,
      describe: MigrationCommandFactory.DESCRIPTIONS[command],
      builder: (args: Argv) => MigrationCommandFactory.configureMigrationCommand(args, command) as Argv<U>,
      handler: (args: ArgumentsCamelCase<U>) => MigrationCommandFactory.handleMigrationCommand(args, command),
    };
  }

  static configureMigrationCommand(args: Argv, method: MigratorMethod) {
    if (method === 'create') {
      this.configureCreateCommand(args);
    }

    if (['up', 'down'].includes(method)) {
      this.configureUpDownCommand(args, method);
    }

    if (method === 'fresh') {
      this.configureFreshCommand(args);
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
    args.option('name', {
      alias: 'name',
      type: 'string',
      desc: 'Specify custom name for the file',
    });
  }

  static async handleMigrationCommand(args: ArgumentsCamelCase<Opts>, method: MigratorMethod): Promise<void> {
    const options = { pool: { min: 1, max: 1 } } as Options;
    const orm = await CLIHelper.getORM(undefined, options);
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

  private static configureFreshCommand(args: Argv) {
    args.option('seed', {
      type: 'string',
      desc: 'Allows to seed the database after dropping it and rerunning all migrations',
    });
  }

  private static async handleUpDownCommand(args: ArgumentsCamelCase<Opts>, migrator: IMigrator, method: MigratorMethod) {
    const opts = MigrationCommandFactory.getUpDownOptions(args);
    await migrator[method](opts as string[]);
    const message = this.getUpDownSuccessMessage(method as 'up' | 'down', opts);
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
      rows: executed.map(row => [row.name.replace(/\.[jt]s$/, ''), row.executed_at.toISOString()]),
      empty: 'No migrations executed yet',
    });
  }

  private static async handleCreateCommand(migrator: IMigrator, args: ArgumentsCamelCase<Opts>, config: Configuration): Promise<void> {
    const ret = await migrator.createMigration(args.path, args.blank, args.initial, args.name);

    if (ret.diff.up.length === 0) {
      return CLIHelper.dump(colors.green(`No changes required, schema is up-to-date`));
    }

    if (args.dump) {
      CLIHelper.dump(colors.green('Creating migration with following queries:'));
      CLIHelper.dump(colors.green('up:'));
      CLIHelper.dump(ret.diff.up.map(sql => '  ' + sql).join('\n'), config);

      /* istanbul ignore next */
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
    if (!await migrator.checkMigrationNeeded()) {
      return CLIHelper.dump(colors.green(`No changes required, schema is up-to-date`));
    }
    await orm.close(true);
    CLIHelper.dump(colors.yellow(`Changes detected. Please create migration to update schema.`));
    process.exit(1);
  }

  private static async handleFreshCommand(args: ArgumentsCamelCase<Opts>, migrator: IMigrator, orm: MikroORM) {
    const generator = orm.getSchemaGenerator();
    await generator.dropSchema({ dropMigrationsTable: true });
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

type MigratorMethod = 'create' | 'check' | 'up' | 'down' | 'list' | 'pending' | 'fresh';
type CliUpDownOptions = { to?: string | number; from?: string | number; only?: string };
type GenerateOptions = { dump?: boolean; blank?: boolean; initial?: boolean; path?: string; disableFkChecks?: boolean; seed: string; name?: string };
type Opts = GenerateOptions & CliUpDownOptions;
