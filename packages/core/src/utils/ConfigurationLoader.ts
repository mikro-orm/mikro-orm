import { pathExists, readFile } from 'fs-extra';
import { join, isAbsolute } from 'path';
import stripJsonComments from 'strip-json-comments';
import { IDatabaseDriver } from '../drivers';
import { Configuration } from './Configuration';
import { Utils } from './Utils';
import { Dictionary } from '../typings';

export class ConfigurationLoader {

  static async getConfiguration<D extends IDatabaseDriver = IDatabaseDriver>(validate = true, options: Partial<Configuration> = {}): Promise<Configuration<D>> {
    const paths = await ConfigurationLoader.getConfigPaths();

    for (let path of paths) {
      path = Utils.absolutePath(path);
      path = Utils.normalizePath(path);

      if (await pathExists(path)) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const config = require(path);
        return new Configuration({ ...(config.default || config), ...options }, validate);
      }
    }

    throw new Error(`MikroORM config file not found in ['${paths.join(`', '`)}']`);
  }

  static async getPackageConfig(): Promise<Dictionary> {
    if (await pathExists(process.cwd() + '/package.json')) {
      return require(process.cwd() + '/package.json');
    }

    return {};
  }

  static async getSettings(): Promise<Settings> {
    const config = await ConfigurationLoader.getPackageConfig();
    return config['mikro-orm'] || {};
  }

  static async getConfigPaths(): Promise<string[]> {
    const paths: string[] = [];
    const settings = await ConfigurationLoader.getSettings();

    if (process.env.MIKRO_ORM_CLI) {
      paths.push(process.env.MIKRO_ORM_CLI);
    }

    paths.push(...(settings.configPaths || []));

    if (settings.useTsNode) {
      paths.push('./mikro-orm.config.ts');
    }

    paths.push('./mikro-orm.config.js');
    const tsNode = Utils.detectTsNode();
    const tsJest = settings.useTsJest && await Utils.detectTsJest();

    return paths.filter(p => p.endsWith('.js') || tsNode || tsJest);
  }

  static async registerTsNode(configPath = 'tsconfig.json'): Promise<void> {
    const tsConfigPath = isAbsolute(configPath) ? configPath : join(process.cwd(), configPath);

    Utils.requireFrom('ts-node', tsConfigPath).register({
      project: tsConfigPath,
      transpileOnly: true,
    });

    if (await pathExists(tsConfigPath)) {
      const tsConfig = await this.getTsConfig(tsConfigPath);
      /* istanbul ignore next */
      const paths = tsConfig.compilerOptions?.paths;

      if (paths) {
        Utils.requireFrom('tsconfig-paths', tsConfigPath).register({
          baseUrl: tsConfig.compilerOptions.baseUrl,
          paths: tsConfig.compilerOptions.paths,
        });
      }
    }
  }

  static async getTsConfig(tsConfigPath: string): Promise<Dictionary> {
    const json = await readFile(tsConfigPath);
    return JSON.parse(stripJsonComments(json.toString()));
  }

}

export interface Settings {
  useTsNode?: boolean;
  useTsJest?: boolean;
  tsConfigPath?: string;
  configPaths?: string[];
}
