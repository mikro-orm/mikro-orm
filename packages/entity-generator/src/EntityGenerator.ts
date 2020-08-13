import { IndentationText, Project, QuoteKind, SourceFile } from 'ts-morph';
import { ensureDir, writeFile } from 'fs-extra';
import { Dictionary, EntityProperty, ReferenceType, Utils } from '@mikro-orm/core';
import { DatabaseSchema, DatabaseTable, EntityManager } from '@mikro-orm/knex';

export class EntityGenerator {

  private readonly config = this.em.config;
  private readonly driver = this.em.getDriver();
  private readonly platform = this.driver.getPlatform();
  private readonly helper = this.platform.getSchemaHelper()!;
  private readonly connection = this.driver.getConnection();
  private readonly namingStrategy = this.config.getNamingStrategy();
  private readonly project = new Project();
  private readonly sources: SourceFile[] = [];

  constructor(private readonly em: EntityManager) {
    this.project.manipulationSettings.set({ quoteKind: QuoteKind.Single, indentationText: IndentationText.TwoSpaces });
  }

  async generate(options: { baseDir?: string; save?: boolean } = {}): Promise<string[]> {
    const baseDir = Utils.normalizePath(options.baseDir || this.config.get('baseDir') + '/generated-entities');
    const schema = await DatabaseSchema.create(this.connection, this.helper, this.config);

    for (const table of schema.getTables()) {
      await this.createEntity(table);
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

  async createEntity(table: DatabaseTable): Promise<void> {
    const meta = table.getEntityDeclaration(this.namingStrategy, this.helper);
    const entity = this.project.createSourceFile(meta.className + '.ts', writer => {
      writer.writeLine(`import { Entity, PrimaryKey, Property, ManyToOne, OneToMany, OneToOne, ManyToMany, Cascade, Index, Unique } from '@mikro-orm/core';`);
      writer.blankLine();
      writer.writeLine('@Entity()');

      meta.indexes.forEach(index => {
        const properties = Utils.asArray(index.properties).map(prop => `'${prop}'`);
        writer.writeLine(`@Index({ name: '${index.name}', properties: [${properties.join(', ')}] })`);
      });

      meta.uniques.forEach(index => {
        const properties = Utils.asArray(index.properties).map(prop => `'${prop}'`);
        writer.writeLine(`@Unique({ name: '${index.name}', properties: [${properties.join(', ')}] })`);
      });

      writer.write(`export class ${meta.className}`);
      writer.block(() => Object.values(meta.properties).forEach(prop => {
        const decorator = this.getPropertyDecorator(prop);
        const definition = this.getPropertyDefinition(prop);
        writer.blankLineIfLastNot();
        writer.writeLine(decorator);
        writer.writeLine(definition);
        writer.blankLine();
      }));
      writer.write('');
    });

    this.sources.push(entity);
  }

  private getPropertyDefinition(prop: EntityProperty): string {
    // string defaults are usually things like SQL functions
    const useDefault = prop.default && typeof prop.default !== 'string';
    const optional = prop.nullable ? '?' : (useDefault ? '' : '!');
    const ret = `${prop.name}${optional}: ${prop.type}`;

    if (!useDefault) {
      return ret + ';';
    }

    return `${ret} = ${prop.default};`;
  }

  private getPropertyDecorator(prop: EntityProperty): string {
    const options = {} as Dictionary;
    const columnType = this.helper.getTypeFromDefinition(prop.columnTypes[0], '__false') === '__false' ? prop.columnTypes[0] : undefined;
    let decorator = this.getDecoratorType(prop);

    if (prop.reference !== ReferenceType.SCALAR) {
      this.getForeignKeyDecoratorOptions(options, prop);
    } else {
      this.getScalarPropertyDecoratorOptions(options, prop, columnType);
    }

    this.getCommonDecoratorOptions(options, prop, columnType);
    const indexes = this.getPropertyIndexes(prop, options);
    decorator = [...indexes.sort(), decorator].join('\n');

    if (Object.keys(options).length === 0) {
      return `${decorator}()`;
    }

    return `${decorator}({ ${Object.entries(options).map(([opt, val]) => `${opt}: ${val}`).join(', ')} })`;
  }

  private getPropertyIndexes(prop: EntityProperty, options: Dictionary): string[] {
    if (prop.reference === ReferenceType.SCALAR) {
      const ret: string[] = [];

      if (prop.index) {
        ret.push(`@Index({ name: '${prop.index}' })`);
      }

      if (prop.unique) {
        ret.push(`@Unique({ name: '${prop.unique}' })`);
      }

      return ret;
    }

    if (prop.index) {
      options.index = `'${prop.index}'`;
    }

    if (prop.unique) {
      options.unique = `'${prop.unique}'`;
    }

    return [];
  }

  private getCommonDecoratorOptions(options: Dictionary, prop: EntityProperty, columnType: string | undefined) {
    if (columnType) {
      options.columnType = `'${columnType}'`;
    }

    if (prop.nullable) {
      options.nullable = true;
    }

    if (prop.default && typeof prop.default === 'string') {
      if ([`''`, ''].includes(prop.default)) {
        options.default = `''`;
      } else if (prop.default.match(/^'.*'$/)) {
        options.default = prop.default;
      } else {
        options.defaultRaw = `\`${prop.default}\``;
      }
    }
  }

  private getScalarPropertyDecoratorOptions(options: Dictionary, prop: EntityProperty, columnType: string | undefined): void {
    const defaultColumnType = this.helper.getTypeDefinition(prop).replace(/\(\d+\)/, '');

    if (!columnType && prop.columnTypes[0] !== defaultColumnType && prop.type !== columnType) {
      options.columnType = `'${prop.columnTypes[0]}'`;
    }

    if (prop.fieldNames[0] !== this.namingStrategy.propertyToColumnName(prop.name)) {
      options.fieldName = `'${prop.fieldNames[0]}'`;
    }

    if (prop.length && prop.columnTypes[0] !== 'enum') {
      options.length = prop.length;
    }
  }

  private getForeignKeyDecoratorOptions(options: Dictionary, prop: EntityProperty) {
    options.entity = `() => ${this.namingStrategy.getClassName(prop.referencedTableName, '_')}`;

    if (prop.fieldNames[0] !== this.namingStrategy.joinKeyColumnName(prop.name, prop.referencedColumnNames[0])) {
      options.fieldName = `'${prop.fieldNames[0]}'`;
    }

    const cascade = ['Cascade.MERGE'];

    if (prop.onUpdateIntegrity === 'cascade') {
      cascade.push('Cascade.PERSIST');
    }

    if (prop.onDelete === 'cascade') {
      cascade.push('Cascade.REMOVE');
    }

    if (cascade.length === 3) {
      cascade.length = 0;
      cascade.push('Cascade.ALL');
    }

    if (!(cascade.length === 2 && cascade.includes('Cascade.PERSIST') && cascade.includes('Cascade.MERGE'))) {
      options.cascade = `[${cascade.sort().join(', ')}]`;
    }

    if (prop.primary) {
      options.primary = true;
    }
  }

  private getDecoratorType(prop: EntityProperty): string {
    if (prop.reference === ReferenceType.ONE_TO_ONE) {
      return '@OneToOne';
    }

    if (prop.reference === ReferenceType.MANY_TO_ONE) {
      return '@ManyToOne';
    }

    if (prop.primary) {
      return '@PrimaryKey';
    }

    return '@Property';
  }

}
