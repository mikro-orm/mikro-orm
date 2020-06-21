import { ensureDir, writeFile } from 'fs-extra';
import { CodeBlockWriter, IndentationText, Project, QuoteKind } from 'ts-morph';
import { MigrationsOptions, NamingStrategy, Utils } from '@mikro-orm/core';
import { AbstractSqlDriver } from '@mikro-orm/knex';

export class MigrationGenerator {

  private readonly project = new Project();

  constructor(protected readonly driver: AbstractSqlDriver,
              protected readonly namingStrategy: NamingStrategy,
              protected readonly options: MigrationsOptions) {
    this.project.manipulationSettings.set({ quoteKind: QuoteKind.Single, indentationText: IndentationText.TwoSpaces });
  }

  async generate(diff: string[], path?: string): Promise<[string, string]> {
    path = Utils.normalizePath(path || this.options.path!);
    await ensureDir(path);
    const timestamp = new Date().toISOString().replace(/[-T:]|\.\d{3}z$/ig, '');
    const className = this.namingStrategy.classToMigrationName(timestamp);
    const fileName = `${this.options.fileName!(timestamp)}.${this.options.emit}`;
    const migration = this.project.createSourceFile(path + '/' + fileName, writer => {
      if (this.options.emit === 'js') {
        this.generateJSMigrationFile(writer, className, diff);
      } else {
        this.generateTSMigrationFile(writer, className, diff);
      }
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

  generateJSMigrationFile(writer: CodeBlockWriter, className: string, diff: string[]) {
    writer.writeLine(`'use strict';`);
    writer.writeLine(`Object.defineProperty(exports, '__esModule', { value: true });`);
    writer.writeLine(`const Migration = require('@mikro-orm/migrations').Migration;`);
    writer.blankLine();
    writer.write(`class ${className} extends Migration`);

    writer.block(() => {
      writer.blankLine();
      writer.write(`async up()`);
      writer.block(() => diff.forEach(sql => this.createStatement(writer, sql)));
      writer.blankLine();
    });

    writer.writeLine(`exports.${className} = ${className};`);
    writer.write('');
  }

  generateTSMigrationFile(writer: CodeBlockWriter, className: string, diff: string[]) {
    writer.writeLine(`import { Migration } from '@mikro-orm/migrations';`);
    writer.blankLine();
    writer.write(`export class ${className} extends Migration`);

    writer.block(() => {
      writer.blankLine();
      writer.write('async up(): Promise<void>');
      writer.block(() => diff.forEach(sql => this.createStatement(writer, sql)));
      writer.blankLine();
    });

    writer.write('');
  }

}
