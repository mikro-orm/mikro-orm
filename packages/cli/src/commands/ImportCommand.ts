import {colors, MikroORM} from '@mikro-orm/core';
import type { Arguments } from 'yargs';
import { CLIHelper } from '../CLIHelper';
import {CommandModule} from "yargs";
import {OrmProvider} from "./typings";
import {AbstractSqlDriver} from "@mikro-orm/knex";

export class ImportCommand implements CommandModule {
  command = 'database:import <file>';
  describe = 'Imports the SQL file to the database';

  constructor(private ormProvider: OrmProvider<AbstractSqlDriver>) {
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

    await orm.em.getConnection().loadFile(args.file as string);
    CLIHelper.dump(colors.green(`File ${args.file} successfully imported`));
    await orm.close(true);
  }

}
