import type { ArgumentsCamelCase } from 'yargs';
import type { AbstractSqlDriver } from '@mikro-orm/knex';
import type { BaseArgs, BaseCommand } from '../CLIConfigurator.js';
import { CLIHelper } from '../CLIHelper.js';

export class CreateDatabaseCommand implements BaseCommand {

  command = 'database:create';
  describe = 'Create your database if it does not exist';

  /**
   * @inheritDoc
   */
  async handler(args: ArgumentsCamelCase<BaseArgs>) {
    const orm = await CLIHelper.getORM<AbstractSqlDriver>(args.contextName, args.config);

    const schemaGenerator = orm.getSchemaGenerator();
    await schemaGenerator.ensureDatabase();

    await orm.close(true);
  }

}
