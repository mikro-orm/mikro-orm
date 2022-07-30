import { ensureDir, writeFile } from 'fs-extra';
import type { IMigrationGenerator, MigrationsOptions, NamingStrategy } from '@mikro-orm/core';
import { Utils } from '@mikro-orm/core';
import type { MongoDriver } from '@mikro-orm/mongodb';

/* istanbul ignore next */
export abstract class MigrationGenerator implements IMigrationGenerator {

  constructor(protected readonly driver: MongoDriver,
              protected readonly namingStrategy: NamingStrategy,
              protected readonly options: MigrationsOptions) { }

  /**
   * @inheritDoc
   */
  async generate(diff: { up: string[]; down: string[] }, path?: string): Promise<[string, string]> {
    /* istanbul ignore next */
    const defaultPath = this.options.emit === 'ts' && this.options.pathTs ? this.options.pathTs : this.options.path!;
    path = Utils.normalizePath(this.driver.config.get('baseDir'), path ?? defaultPath);
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
  createStatement(query: string, padLeft: number): string {
    if (query) {
      const padding = ' '.repeat(padLeft);
      return `${padding}console.log('${query}');\n`;
    }

    return '\n';
  }

  /**
   * @inheritDoc
   */
  abstract generateMigrationFile(className: string, diff: { up: string[]; down: string[] }): string;

}
