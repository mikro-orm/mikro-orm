import type { MikroORM } from '@mikro-orm/core';
import { Utils } from '@mikro-orm/core';
import type { Seeder } from './seeder';
import { ensureDir, writeFile } from 'fs-extra';

export class SeedManager {

  constructor(private orm: MikroORM) {
  }

  async refreshDatabase(): Promise<void> {
    const generator = this.orm.getSchemaGenerator();
    await generator.dropSchema();
    await generator.createSchema();
  }

  async seed(...seederClasses: { new(): Seeder }[]): Promise<void> {
    for (const seederClass of seederClasses) {
      const seeder = new seederClass();
      await seeder.run(this.orm.em);
      await this.orm.em.flush();
      this.orm.em.clear();
    }
  }

  async seedString(...seederClasses: string[]): Promise<void> {
    for (const seederClass of seederClasses) {
      const seeder = await import(`${process.cwd()}/${this.orm.config.get('seeder').path}/${this.getFileName(seederClass)}`);
      await this.seed(seeder[seederClass]);
    }
  }

  async createSeeder(seederClass: string): Promise<string> {
    await this.ensureMigrationsDirExists();
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

  private async ensureMigrationsDirExists() {
    await ensureDir(Utils.normalizePath(this.orm.config.get('seeder').path));
  }

  private async generate(seederClass: string): Promise<string> {
    const path = Utils.normalizePath(this.orm.config.get('seeder').path);
    const fileName = this.getFileName(seederClass);
    const ret = `import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
export class ${seederClass} extends Seeder {

  run(em: EntityManager): Promise<void> {
  }

}`;

    await writeFile(path + '/' + fileName, ret);

    return path + '/' + fileName;
  }

}
