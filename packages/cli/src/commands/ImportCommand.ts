import { readFile } from 'node:fs/promises';
import { colors } from '@mikro-orm/core';
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
    const orm = await CLIHelper.getORM(args.contextName, args.config, { multipleStatements: true });
    const buf = await readFile(args.file);
    await orm.em.getConnection().executeDump(buf.toString());
    CLIHelper.dump(colors.green(`File ${args.file} successfully imported`));
    await orm.close(true);
  }
}
