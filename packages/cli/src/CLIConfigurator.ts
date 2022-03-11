import type { Argv } from 'yargs';
import yargs, {CommandModule} from 'yargs';

import {ConfigurationLoader, Utils} from '@mikro-orm/core';
import { ClearCacheCommand } from './commands/ClearCacheCommand';
import { DatabaseSeedCommand } from './commands/DatabaseSeedCommand';
import { DebugCommand } from './commands/DebugCommand';
import { GenerateCacheCommand } from './commands/GenerateCacheCommand';
import { GenerateEntitiesCommand } from './commands/GenerateEntitiesCommand';
import { ImportCommand } from './commands/ImportCommand';
import { MigrationCommandFactory } from './commands/MigrationCommandFactory';
import { SchemaCommandFactory } from './commands/SchemaCommandFactory';
import { CreateSeederCommand } from './commands/CreateSeederCommand';
import { CreateDatabaseCommand } from './commands/CreateDatabaseCommand';
import {CLIHelper} from "./CLIHelper";
import {ConfigProvider, OrmProvider} from "./commands/typings";

/**
 * @internal
 */
export class CLIConfigurator {

  static async configure(): Promise<Argv> {
    await ConfigurationLoader.checkPackageVersion();
    const settings = await ConfigurationLoader.getSettings();
    const version = await Utils.getORMVersion();

    if (settings.useTsNode) {
      await ConfigurationLoader.registerTsNode(settings.tsConfigPath);
    }

    const yargsInstance = yargs.scriptName('mikro-orm')
      .version(version)
      .usage('Usage: $0 <command> [options]')


    CLIConfigurator.createOrmCommands(() => CLIHelper.getORM())
      .forEach(command => yargsInstance.command(command))

    CLIConfigurator.createConfigCommands(() => CLIHelper.getConfiguration())
      .forEach(command => yargsInstance.command(command))

    yargsInstance.command(new DebugCommand())
    yargsInstance.example('$0 schema:update --run', 'Runs schema synchronization')
      .alias('v', 'version')
      .alias('h', 'help')

    // noinspection HtmlDeprecatedTag
    return yargsInstance
      .recommendCommands()
      .strict();
  }

  /**
   * @internal
   */
  static createConfigCommands(configProvider: ConfigProvider): CommandModule[] {
    return [
      new ClearCacheCommand(configProvider),
      new GenerateCacheCommand(configProvider),
    ]
  }

  /**
   * @internal
   */
  static createOrmCommands(ormProvider: OrmProvider<any>): CommandModule[] {
    return [
      new GenerateEntitiesCommand(ormProvider),
      new CreateDatabaseCommand(ormProvider),
      new ImportCommand(ormProvider),
      new DatabaseSeedCommand(ormProvider),
      new CreateSeederCommand(ormProvider),
      SchemaCommandFactory.create('create', ormProvider),
      SchemaCommandFactory.create('drop', ormProvider),
      SchemaCommandFactory.create('update', ormProvider),
      SchemaCommandFactory.create('fresh', ormProvider),
      MigrationCommandFactory.create('create', ormProvider),
      MigrationCommandFactory.create('up', ormProvider),
      MigrationCommandFactory.create('down', ormProvider),
      MigrationCommandFactory.create('list', ormProvider),
      MigrationCommandFactory.create('pending', ormProvider),
      MigrationCommandFactory.create('fresh', ormProvider)
    ] as any
  }

}
