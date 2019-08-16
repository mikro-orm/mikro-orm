import { CodeBlockWriter, Project, QuoteKind, SourceFile } from 'ts-morph';
import { ensureDir, writeFile } from 'fs-extra';

import { AbstractSqlDriver, Configuration, TableDefinition, Utils } from '..';
import { Platform } from '../platforms';
import { EntityProperty } from '../decorators';

export class EntityGenerator {

  private readonly platform: Platform = this.driver.getPlatform();
  private readonly helper = this.platform.getSchemaHelper()!;
  private readonly connection = this.driver.getConnection();
  private readonly namingStrategy = this.config.getNamingStrategy();
  private readonly project = new Project();
  private readonly sources: SourceFile[] = [];

  constructor(private readonly driver: AbstractSqlDriver,
              private readonly config: Configuration) {
    this.project.manipulationSettings.set({ quoteKind: QuoteKind.Single });
  }

  async generate(options: { baseDir?: string; save?: boolean } = {}): Promise<string[]> {
    const baseDir = options.baseDir || Utils.normalizePath(this.config.get('baseDir'), 'generated-entities');
    const tables = await this.connection.execute<TableDefinition[]>(this.helper.getListTablesSQL());

    for (const table of tables) {
      await this.createEntity(table.table_name, table.schema_name);
    }

    this.sources.forEach(entity => {
      entity.fixMissingImports();
      entity.fixUnusedIdentifiers();
      entity.organizeImports();
    });

    if (options.save) {
      await ensureDir(baseDir);
      await Promise.all(this.sources.map(e => writeFile(baseDir + '/' + e.getBaseName(), e.getFullText())));
    }

    return this.sources.map(e => e.getFullText());
  }

  async createEntity(tableName: string, schemaName?: string): Promise<void> {
    const cols = await this.helper.getColumns(this.connection, tableName, schemaName);
    const indexes = await this.helper.getIndexes(this.connection, tableName, schemaName);
    const pks = await this.helper.getPrimaryKeys(this.connection, indexes, tableName, schemaName);
    const fks = await this.getForeignKeys(tableName, schemaName);
    const entity = this.project.createSourceFile(this.namingStrategy.getClassName(tableName, '_') + '.ts', writer => {
      writer.writeLine(`import { Entity, PrimaryKey, Property, ManyToOne, OneToMany, OneToOne, ManyToMany, Cascade } from 'mikro-orm';`);
      writer.blankLine();
      writer.writeLine('@Entity()');
      writer.write(`export class ${this.namingStrategy.getClassName(tableName, '_')}`);
      writer.block(() => cols.forEach(def => this.createProperty(writer, def, pks, indexes[def.name], fks[def.name])));
      writer.write('');
    });

    this.sources.push(entity);
  }

  private async getForeignKeys(tableName: string, schemaName?: string): Promise<Record<string, any>> {
    const fks = await this.connection.execute<any[]>(this.helper.getForeignKeysSQL(tableName, schemaName));
    return this.helper.mapForeignKeys(fks);
  }

  private createProperty(writer: CodeBlockWriter, def: any, pks: string[], index: any[], fk: any): void {
    const prop = this.getPropertyName(def.name, fk);
    const type = this.getPropertyType(def.type, fk);
    const defaultValue = this.getPropertyDefaultValue(def, type);
    const decorator = this.getPropertyDecorator(prop, def, type, defaultValue, pks, index, fk);
    const definition = this.getPropertyDefinition(prop, type, defaultValue);

    writer.blankLineIfLastNot();
    writer.writeLine(decorator);
    writer.writeLine(definition);
    writer.blankLine();
  }

  private getPropertyDefinition(prop: string, type: string, defaultValue: any): string {
    // string defaults are usually things like SQL functions
    if (!defaultValue || typeof defaultValue === 'string') {
      return `${prop}: ${type};`;
    }

    return `${prop}: ${type} = ${defaultValue};`;
  }

  private getPropertyDecorator(prop: string, def: Record<string, any>, type: string, defaultValue: any, pks: string[], index: any[], fk: any): string {
    const options = {} as any;
    const decorator = this.getDecoratorType(def, pks, index, fk);

    if (fk) {
      this.getForeignKeyDecoratorOptions(options, fk, def, prop);
    } else {
      this.getScalarPropertyDecoratorOptions(type, def, options, prop);
    }

    this.getCommonDecoratorOptions(def, options, defaultValue);

    if (Object.keys(options).length === 0) {
      return decorator + '()';
    }

    return `${decorator}({ ${Object.entries(options).map(([opt, val]) => `${opt}: ${val}`).join(', ')} })`;
  }

  private getCommonDecoratorOptions(def: any, options: Record<string, any>, defaultValue: any) {
    if (def.nullable) {
      options.nullable = true;
    }

    if (defaultValue && typeof defaultValue === 'string') {
      options.default = `\`${defaultValue}\``;
    }
  }

  private getScalarPropertyDecoratorOptions(type: string, def: any, options: Record<string, any>, prop: string) {
    const defaultColumnType = this.helper.getTypeDefinition({
      type,
      length: def.maxLength,
    } as EntityProperty).replace(/\(\d+\)/, '');

    if (def.type !== defaultColumnType) {
      options.type = `'${def.type}'`;
    }

    if (def.name !== this.namingStrategy.propertyToColumnName(prop)) {
      options.fieldName = `'${def.name}'`;
    }

    if (def.maxLength) {
      options.length = def.maxLength;
    }
  }

  private getForeignKeyDecoratorOptions(options: Record<string, any>, fk: any, def: any, prop: string) {
    options.entity = `() => ${this.namingStrategy.getClassName(fk.referencedTableName, '_')}`;

    if (def.name !== this.namingStrategy.joinKeyColumnName(prop, fk.referencedColumnName)) {
      options.fieldName = `'${def.name}'`;
    }

    const cascade = ['Cascade.MERGE'];

    if (fk.updateRule.toLowerCase() === 'cascade') {
      cascade.push('Cascade.PERSIST');
    }

    if (fk.deleteRule.toLowerCase() === 'cascade') {
      cascade.push('Cascade.REMOVE');
    }

    if (cascade.length === 3) {
      cascade.length = 0;
      cascade.push('Cascade.ALL');
    }

    if (!(cascade.length === 2 && cascade.includes('Cascade.PERSIST') && cascade.includes('Cascade.MERGE'))) {
      options.cascade = `[${cascade.sort().join(', ')}]`;
    }
  }

  private getDecoratorType(def: any, pks: string[], index: any[], fk: any): string {
    const primary = pks.includes(def.name);

    if (primary) {
      return '@PrimaryKey';
    }

    if (fk && index && index.some(i => i.unique)) {
      return '@OneToOne';
    }

    if (fk) {
      return '@ManyToOne';
    }

    return '@Property';
  }

  private getPropertyName(field: string, fk: any): string {
    if (fk) {
      field = field.replace(new RegExp(`_${fk.referencedColumnName}$`), '');
    }

    return field.replace(/_(\w)/g, m => m[1].toUpperCase()).replace(/_+/g, '');
  }

  private getPropertyType(type: string, fk: any): string {
    if (fk) {
      return this.namingStrategy.getClassName(fk.referencedTableName, '_');
    }

    return this.helper.getTypeFromDefinition(type);
  }

  private getPropertyDefaultValue(def: any, propType: string): any {
    if (!def.nullable && def.defaultValue === null) {
      return;
    }

    if (!def.defaultValue) {
      return;
    }

    if (propType === 'boolean') {
      return !!def.defaultValue;
    }

    if (propType === 'number') {
      return +def.defaultValue;
    }

    return '' + def.defaultValue;
  }

}
