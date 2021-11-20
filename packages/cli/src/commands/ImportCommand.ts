import type { MikroORM } from '@mikro-orm/core';
import { colors } from '@mikro-orm/core';
import type { AbstractSqlDriver } from '@mikro-orm/knex';
import type { Arguments, CommandModule } from 'yargs';
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
    CLIHelper.dump(colors.green(`File ${args.file} successfully imported`));
    await orm.close(true);
  }

}
