import type { Arguments, CommandModule } from 'yargs';
import type { MikroORM } from '@mikro-orm/core';
import type { AbstractSqlDriver } from '@mikro-orm/knex';
import { CLIHelper } from '../CLIHelper';

export class CreateDatabaseCommand implements CommandModule {

  command = 'database:create';
  describe = 'Create your database if it does not exist';

  /**
   * @inheritdoc
   */
  async handler(args: Arguments) {
    const orm = await CLIHelper.getORM() as MikroORM<AbstractSqlDriver>;

    const schemaGenerator = orm.getSchemaGenerator();
    await schemaGenerator.ensureDatabase();

    await orm.close(true);
  }

}
