import { ConfigurationLoader, Utils } from '@mikro-orm/core';
import yargs, { type CommandModule } from 'yargs';
import { ClearCacheCommand } from './commands/ClearCacheCommand.js';
import { CreateDatabaseCommand } from './commands/CreateDatabaseCommand.js';
import { CreateSeederCommand } from './commands/CreateSeederCommand.js';
import { DatabaseSeedCommand } from './commands/DatabaseSeedCommand.js';
import { DebugCommand } from './commands/DebugCommand.js';
import { GenerateCacheCommand } from './commands/GenerateCacheCommand.js';
import { GenerateEntitiesCommand } from './commands/GenerateEntitiesCommand.js';
import { ImportCommand } from './commands/ImportCommand.js';
import { MigrationCommandFactory } from './commands/MigrationCommandFactory.js';
import { SchemaCommandFactory } from './commands/SchemaCommandFactory.js';
import { CLIHelper } from './CLIHelper.js';

/**
 * @internal
 */
export type BaseArgs = Awaited<ReturnType<typeof createBasicConfig>['argv']>;

/**
 * @internal
 */
export interface BaseCommand<CommandArgs extends BaseArgs = BaseArgs> extends CommandModule<BaseArgs, CommandArgs> {}

function createBasicConfig() {
  return yargs()
    .scriptName('mikro-orm')
    .usage('Usage: $0 <command> [options]')
    .example('$0 debug', 'Show debugging information')
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
    .showHelpOnFail(true)
    .demandCommand(1, '')
    .strict();
}

export async function configure() {
  ConfigurationLoader.checkPackageVersion();
  const settings = CLIHelper.getSettings();
  const version = Utils.getORMVersion();

  if (settings.preferTs !== false) {
    const preferTs = await CLIHelper.registerTypeScriptSupport(settings.tsConfigPath, settings.tsLoader);

    /* v8 ignore next 3 */
    if (!preferTs) {
      process.env.MIKRO_ORM_CLI_PREFER_TS ??= '0';
    }
  }

  return createBasicConfig()
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
