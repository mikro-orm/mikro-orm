import Project, { SourceFile } from 'ts-morph';
import { join } from 'path';
import { existsSync } from 'fs';

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

    this.initProperties(meta, name);
  }

  private initProperties(meta: EntityMetadata, name: string): void {
    // init types and column names
    Object.values(meta.properties).forEach(prop => {
      if (prop.entity) {
        prop.type = Utils.className(prop.entity());
      } else if (!prop.type) {
        const file = meta.path.match(/\/[^\/]+$/)![0].replace(/\.js$/, '.ts');
        prop.type = this.readTypeFromSource(file, name, prop);
      }
    });
  }

  private readTypeFromSource(file: string, name: string, prop: EntityProperty): string {
    const source = this.getSourceFile(file);
    const properties = source.getClass(name)!.getInstanceProperties();
    const property = properties.find(v => v.getName() === prop.name);

    return property!.getType().getText(property);
  }

  private getSourceFile(file: string): SourceFile {
    if (!this.sources) {
      this.initSourceFiles();
    }

    const source = this.sources.find(s => s.getFilePath().endsWith(file));

    if (!source) {
      throw new Error(`Source file for entity ${name} not found, check your 'entitiesDirsTs' option`);
    }

    return source;
  }

  private initSourceFiles(): void {
    const tsDirs = this.config.get('entitiesDirsTs');

    if (tsDirs.length > 0) {
      const dirs = this.validateDirectories(tsDirs);
      this.sources = this.project.addExistingSourceFiles(dirs);
    } else {
      this.sources = this.project.addSourceFilesFromTsConfig(this.config.get('tsConfigPath'));
    }
  }

  private validateDirectories(dirs: string[]): string[] {
    return dirs.map(dir => {
      const path = join(this.config.get('baseDir'), dir);

      if (!existsSync(path)) {
        throw new Error(`Path ${path} does not exist`);
      }

      return join(path, '**', '*.ts');
    });
  }

}
