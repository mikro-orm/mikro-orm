import yargs, { Argv } from 'yargs';
import { pathExists } from 'fs-extra';

import { MikroORM } from '../MikroORM';
import { Configuration, Utils } from '../utils';
import { ClearCacheCommand } from './ClearCacheCommand';
import { GenerateEntitiesCommand } from './GenerateEntitiesCommand';
import { CreateSchemaCommand } from './CreateSchemaCommand';
import { UpdateSchemaCommand } from './UpdateSchemaCommand';
import { DropSchemaCommand } from './DropSchemaCommand';

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

  static async getORM(): Promise<MikroORM> {
    const options = await CLIHelper.getConfiguration();
    const settings = await CLIHelper.getSettings();

    if (settings.useTsNode) {
      options.set('tsNode', true);
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
      .command(new CreateSchemaCommand())
      .command(new DropSchemaCommand())
      .command(new UpdateSchemaCommand())
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

  static configureSchemaCommand(args: Argv) {
    args.option('r', {
      alias: 'run',
      type: 'boolean',
      desc: 'Runs queries',
    });
    args.option('d', {
      alias: 'dump',
      type: 'boolean',
      desc: 'Dumps all queries to console',
    });
    args.option('no-fk', {
      type: 'boolean',
      desc: 'Disable foreign key checks if possible',
      default: true,
    });

    return args;
  }

  private static async getConfigPaths(): Promise<string[]> {
    const paths: string[] = [];

    if (await pathExists(process.cwd() + '/package.json')) {
      const config = require(process.cwd() + '/package.json');
      const settings = config['mikro-orm'] as Settings;
      paths.push(...(settings.configPaths || []));
    }

    return [...paths, process.env.MIKRO_ORM_CLI || './cli-config'];
  }

}

export interface Settings {
  useTsNode?: boolean;
  configPaths?: string[];
}
