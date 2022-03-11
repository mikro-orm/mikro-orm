import type { Arguments, CommandModule } from 'yargs';
import {OrmProvider} from "./typings";

export class CreateDatabaseCommand implements CommandModule {
  command = 'database:create';
  describe = 'Create your database if it does not exist';

  constructor(private ormProvider: OrmProvider) {
    this.handler.bind(this)
  }

  /**
   * @inheritDoc
   */
  async handler(args: Arguments) {
    const orm = await this.ormProvider()
    if (!await orm.isConnected()) {
      await orm.connect();
    }

    const schemaGenerator = orm.getSchemaGenerator();
    await schemaGenerator.ensureDatabase();

    await orm.close(true);
  }

}
