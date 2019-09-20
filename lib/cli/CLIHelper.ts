import yargs, { Argv } from 'yargs';
import { pathExists } from 'fs-extra';
import highlight from 'cli-highlight';

import { MikroORM } from '../MikroORM';
import { Configuration, Utils } from '../utils';
import { ClearCacheCommand } from './ClearCacheCommand';
import { GenerateEntitiesCommand } from './GenerateEntitiesCommand';
import { SchemaCommandFactory } from './SchemaCommandFactory';

export class CLIHelper {

  static async getConfiguration(): Promise<Configuration> {
    const paths = await CLIHelper.getConfigPaths();

    for (let path of paths) {
      path = Utils.normalizePath(path);

      if (await pathExists(path)) {
        return new Configuration(require(path));
      }
    }

    throw new Error(`cli-config not found in ['${paths.join(`', '`)}']`);
  }

  static async getORM(warnWhenNoEntities?: boolean): Promise<MikroORM> {
    const options = await CLIHelper.getConfiguration();
    const settings = await CLIHelper.getSettings();
    options.getLogger().setDebugMode(false);

    if (settings.useTsNode) {
      options.set('tsNode', true);
    }

    if (Utils.isDefined(warnWhenNoEntities)) {
      options.set('warnWhenNoEntities', warnWhenNoEntities);
    }

    return MikroORM.init(options);
  }

  static async configure(): Promise<Argv> {
    const settings = await CLIHelper.getSettings();

    if (settings.useTsNode) {
      require('ts-node').register();
    }

    return yargs
      .scriptName('mikro-orm')
      .version(require('../../package.json').version)
      .usage('Usage: $0 <command> [options]')
      .example('$0 schema:update --run', 'Runs schema synchronization')
      .alias('v', 'version')
      .alias('h', 'help')
      .command(new ClearCacheCommand())
      .command(new GenerateEntitiesCommand())
      .command(SchemaCommandFactory.create('create'))
      .command(SchemaCommandFactory.create('drop'))
      .command(SchemaCommandFactory.create('update'))
      .recommendCommands()
      .strict();
  }

  private static async getSettings(): Promise<Settings> {
    if (await pathExists(process.cwd() + '/package.json')) {
      const config = require(process.cwd() + '/package.json');
      return config['mikro-orm'];
    }

    return {};
  }

  static dump(text: string, config?: Configuration, language?: string): void {
    if (config && language && config.get('highlight')) {
      text = highlight(text, { language, ignoreIllegals: true, theme: config.getHighlightTheme() });
    }

    // tslint:disable-next-line:no-console
    console.log(text);
  }

  static async getConfigPaths(): Promise<string[]> {
    const paths: string[] = [];

    if (process.env.MIKRO_ORM_CLI) {
      paths.push(process.env.MIKRO_ORM_CLI);
    }

    if (await pathExists(process.cwd() + '/package.json')) {
      const config = require(process.cwd() + '/package.json');
      const settings = config['mikro-orm'] as Settings;
      paths.push(...(settings.configPaths || []));
    }

    return [...paths, './cli-config'];
  }

}

export interface Settings {
  useTsNode?: boolean;
  configPaths?: string[];
}
