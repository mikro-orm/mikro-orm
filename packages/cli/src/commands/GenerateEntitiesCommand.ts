import type { ArgumentsCamelCase, Argv } from 'yargs';
import type { BaseArgs, BaseCommand } from '../CLIConfigurator.js';
import { CLIHelper } from '../CLIHelper.js';

export type GenerateEntitiesArgs = BaseArgs & { dump?: boolean; save?: boolean; path?: string; schema?: string };

export class GenerateEntitiesCommand implements BaseCommand<GenerateEntitiesArgs> {

  command = 'generate-entities';
  describe = 'Generate entities based on current database schema';

  /**
   * @inheritDoc
   */
  builder(args: Argv) {
    args.option('s', {
      alias: 'save',
      type: 'boolean',
      desc: 'Saves entities to directory defined by --path',
    });
    args.option('d', {
      alias: 'dump',
      type: 'boolean',
      desc: 'Dumps all entities to console',
    });
    args.option('p', {
      alias: 'path',
      type: 'string',
      desc: 'Sets path to directory where to save entities',
    });
    args.option('schema', {
      type: 'string',
      desc: 'Generates entities only for given schema',
    });

    return args as unknown as Argv<GenerateEntitiesArgs>;
  }

  /**
   * @inheritDoc
   */
  async handler(args: ArgumentsCamelCase<GenerateEntitiesArgs>): Promise<void> {
    if (!args.save && !args.dump) {
      return CLIHelper.showHelp();
    }

    const orm = await CLIHelper.getORM(args.contextName, args.config, { discovery: { warnWhenNoEntities: false } });
    const dump = await orm.entityGenerator.generate({
      save: args.save,
      path: args.path,
      schema: args.schema,
    });

    if (args.dump) {
      CLIHelper.dump(dump.join('\n\n'));
    }

    await orm.close(true);
  }

}
