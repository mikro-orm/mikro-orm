import { MigrationGenerator } from './MigrationGenerator';

export class TSMigrationGenerator extends MigrationGenerator {

  /**
   * @inheritDoc
   */
  generateMigrationFile(className: string, diff: { up: string[]; down: string[] }): string {
    let ret = `import { Migration } from '@mikro-orm/migrations';\n\n`;
    ret += `export class ${className} extends Migration {\n\n`;
    ret += `  async up(): Promise<void> {\n`;
    diff.up.forEach(sql => ret += this.createStatement(sql, 4));
    ret += `  }\n\n`;

    if (diff.down.length > 0) {
      ret += `  async down(): Promise<void> {\n`;
      diff.down.forEach(sql => ret += this.createStatement(sql, 4));
      ret += `  }\n\n`;
    }

    ret += `}\n`;

    return ret;
  }

}
