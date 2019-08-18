import yargs, { Argv } from 'yargs';
import { ClearCacheCommand } from './ClearCacheCommand';
import { GenerateEntitiesCommand } from './GenerateEntitiesCommand';
import { MikroORM } from '../MikroORM';
import { Configuration, Utils } from '../utils';
import { CreateSchemaCommand } from './CreateSchemaCommand';
import { UpdateSchemaCommand } from './UpdateSchemaCommand';
import { DropSchemaCommand } from './DropSchemaCommand';

export class CLIHelper {

  static getConfiguration(): Configuration {
    return new Configuration(require(Utils.normalizePath(process.env.MIKRO_ORM_CLI || './cli-config')));
  }

  static async getORM(): Promise<MikroORM> {
    const options = CLIHelper.getConfiguration();
    return MikroORM.init(options);
  }

  static configure() {
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

}
