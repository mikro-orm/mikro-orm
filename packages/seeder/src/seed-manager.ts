import type { ISeedManager, EntityManager } from '@mikro-orm/core';
import { Utils } from '@mikro-orm/core';
import type { Seeder } from './seeder';
import { ensureDir, writeFile } from 'fs-extra';

export class SeedManager implements ISeedManager {

  private readonly config = this.em.config;
  private readonly options = this.config.get('seeder');
  private readonly absolutePath = Utils.absolutePath(this.options.path, this.config.get('baseDir'));

  constructor(private readonly em: EntityManager) {
  }

  async seed(...seederClasses: { new(): Seeder }[]): Promise<void> {
    for (const seederClass of seederClasses) {
      const seeder = new seederClass();
      await seeder.run(this.em);
      await this.em.flush();
      this.em.clear();
    }
  }

  async seedString(...seederClasses: string[]): Promise<void> {
    for (const seederClass of seederClasses) {
      const seedersPath = Utils.normalizePath(this.absolutePath);
      const filePath = `${seedersPath}/${this.getFileName(seederClass)}`;
      const seeder = await import(filePath);
      await this.seed(seeder[seederClass]);
    }
  }

  async createSeeder(seederClass: string): Promise<string> {
    await this.ensureSeedersDirExists();
    return this.generate(seederClass);
  }

  private getFileName(seederClass: string): string {
    const split = seederClass.split(/(?=[A-Z])/);
    const parts = split.reduce((previousValue: string[], currentValue: string, index: number) => {
      if (index === split.length - 1) {
        return previousValue;
      }
      previousValue.push(currentValue.toLowerCase());
      return previousValue;
    }, []);
    return `${parts.join('-')}.seeder.ts`;
  }

  private async ensureSeedersDirExists() {
    await ensureDir(Utils.normalizePath(this.absolutePath));
  }

  private async generate(seederClass: string): Promise<string> {
    const seedersPath = Utils.normalizePath(this.absolutePath);
    const filePath = `${seedersPath}/${this.getFileName(seederClass)}`;

    let ret = `import type { EntityManager } from '@mikro-orm/core';\n`;
    ret += `import { Seeder } from '@mikro-orm/seeder';\n\n`;
    ret += `export class ${seederClass} extends Seeder {\n\n`;
    ret += `  async run(em: EntityManager): Promise<void> {}\n\n`;
    ret += `}\n`;

    await writeFile(filePath, ret);

    return filePath;
  }

}
