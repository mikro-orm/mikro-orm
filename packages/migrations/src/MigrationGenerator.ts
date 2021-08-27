import { ensureDir, writeFile } from 'fs-extra';
import { IMigrationGenerator, MigrationsOptions, NamingStrategy, Utils } from '@mikro-orm/core';
import { AbstractSqlDriver } from '@mikro-orm/knex';

export abstract class MigrationGenerator implements IMigrationGenerator {

  constructor(protected readonly driver: AbstractSqlDriver,
              protected readonly namingStrategy: NamingStrategy,
              protected readonly options: MigrationsOptions) { }

  /**
   * @inheritDoc
   */
  async generate(diff: { up: string[]; down: string[] }, path?: string): Promise<[string, string]> {
    path = Utils.normalizePath(path || this.options.path!);
    await ensureDir(path);
    const timestamp = new Date().toISOString().replace(/[-T:]|\.\d{3}z$/ig, '');
    const className = this.namingStrategy.classToMigrationName(timestamp);
    const fileName = `${this.options.fileName!(timestamp)}.${this.options.emit}`;
    const ret = this.generateMigrationFile(className, diff);
    await writeFile(path + '/' + fileName, ret);

    return [ret, fileName];
  }

  /**
   * @inheritDoc
   */
  createStatement(sql: string, padLeft: number): string {
    if (sql) {
      const padding = ' '.repeat(padLeft);
      return `${padding}this.addSql('${sql.replace(/['\\]/g, '\\\'')}');\n`;
    }

    return '\n';
  }

  /**
   * @inheritDoc
   */
  abstract generateMigrationFile(className: string, diff: { up: string[]; down: string[] }): string;

}
