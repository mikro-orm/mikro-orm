import {
  type Configuration,
  type Constructor,
  type EntityManager,
  type ISeedManager,
  type MikroORM,
  type SeederOptions,
  Utils,
} from '@mikro-orm/core';
import { fs } from '@mikro-orm/core/fs-utils';
import { writeFile } from 'node:fs/promises';
import { glob } from 'tinyglobby';
import type { Seeder } from './Seeder.js';

export class SeedManager implements ISeedManager {

  private readonly config: Configuration;
  private readonly options: SeederOptions;
  private readonly absolutePath: string;

  constructor(private readonly em: EntityManager) {
    this.config = this.em.config;
    this.options = this.config.get('seeder');
    this.em = this.em.fork();
    this.config.set('persistOnCreate', true);
    this.detectSourceFolder();
    /* v8 ignore next */
    const key = (this.config.get('preferTs', Utils.detectTypeScriptSupport()) && this.options.pathTs) ? 'pathTs' : 'path';
    this.absolutePath = Utils.absolutePath(this.options[key]!, this.config.get('baseDir'));
  }

  static register(orm: MikroORM): void {
    orm.config.registerExtension('@mikro-orm/seeder', () => new SeedManager(orm.em));
  }

  /**
   * Checks if `src` folder exists, it so, tries to adjust the migrations and seeders paths automatically to use it.
   * If there is a `dist` or `build` folder, it will be used for the JS variant (`path` option), while the `src` folder will be
   * used for the TS variant (`pathTs` option).
   *
   * If the default folder exists (e.g. `/migrations`), the config will respect that, so this auto-detection should not
   * break existing projects, only help with the new ones.
   */
  private detectSourceFolder(): void {
    const baseDir = this.config.get('baseDir');
    const defaultPath = './seeders';

    if (!fs.pathExists(baseDir + '/src')) {
      this.options.path ??= defaultPath;
      return;
    }

    const exists = fs.pathExists(`${baseDir}/${defaultPath}`);
    const distDir = fs.pathExists(baseDir + '/dist');
    const buildDir = fs.pathExists(baseDir + '/build');
    // if neither `dist` nor `build` exist, we use the `src` folder as it might be a JS project without building, but with `src` folder
    const path = distDir ? './dist' : (buildDir ? './build' : './src');

    // only if the user did not provide any values and if the default path does not exist
    if (!this.options.path && !this.options.pathTs && !exists) {
      this.options.path = `${path}/seeders`;
      this.options.pathTs = './src/seeders';
    }
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
    const files = await glob(path);
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

  async create(className: string): Promise<string> {
    fs.ensureDir(this.absolutePath);
    return this.generate(className);
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

    await writeFile(filePath, ret, { flush: true });

    return filePath;
  }

}
