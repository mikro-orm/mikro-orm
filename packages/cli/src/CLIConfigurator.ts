import { ConfigurationLoader, Utils } from '@mikro-orm/core';
import yargs, { type CommandModule } from 'yargs';
import { ClearCacheCommand } from './commands/ClearCacheCommand';
import { CreateDatabaseCommand } from './commands/CreateDatabaseCommand';
import { CreateSeederCommand } from './commands/CreateSeederCommand';
import { DatabaseSeedCommand } from './commands/DatabaseSeedCommand';
import { DebugCommand } from './commands/DebugCommand';
import { GenerateCacheCommand } from './commands/GenerateCacheCommand';
import { GenerateEntitiesCommand } from './commands/GenerateEntitiesCommand';
import { ImportCommand } from './commands/ImportCommand';
import { MigrationCommandFactory } from './commands/MigrationCommandFactory';
import { SchemaCommandFactory } from './commands/SchemaCommandFactory';

/**
 * @internal
 */
export type BaseArgs = Awaited<ReturnType<typeof CLIConfigurator['createBasicConfig']>['argv']>;

/**
 * @internal
 */
export interface BaseCommand<CommandArgs extends BaseArgs = BaseArgs> extends CommandModule<BaseArgs, CommandArgs> {}

/**
 * @internal
 */
export class CLIConfigurator {

  private static createBasicConfig() {
    return yargs
      .scriptName('mikro-orm')
      .usage('Usage: $0 <command> [options]')
      .example('$0 schema:update --run', 'Runs schema synchronization')
      .option('config', {
        type: 'string',
        array: true,
        desc: `Set path to the ORM configuration file`,
      })
      .option('contextName', {
        alias: 'context',
        type: 'string',
        desc: 'Set name of config to load out of the ORM configuration file. Used when config file exports an array or a function',
        default: process.env.MIKRO_ORM_CONTEXT_NAME ?? 'default',
      })
      .alias('v', 'version')
      .alias('h', 'help')
      .recommendCommands()
      .strict();
  }

  static configure() {
    ConfigurationLoader.checkPackageVersion();
    const settings = ConfigurationLoader.getSettings();
    const version = Utils.getORMVersion();

    if (settings.useTsNode !== false) {
      const preferTs = ConfigurationLoader.registerTsNode(settings.tsConfigPath);

      /* istanbul ignore if */
      if (!preferTs) {
        process.env.MIKRO_ORM_CLI_USE_TS_NODE ??= '0';
      }
    }

    return CLIConfigurator.createBasicConfig()
      .version(version)
      .command(new ClearCacheCommand())
      .command(new GenerateCacheCommand())
      .command(new GenerateEntitiesCommand())
      .command(new CreateDatabaseCommand())
      .command(new ImportCommand())
      .command(new DatabaseSeedCommand())
      .command(new CreateSeederCommand())
      .command(SchemaCommandFactory.create('create'))
      .command(SchemaCommandFactory.create('drop'))
      .command(SchemaCommandFactory.create('update'))
      .command(SchemaCommandFactory.create('fresh'))
      .command(MigrationCommandFactory.create('create'))
      .command(MigrationCommandFactory.create('up'))
      .command(MigrationCommandFactory.create('down'))
      .command(MigrationCommandFactory.create('list'))
      .command(MigrationCommandFactory.create('check'))
      .command(MigrationCommandFactory.create('pending'))
      .command(MigrationCommandFactory.create('fresh'))
      .command(new DebugCommand());
  }

}
