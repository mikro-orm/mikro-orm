import yargs, { Arguments, Argv, CommandModule } from 'yargs';
import { CLIHelper } from './CLIHelper';

export type Options = { dump: boolean; save: boolean; path: string };

export class GenerateEntitiesCommand<U extends Options = Options> implements CommandModule<{}, U> {

  command = 'generate-entities';
  describe = 'Generate entities based on current database schema';

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

  async handler(args: Arguments<U>) {
    if (!args.save && !args.dump) {
      yargs.showHelp();
      return;
    }

    const orm = await CLIHelper.getORM();
    const generator = orm.getEntityGenerator();
    const dump = await generator.generate({ save: args.save, baseDir: args.path });

    if (args.dump) {
      process.stdout.write(dump.join('\n\n'));
    }

    await orm.close(true);
  }

}
