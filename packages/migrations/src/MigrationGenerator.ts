import {
  type IMigrationGenerator,
  type MaybePromise,
  type MigrationsOptions,
  type NamingStrategy,
} from '@mikro-orm/core';
import type { AbstractSqlDriver } from '@mikro-orm/sql';

export abstract class MigrationGenerator implements IMigrationGenerator {

  constructor(protected readonly driver: AbstractSqlDriver,
              protected readonly namingStrategy: NamingStrategy,
              protected readonly options: MigrationsOptions) { }

  /**
   * @inheritDoc
   */
  async generate(diff: { up: string[]; down: string[] }, path?: string, name?: string): Promise<[string, string]> {
    const { fs } = await import('@mikro-orm/core/fs-utils');
    /* v8 ignore next */
    const defaultPath = this.options.emit === 'ts' && this.options.pathTs ? this.options.pathTs : this.options.path!;
    path = fs.normalizePath(this.driver.config.get('baseDir'), path ?? defaultPath);
    fs.ensureDir(path);
    const timestamp = new Date().toISOString().replace(/[-T:]|\.\d{3}z$/ig, '');
    const className = this.namingStrategy.classToMigrationName(timestamp, name);
    const fileName = `${this.options.fileName!(timestamp, name)}.${this.options.emit}`;
    const ret = await this.generateMigrationFile(className, diff);
    await fs.writeFile(path + '/' + fileName, ret, { flush: true });

    return [ret, fileName];
  }

  /**
   * @inheritDoc
   */
  createStatement(sql: string, padLeft: number): string {
    if (sql) {
      const padding = ' '.repeat(padLeft);
      return `${padding}this.addSql(\`${sql.replace(/[`$\\]/g, '\\$&')}\`);\n`;
    }

    return '\n';
  }

  /**
   * @inheritDoc
   */
  abstract generateMigrationFile(className: string, diff: { up: string[]; down: string[] }): MaybePromise<string>;

}
