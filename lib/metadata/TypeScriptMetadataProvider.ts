import { Project, SourceFile } from 'ts-morph';
import { pathExists } from 'fs-extra';

import { MetadataProvider } from './MetadataProvider';
import { EntityMetadata, EntityProperty } from '../decorators';
import { Utils } from '../utils';

export class TypeScriptMetadataProvider extends MetadataProvider {

  private readonly project = new Project();
  private sources: SourceFile[];

  async loadEntityMetadata(meta: EntityMetadata, name: string): Promise<void> {
    if (!meta.path) {
      return;
    }

    await this.initProperties(meta, name);
  }

  private async initProperties(meta: EntityMetadata, name: string): Promise<void> {
    // load types and column names
    for (const prop of Object.values(meta.properties)) {
      if (prop.entity) {
        prop.type = Utils.className(prop.entity());
      } else if (!prop.type) {
        const file = meta.path.match(/\/[^\/]+$/)![0].replace(/\.js$/, '.ts');
        prop.type = await this.readTypeFromSource(file, name, prop);
        this.processReferenceWrapper(prop);
      }
    }
  }

  private async readTypeFromSource(file: string, name: string, prop: EntityProperty): Promise<string> {
    const source = await this.getSourceFile(file);
    const properties = source.getClass(name)!.getInstanceProperties();
    const property = properties.find(v => v.getName() === prop.name);

    return property!.getType().getText(property);
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

  private processReferenceWrapper(prop: EntityProperty): void {
    const m = prop.type.match(/^IdentifiedReference<(\w+),?.*>$/);

    if (m) {
      prop.type = m[1];
      prop.wrappedReference = true;
    }
  }

  private async initSourceFiles(): Promise<void> {
    const tsDirs = this.config.get('entitiesDirsTs');

    if (tsDirs.length > 0) {
      const dirs = await this.validateDirectories(tsDirs);
      this.sources = this.project.addExistingSourceFiles(dirs);
    } else {
      this.sources = this.project.addSourceFilesFromTsConfig(this.config.get('tsConfigPath'));
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
