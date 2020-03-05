import { ensureDir, writeFile } from 'fs-extra';
import { CodeBlockWriter, IndentationText, Project, QuoteKind } from 'ts-morph';

import { AbstractSqlDriver } from '../drivers';
import { MigrationsOptions, Utils } from '../utils';

export class MigrationGenerator {

  private readonly project = new Project();

  constructor(protected readonly driver: AbstractSqlDriver,
              protected readonly options: MigrationsOptions) {
    this.project.manipulationSettings.set({quoteKind: QuoteKind.Single, indentationText: IndentationText.TwoSpaces});
  }

  async generate(diff: string[], path?: string): Promise<[string, string]> {
    path = Utils.normalizePath(path || this.options.path!);
    await ensureDir(path);
    const time = new Date().toISOString().replace(/[-T:]|\.\d{3}z$/ig, '');
    const className = `Migration${time}`;
    const fileName = `${className}.${this.options.emit}`;
    const migration = this.project.createSourceFile(path + '/' + fileName, writer => {
      if (this.options.emit === 'js') {
        writer.writeLine(`"use strict";`);
        writer.writeLine(`Object.defineProperty(exports, "__esModule", { value: true });`);
        writer.writeLine(`const Migration = require("mikro-orm").Migration;`);
      } else {
        writer.writeLine(`import { Migration } from 'mikro-orm';`);
      }
      writer.blankLine();
      if (this.options.emit === 'ts') {
        writer.write(`export `);
      }
      writer.write(`class ${className} extends Migration`);
      writer.block(() => {
        writer.blankLine();
        writer.write(`async up()`);
        if (this.options.emit === 'ts')
          writer.write(`: Promise<void>`);
        writer.block(() => diff.forEach(sql => this.createStatement(writer, sql)));
        writer.blankLine();
      });
      if (this.options.emit === 'js') {
        writer.writeLine(`exports.${className} = ${className}`);
      }
      writer.write('');
    });

    const ret = migration.getFullText();
    await writeFile(migration.getFilePath(), ret);

    return [ret, fileName];
  }

  createStatement(writer: CodeBlockWriter, sql: string): void {
    if (sql) {
      writer.writeLine(`this.addSql('${sql.replace(/'/g, '\\\'')}');`); // lgtm [js/incomplete-sanitization]
    } else {
      writer.blankLine();
    }
  }

}
