import type { Arguments, Argv, CommandModule } from 'yargs';
import type {MikroORM} from '@mikro-orm/core';
import {colors} from '@mikro-orm/core';
import type { AbstractSqlDriver } from '@mikro-orm/knex';
import { CLIHelper } from '../CLIHelper';
import {OrmProvider} from "./typings";

export class DatabaseSeedCommand<T> implements CommandModule<T, { class: string }> {
  command = 'seeder:run';
  describe = 'Seed the database using the seeder class';
  builder = (args: Argv) => {
    args.option('c', {
      alias: 'class',
      type: 'string',
      desc: 'Seeder class to run',
    });
    return args as Argv<{ class: string }>;
  };

  constructor(private ormProvider: OrmProvider) {
    this.handler.bind(this)
  }

  /**
   * @inheritDoc
   */
  async handler(args: Arguments<{ class?: string }>) {
    const orm = await this.ormProvider()
    if (!await orm.isConnected()) {
      await orm.connect();
    }

    const seeder = orm.getSeeder();
    const seederClass = args.class || orm.config.get('seeder').defaultSeeder;
    await seeder.seedString(seederClass);
    CLIHelper.dump(colors.green(`Seeder ${seederClass} successfully seeded`));
    await orm.close(true);
  }

}
