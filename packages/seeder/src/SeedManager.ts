import globby from 'globby';
import { Utils, type Constructor, type EntityManager, type ISeedManager, type MikroORM } from '@mikro-orm/core';
import type { Seeder } from './Seeder';
import { ensureDir, writeFile } from 'fs-extra';

export class SeedManager implements ISeedManager {

  private readonly config = this.em.config;
  private readonly options = this.config.get('seeder');
  private readonly absolutePath: string;

  constructor(private readonly em: EntityManager) {
    this.em = this.em.fork();
    this.config.set('persistOnCreate', true);
    /* istanbul ignore next */
    const key = (this.config.get('tsNode', Utils.detectTsNode()) && this.options.pathTs) ? 'pathTs' : 'path';
    this.absolutePath = Utils.absolutePath(this.options[key]!, this.config.get('baseDir'));
  }

  static register(orm: MikroORM): void {
    orm.config.registerExtension('@mikro-orm/seeder', () => new SeedManager(orm.em));
  }

  async seed(...classNames: Constructor<Seeder>[]): Promise<void> {
    for (const SeederClass of classNames) {
      const seeder = new SeederClass();
      await seeder.run(this.em);
      await this.em.flush();
      this.em.clear();
    }
  }

  /**
   * @internal
   */
  async seedString(...classNames: string[]): Promise<void> {
    const path = `${this.absolutePath}/${this.options.glob}`;
    const files = await globby(path);
    const classMap = new Map<string, Constructor<Seeder>>();

    for (const path of files) {
      const exports = await Utils.dynamicImport(path);

      for (const name of Object.keys(exports)) {
        classMap.set(name, exports[name]);
      }
    }

    for (const className of classNames) {
      const seederClass = classMap.get(className);

      if (!seederClass) {
        throw new Error(`Seeder class ${className} not found in ${Utils.relativePath(path, process.cwd())}`);
      }

      await this.seed(seederClass);
    }
  }

  async createSeeder(className: string): Promise<string> {
    await this.ensureSeedersDirExists();
    return this.generate(className);
  }

  private async ensureSeedersDirExists() {
    await ensureDir(this.absolutePath);
  }

  private async generate(className: string): Promise<string> {
    const fileName = `${this.options.fileName!(className)}.${this.options.emit}`;
    const filePath = `${this.absolutePath}/${fileName}`;
    let ret = '';

    if (this.options.emit === 'ts') {
      ret += `import type { EntityManager } from '@mikro-orm/core';\n`;
      ret += `import { Seeder } from '@mikro-orm/seeder';\n\n`;
      ret += `export class ${className} extends Seeder {\n\n`;
      ret += `  async run(em: EntityManager): Promise<void> {}\n\n`;
      ret += `}\n`;
    } else {
      ret += `'use strict';\n`;
      ret += `Object.defineProperty(exports, '__esModule', { value: true });\n`;
      ret += `const { Seeder } = require('@mikro-orm/seeder');\n\n`;
      ret += `class ${className} extends Seeder {\n\n`;
      ret += `  async run(em: EntityManager): Promise<void> {}\n\n`;
      ret += `}\n`;
      ret += `exports.${className} = ${className};\n`;
    }

    await writeFile(filePath, ret);

    return filePath;
  }

}
