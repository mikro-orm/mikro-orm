import yargs, { Arguments, Argv, CommandModule } from 'yargs';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { EntityManager } from '@mikro-orm/knex';
import { CLIHelper } from '../CLIHelper';

export type Options = { dump: boolean; save: boolean; path: string };

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

    return args as unknown as Argv<U>;
  }

  /**
   * @inheritdoc
   */
  async handler(args: Arguments<U>): Promise<void> {
    if (!args.save && !args.dump) {
      return void yargs.showHelp();
    }

    const orm = await CLIHelper.getORM(false);
    const generator = new EntityGenerator(orm.em as EntityManager);
    const dump = await generator.generate({ save: args.save, baseDir: args.path });

    if (args.dump) {
      CLIHelper.dump(dump.join('\n\n'));
    }

    await orm.close(true);
  }

}
