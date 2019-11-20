import { Arguments, CommandModule } from 'yargs';
import chalk from 'chalk';

import { CLIHelper } from './CLIHelper';
import { MikroORM } from '../MikroORM';
import { AbstractSqlDriver } from '../drivers';

export class ImportCommand implements CommandModule {

  command = 'database:import <file>';
  describe = 'Imports the SQL file to the database';

  async handler(args: Arguments) {
    const orm = await CLIHelper.getORM() as MikroORM<AbstractSqlDriver>;
    await orm.em.getConnection().loadFile(args.file as string);
    CLIHelper.dump(chalk.green(`File ${args.file} successfully imported`));
    await orm.close(true);
  }

}
