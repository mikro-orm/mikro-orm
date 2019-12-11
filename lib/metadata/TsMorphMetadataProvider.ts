import { Project, PropertyDeclaration, SourceFile } from 'ts-morph';
import { pathExists } from 'fs-extra';

import { MetadataProvider } from './MetadataProvider';
import { EntityMetadata, EntityProperty } from '../types';
import { Utils } from '../utils';

export class TsMorphMetadataProvider extends MetadataProvider {

  private readonly project = new Project();
  private sources!: SourceFile[];

  async loadEntityMetadata(meta: EntityMetadata, name: string): Promise<void> {
    if (!meta.path) {
      return;
    }

    await this.initProperties(meta);
  }

  async getExistingSourceFile(meta: EntityMetadata): Promise<SourceFile> {
    const path = meta.path.match(/\/[^\/]+$/)![0].replace(/\.js$/, '.ts');
    return this.getSourceFile(path)!;
  }

  protected async initProperties(meta: EntityMetadata): Promise<void> {
    // load types and column names
    for (const prop of Object.values(meta.properties)) {
      const type = this.extractType(prop);

      if (!type || this.config.get('discovery').alwaysAnalyseProperties) {
        await this.initPropertyType(meta, prop);
      }

      prop.type = type || prop.type;
    }
  }

  private extractType(prop: EntityProperty): string {
    if (Utils.isString(prop.entity)) {
      return prop.entity;
    }

    if (prop.entity) {
      return Utils.className(prop.entity());
    }

    return prop.type;
  }

  private async initPropertyType(meta: EntityMetadata, prop: EntityProperty): Promise<void> {
    const { type, optional } = await this.readTypeFromSource(meta, prop);
    prop.type = type;

    if (optional) {
      prop.nullable = true;
    }

    this.processWrapper(prop, 'IdentifiedReference');
    this.processWrapper(prop, 'Collection');
  }

  private async readTypeFromSource(meta: EntityMetadata, prop: EntityProperty): Promise<{ type: string; optional?: boolean }> {
    const source = await this.getExistingSourceFile(meta);
    const properties = source.getClass(meta.className)!.getInstanceProperties();
    const property = properties.find(v => v.getName() === prop.name) as PropertyDeclaration;

    if (!property) {
      return { type: prop.type, optional: prop.nullable };
    }

    const type = property.getType().getText(property);
    const optional = property.hasQuestionToken ? property.hasQuestionToken() : undefined;

    return { type, optional };
  }

  private async getSourceFile(file: string): Promise<SourceFile> {
    if (!this.sources) {
      await this.initSourceFiles();
    }

    const source = this.sources.find(s => s.getFilePath().endsWith(file));

    if (!source) {
      throw new Error(`Source file for entity ${file} not found, check your 'entitiesDirsTs' option`);
    }

    return source;
  }

  private processWrapper(prop: EntityProperty, wrapper: string): void {
    const m = prop.type.match(new RegExp(`^${wrapper}<(\\w+),?.*>$`));

    if (!m) {
      return;
    }

    prop.type = m[1];

    if (wrapper === 'IdentifiedReference') {
      prop.wrappedReference = true;
    }
  }

  private async initSourceFiles(): Promise<void> {
    const tsDirs = this.config.get('entitiesDirsTs');

    if (tsDirs.length > 0) {
      const dirs = await this.validateDirectories(tsDirs);
      this.sources = this.project.addExistingSourceFiles(dirs);
    } else {
      this.sources = this.project.addSourceFilesFromTsConfig(this.config.get('discovery').tsConfigPath!);
    }
  }

  private async validateDirectories(dirs: string[]): Promise<string[]> {
    const ret: string[] = [];

    for (const dir of dirs) {
      const path = Utils.normalizePath(this.config.get('baseDir'), dir);

      if (!await pathExists(path)) {
        throw new Error(`Path ${path} does not exist`);
      }

      ret.push(Utils.normalizePath(path, '**', '*.ts'));
    }

    return ret;
  }

}
