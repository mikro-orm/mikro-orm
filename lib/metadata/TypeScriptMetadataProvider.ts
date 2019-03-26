import Project, { ClassInstancePropertyTypes, SourceFile } from 'ts-morph';
import { join } from 'path';
import { existsSync } from 'fs';

import { MetadataProvider } from './MetadataProvider';
import { EntityMetadata } from '../decorators';
import { Utils } from '../utils';

export class TypeScriptMetadataProvider extends MetadataProvider {

  private readonly project = new Project();
  private sources: SourceFile[];

  async loadEntityMetadata(meta: EntityMetadata, name: string): Promise<void> {
    if (!meta.path) {
      return;
    }

    const file = meta.path.match(/\/[^\/]+$/)![0].replace(/\.js$/, '.ts');
    const source = this.getSourceFile(file);

    if (!source) {
      throw new Error(`Source file for entity ${name} not found, check your 'entitiesDirsTs' option`);
    }

    const properties = source.getClass(name)!.getInstanceProperties();
    this.initProperties(meta, properties);
  }

  private initProperties(meta: EntityMetadata, properties: ClassInstancePropertyTypes[]): void {
    // init types and column names
    Object.values(meta.properties).forEach(prop => {
      if (prop.entity) {
        prop.type = Utils.className(prop.entity());
      } else if (!prop.type) {
        const property = properties.find(v => v.getName() === prop.name);
        prop.type = property!.getType().getText(property);
      }
    });
  }

  private getSourceFile(file: string): SourceFile | undefined {
    if (!this.sources) {
      this.initSourceFiles();
    }

    return this.sources.find(s => s.getFilePath().endsWith(file));
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
