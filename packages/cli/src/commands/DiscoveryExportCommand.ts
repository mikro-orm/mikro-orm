import { writeFileSync } from 'node:fs';
import { basename, dirname, relative, resolve } from 'node:path';
import type { ArgumentsCamelCase, Argv } from 'yargs';
import { colors, type Configuration, EntitySchema, MetadataStorage } from '@mikro-orm/core';
import { fs } from '@mikro-orm/core/fs-utils';
import type { BaseArgs, BaseCommand } from '../CLIConfigurator.js';
import { CLIHelper } from '../CLIHelper.js';

type DiscoveryExportArgs = BaseArgs & { path?: string[]; out?: string; dump?: boolean };

interface DiscoveredExport {
  exportName: string;
  filePath: string;
  isDefault: boolean;
}

const driverPackageMap: Record<string, string> = {
  PostgreSqlDriver: '@mikro-orm/postgresql',
  MySqlDriver: '@mikro-orm/mysql',
  MariaDbDriver: '@mikro-orm/mariadb',
  SqliteDriver: '@mikro-orm/sqlite',
  LibSqlDriver: '@mikro-orm/libsql',
  MsSqlDriver: '@mikro-orm/mssql',
  OracleDriver: '@mikro-orm/oracledb',
};

export class DiscoveryExportCommand implements BaseCommand<DiscoveryExportArgs> {
  command = 'discovery:export';
  describe = 'Generate a TypeScript barrel file with entity exports for typed Kysely and ORM config';

  builder = (args: Argv<BaseArgs>) => {
    args.option('path', {
      alias: 'p',
      type: 'string',
      array: true,
      desc: 'Glob patterns for entity source files',
    });
    args.option('out', {
      alias: 'o',
      type: 'string',
      desc: 'Output file path (defaults to next to ORM config)',
    });
    args.option('dump', {
      alias: 'd',
      type: 'boolean',
      desc: 'Print to stdout instead of writing a file',
      default: false,
    });
    return args as Argv<DiscoveryExportArgs>;
  };

  /**
   * @inheritDoc
   */
  handler = async (args: ArgumentsCamelCase<DiscoveryExportArgs>) => {
    const config = await CLIHelper.getConfiguration(args.contextName, args.config);
    const paths = this.resolvePaths(args, config);
    const baseDir = fs.absolutePath(config.get('baseDir') ?? process.cwd());

    const discovered = await this.discoverExports(paths, baseDir);

    if (discovered.length === 0) {
      CLIHelper.dump(colors.yellow('No entities found in the specified paths.'));
      return;
    }

    const esm = CLIHelper.isESM();
    const driverPackage = this.resolveDriverPackage(config);

    if (args.dump) {
      const output = this.generateFile(discovered, process.cwd(), esm, driverPackage);
      CLIHelper.dump(output);
      return;
    }

    const outPath = await this.resolveOutputPath(args);
    const output = this.generateFile(discovered, outPath, esm, driverPackage);
    writeFileSync(outPath, output);
    CLIHelper.dump(colors.green(`Entity exports generated to ${outPath} (${discovered.length} entities)`));
    CLIHelper.dump(`\nExample usage in your ORM config:\n`);
    const importExt = esm ? '.js' : '';
    const importPath = `./${basename(outPath).replace(/\.ts$/, importExt)}`;
    CLIHelper.dump(`  import { entities } from ${colors.cyan(`'${importPath}'`)};`);
    CLIHelper.dump('');
    CLIHelper.dump('  export default defineConfig({ entities });\n');
  };

  private resolvePaths(args: ArgumentsCamelCase<DiscoveryExportArgs>, config: Configuration): string[] {
    if (args.path && args.path.length > 0) {
      return args.path;
    }

    const entitiesTs = config.get('entitiesTs', []);
    const stringPathsTs = entitiesTs.filter((p: unknown): p is string => typeof p === 'string');

    if (stringPathsTs.length > 0) {
      return stringPathsTs;
    }

    const entities = config.get('entities', []);
    const stringPaths = entities.filter((p: unknown): p is string => typeof p === 'string');

    if (stringPaths.length > 0) {
      return stringPaths;
    }

    throw new Error('No entity paths found in config. Use --path to specify entity source locations.');
  }

  private async discoverExports(paths: string[], baseDir: string): Promise<DiscoveredExport[]> {
    const normalizedPaths = paths.map(path => fs.normalizePath(path));
    const normalizedBaseDir = fs.normalizePath(baseDir);
    const files = fs.glob(normalizedPaths, normalizedBaseDir);
    const discovered: DiscoveredExport[] = [];

    for (const filepath of files) {
      const filename = basename(filepath);

      if (!/\.[cm]?[jt]s$/.exec(filename) || /\.d\.[cm]?ts/.exec(filename)) {
        continue;
      }

      // fs.glob returns paths relative to normalizedBaseDir
      const path = fs.normalizePath(baseDir, filepath);
      const exports = await fs.dynamicImport(path);
      const entries = Object.entries<any>(exports);

      // Collect entity schemas and their linked classes for dedup
      const schemaClasses = new Set<any>();
      for (const [, value] of entries) {
        if (EntitySchema.is(value) && value.meta.class) {
          schemaClasses.add(value.meta.class);
        }
      }

      for (const [key, value] of entries) {
        if (key === '__esModule') {
          continue;
        }

        const isSchema = EntitySchema.is(value);

        // Skip class implementations that are linked from an EntitySchema
        if (!isSchema && schemaClasses.has(value)) {
          continue;
        }

        const validTarget = isSchema || (value instanceof Function && MetadataStorage.isKnownEntity(value.name));

        if (!validTarget) {
          continue;
        }

        const exportName = key === 'default' ? this.inferNameFromDefault(value, isSchema) : key;

        // Avoid duplicates (e.g., default + named export of same thing)
        if (discovered.some(d => d.filePath === path && d.exportName === exportName)) {
          continue;
        }

        discovered.push({
          exportName,
          filePath: path,
          isDefault: key === 'default',
        });
      }
    }

    discovered.sort((a, b) => a.exportName.localeCompare(b.exportName));
    return discovered;
  }

  private inferNameFromDefault(value: any, isSchema: boolean): string {
    if (isSchema) {
      return value.meta.className ?? value.meta.name ?? 'DefaultEntity';
    }

    return value.name ?? 'DefaultEntity';
  }

  private async resolveOutputPath(args: ArgumentsCamelCase<DiscoveryExportArgs>): Promise<string> {
    if (args.out) {
      return resolve(args.out);
    }

    const configPaths = args.config ?? (await CLIHelper.getConfigPaths());

    for (const configPath of configPaths) {
      const absPath = fs.absolutePath(configPath);

      if (fs.pathExists(absPath)) {
        return resolve(dirname(absPath), 'entities.generated.ts');
      }
    }

    return resolve(process.cwd(), 'entities.generated.ts');
  }

  private resolveDriverPackage(config: Configuration): string {
    try {
      const driverName = config.getDriver().constructor.name;
      return driverPackageMap[driverName] ?? '@mikro-orm/sql';
    } catch {
      return '@mikro-orm/sql';
    }
  }

  private generateFile(discovered: DiscoveredExport[], outPath: string, esm: boolean, driverPackage: string): string {
    const outDir = dirname(outPath);
    const lines: string[] = [
      '// This file was generated by MikroORM CLI. Do not edit manually.',
      '// Re-run `mikro-orm discovery:export` to update.',
      '',
    ];

    // Group by file path for imports
    const byFile = new Map<string, DiscoveredExport[]>();
    for (const item of discovered) {
      const list = byFile.get(item.filePath) ?? [];
      list.push(item);
      byFile.set(item.filePath, list);
    }

    // Generate import lines
    for (const [filePath, items] of byFile) {
      let rel = relative(outDir, filePath);

      if (!rel.startsWith('.')) {
        rel = './' + rel;
      }

      // Remove .ts extension and optionally add .js for ESM
      rel = rel.replace(/\.[cm]?[jt]s$/, '');

      if (esm) {
        rel += '.js';
      }

      const defaults = items.filter(i => i.isDefault);
      const named = items.filter(i => !i.isDefault);

      for (const d of defaults) {
        lines.push(`import ${d.exportName} from '${rel}';`);
      }

      if (named.length > 0) {
        const names = named.map(n => n.exportName).join(', ');
        lines.push(`import { ${names} } from '${rel}';`);
      }
    }

    // Type imports
    lines.push(`import type { EntitySchemaWithMeta, InferKyselyDB, InferClassEntityDB } from '${driverPackage}';`);

    lines.push('');

    // entities array
    lines.push('export const entities = [');

    for (const item of discovered) {
      lines.push(`  ${item.exportName},`);
    }

    lines.push('] as const;');

    lines.push('');

    // Database type
    lines.push('export type Database = InferKyselyDB<Extract<(typeof entities)[number], EntitySchemaWithMeta>>');
    lines.push('  & InferClassEntityDB<(typeof entities)[number]>;');
    lines.push('');

    return lines.join('\n');
  }
}
