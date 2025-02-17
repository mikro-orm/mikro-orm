import {
  type IMigrationGenerator,
  type MaybePromise,
  type MigrationsOptions,
  type NamingStrategy,
  Utils,
} from '@mikro-orm/core';
import type { MongoDriver } from '@mikro-orm/mongodb';
import { writeFile } from 'node:fs/promises';

export abstract class MigrationGenerator implements IMigrationGenerator {

  constructor(protected readonly driver: MongoDriver,
              protected readonly namingStrategy: NamingStrategy,
              protected readonly options: MigrationsOptions) { }

  /**
   * @inheritDoc
   */
  async generate(diff: { up: string[]; down: string[] }, path?: string, name?: string): Promise<[string, string]> {
    /* v8 ignore next */
    const defaultPath = this.options.emit === 'ts' && this.options.pathTs ? this.options.pathTs : this.options.path!;
    path = Utils.normalizePath(this.driver.config.get('baseDir'), path ?? defaultPath);
    Utils.ensureDir(path);
    const timestamp = new Date().toISOString().replace(/[-T:]|\.\d{3}z$/ig, '');
    const className = this.namingStrategy.classToMigrationName(timestamp, name);
    const fileName = `${this.options.fileName!(timestamp, name)}.${this.options.emit}`;
    const ret = await this.generateMigrationFile(className, diff);
    await writeFile(path + '/' + fileName, ret, { flush: true });

    return [ret, fileName];
  }

  /* v8 ignore start */
  /**
   * @inheritDoc
   */
  createStatement(query: string, padLeft: number): string {
    if (query) {
      const padding = ' '.repeat(padLeft);
      return `${padding}console.log('${query}');\n`;
    }

    return '\n';
  }
  /* v8 ignore stop */

  /**
   * @inheritDoc
   */
  abstract generateMigrationFile(className: string, diff: { up: string[]; down: string[] }): MaybePromise<string>;

}
