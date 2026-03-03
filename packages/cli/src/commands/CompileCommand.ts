import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import type { ArgumentsCamelCase, Argv } from 'yargs';
import {
  MetadataDiscovery,
  MetadataStorage,
  Utils,
  EntityComparator,
  ObjectHydrator,
  colors,
  type Configuration,
} from '@mikro-orm/core';
import { fs } from '@mikro-orm/core/fs-utils';
import type { BaseArgs, BaseCommand } from '../CLIConfigurator.js';
import { CLIHelper } from '../CLIHelper.js';

type CompileArgs = BaseArgs & { out?: string };

export class CompileCommand implements BaseCommand<CompileArgs> {
  command = 'compile';
  describe = 'Pre-compile optimized entity functions for runtimes that prohibit eval (e.g. Cloudflare Workers)';

  builder = (args: Argv<BaseArgs>) => {
    args.option('out', {
      type: 'string',
      desc: 'Output path for the generated file (defaults to next to your ORM config)',
    });
    return args as Argv<CompileArgs>;
  };

  /**
   * @inheritDoc
   */
  async handler(args: ArgumentsCamelCase<CompileArgs>) {
    const config = await CLIHelper.getConfiguration(args.contextName, args.config);
    const settings = CLIHelper.getSettings();
    config.set('debug', !!settings.verbose);
    const metadata = await new MetadataDiscovery(
      new MetadataStorage(),
      config.getDriver().getPlatform(),
      config,
    ).discover(false);

    // Default output path to next to the ORM config file
    if (!args.out) {
      const configPaths = args.config ?? (await CLIHelper.getConfigPaths());

      for (const configPath of configPaths) {
        const absPath = fs.absolutePath(configPath);

        if (fs.pathExists(absPath)) {
          args.out = resolve(dirname(absPath), 'compiled-functions.js');
          break;
        }
      }
    }

    const captured = CompileCommand.capture(metadata, config);

    const entries = captured.map(({ key, contextKeys, code }) => {
      const params = contextKeys.join(', ');
      const indentedCode = code.replace(/\n/g, '\n    ');
      return `  '${key}': function(${params}) {\n    ${indentedCode}\n  }`;
    });

    const esm = CLIHelper.isESM();
    const version = Utils.getORMVersion();
    const output = esm
      ? `export default {\n  __version: '${version}',\n${entries.join(',\n')}\n};\n`
      : `'use strict';\nmodule.exports = {\n  __version: '${version}',\n${entries.join(',\n')}\n};\n`;
    const outPath = args.out ?? resolve(process.cwd(), 'compiled-functions.js');
    const dtsPath = outPath.replace(/\.js$/, '.d.ts');
    const dts = esm
      ? `import type { CompiledFunctions } from '@mikro-orm/core';\ndeclare const compiledFunctions: CompiledFunctions;\nexport default compiledFunctions;\n`
      : `import type { CompiledFunctions } from '@mikro-orm/core';\ndeclare const compiledFunctions: CompiledFunctions;\nexport = compiledFunctions;\n`;
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, output);
    writeFileSync(dtsPath, dts);

    CLIHelper.dump(colors.green(`Compiled functions generated to ${outPath} (${captured.length} functions)`));
    CLIHelper.dump(`\nExample usage in your ORM config:\n`);
    const importPath = esm ? './compiled-functions.js' : './compiled-functions';
    CLIHelper.dump(
      `  ${esm ? 'import' : 'const'} compiledFunctions ${esm ? 'from ' : '= require('}${colors.cyan(`'${importPath}'`)}${esm ? '' : ')'};`,
    );
    CLIHelper.dump('');
    CLIHelper.dump(`  export default defineConfig({ compiledFunctions });\n`);
  }

  static capture(metadata: MetadataStorage, config: Configuration) {
    const captured: { key: string; contextKeys: string[]; code: string }[] = [];
    const original = Utils.createFunction;
    Utils.createFunction = (context, code, _compiledFunctions, key) => {
      captured.push({ key: key!, contextKeys: [...context.keys()], code });
      return original.call(Utils, context, code);
    };

    try {
      const platform = config.getDriver().getPlatform();
      const hydrator = new ObjectHydrator(metadata, platform, config);
      const comparator = new EntityComparator(metadata, platform, config);

      for (const meta of metadata) {
        hydrator.getEntityHydrator(meta, 'full', false);
        hydrator.getEntityHydrator(meta, 'full', true);
        comparator.getEntityComparator(meta.class);
        comparator.getSnapshotGenerator(meta.class);
        comparator.getResultMapper(meta);

        if (!meta.embeddable && !meta.virtual) {
          hydrator.getEntityHydrator(meta, 'reference', false);
          hydrator.getEntityHydrator(meta, 'reference', true);
        }

        if (meta.primaryKeys.length > 0) {
          comparator.getPkGetter(meta);
          comparator.getPkGetterConverted(meta);
          comparator.getPkSerializer(meta);
        }
      }
    } finally {
      Utils.createFunction = original;
    }

    return captured;
  }
}
