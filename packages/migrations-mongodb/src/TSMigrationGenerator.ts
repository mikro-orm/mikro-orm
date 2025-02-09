import { MigrationGenerator } from './MigrationGenerator.js';

export class TSMigrationGenerator extends MigrationGenerator {

  /**
   * @inheritDoc
   */
  generateMigrationFile(className: string, diff: { up: string[]; down: string[] }): string {
    let ret = `import { Migration } from '@mikro-orm/migrations-mongodb';\n\n`;
    ret += `export class ${className} extends Migration {\n\n`;
    ret += `  async up(): Promise<void> {\n`;
    /* v8 ignore next */
    diff.up.forEach(sql => ret += this.createStatement(sql, 4));
    ret += `  }\n\n`;

    /* v8 ignore next 5 */
    if (diff.down.length > 0) {
      ret += `  async down(): Promise<void> {\n`;
      diff.down.forEach(sql => ret += this.createStatement(sql, 4));
      ret += `  }\n\n`;
    }

    ret += `}\n`;

    return ret;
  }

}
