import type { Arguments, Argv, CommandModule } from 'yargs';
import type { EntityManager } from '@mikro-orm/knex';
import { CLIHelper } from '../CLIHelper';

export type Options = { dump: boolean; save: boolean; path: string; schema: string };

export class GenerateEntitiesCommand<U extends Options = Options> implements CommandModule<unknown, U> {

  command = 'generate-entities';
  describe = 'Generate entities based on current database schema';

  /**
   * @inheritdoc
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

    return args as unknown as Argv<U>;
  }

  /**
   * @inheritdoc
   */
  async handler(args: Arguments<U>): Promise<void> {
    if (!args.save && !args.dump) {
      return CLIHelper.showHelp();
    }

    const orm = await CLIHelper.getORM(false);
    const { EntityGenerator } = await import('@mikro-orm/entity-generator');
    const generator = new EntityGenerator(orm.em as EntityManager);
    const dump = await generator.generate({ save: args.save, baseDir: args.path, schema: args.schema });

    if (args.dump) {
      CLIHelper.dump(dump.join('\n\n'));
    }

    await orm.close(true);
  }

}
