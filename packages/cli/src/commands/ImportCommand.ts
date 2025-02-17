import { colors } from '@mikro-orm/core';
import type { AbstractSqlDriver } from '@mikro-orm/knex';
import type { ArgumentsCamelCase } from 'yargs';
import type { BaseArgs, BaseCommand } from '../CLIConfigurator.js';
import { CLIHelper } from '../CLIHelper.js';

type ImportArgs = BaseArgs & { file: string };

export class ImportCommand implements BaseCommand<ImportArgs> {

  command = 'database:import <file>';
  describe = 'Imports the SQL file to the database';

  /**
   * @inheritDoc
   */
  async handler(args: ArgumentsCamelCase<ImportArgs>) {
    const orm = await CLIHelper.getORM<AbstractSqlDriver>(args.contextName, args.config, { multipleStatements: true });
    await orm.em.getConnection().loadFile(args.file);
    CLIHelper.dump(colors.green(`File ${args.file} successfully imported`));
    await orm.close(true);
  }

}
