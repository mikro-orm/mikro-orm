import { colors, type MikroORM } from '@mikro-orm/core';
import type { AbstractSqlDriver } from '@mikro-orm/knex';
import type { ArgumentsCamelCase } from 'yargs';
import type { BaseArgs, BaseCommand } from '../CLIConfigurator';
import { CLIHelper } from '../CLIHelper';

export class ImportCommand implements BaseCommand {

  command = 'database:import <file>';
  describe = 'Imports the SQL file to the database';

  /**
   * @inheritDoc
   */
  async handler(args: ArgumentsCamelCase<BaseArgs>) {
    const orm = await CLIHelper.getORM() as MikroORM<AbstractSqlDriver>;
    await orm.em.getConnection().loadFile(args.file as string);
    CLIHelper.dump(colors.green(`File ${args.file} successfully imported`));
    await orm.close(true);
  }

}
