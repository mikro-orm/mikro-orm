import { MigrationGenerator } from './MigrationGenerator.js';

/** Generates migration files in TypeScript format. */
export class TSMigrationGenerator extends MigrationGenerator {
  /**
   * @inheritDoc
   */
  generateMigrationFile(className: string, diff: { up: string[]; down: string[] }): string {
    let ret = `import { Migration } from '@mikro-orm/migrations';\n\n`;
    ret += `export class ${className} extends Migration {\n\n`;
    ret += `  override up(): void {\n`;
    diff.up.forEach(sql => (ret += this.createStatement(sql, 4)));
    ret += `  }\n\n`;

    if (diff.down.length > 0) {
      ret += `  override down(): void {\n`;
      diff.down.forEach(sql => (ret += this.createStatement(sql, 4)));
      ret += `  }\n\n`;
    }

    ret += `}\n`;

    return ret;
  }
}
