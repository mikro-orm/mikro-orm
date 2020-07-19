import { Arguments, CommandModule } from 'yargs';
import c from 'ansi-colors';
import { MikroORM } from '@mikro-orm/core';
import { AbstractSqlDriver } from '@mikro-orm/knex';
import { CLIHelper } from '../CLIHelper';

export class ImportCommand implements CommandModule {

  command = 'database:import <file>';
  describe = 'Imports the SQL file to the database';

  /**
   * @inheritdoc
   */
  async handler(args: Arguments) {
    const orm = await CLIHelper.getORM() as MikroORM<AbstractSqlDriver>;
    await orm.em.getConnection().loadFile(args.file as string);
    CLIHelper.dump(c.green(`File ${args.file} successfully imported`));
    await orm.close(true);
  }

}
