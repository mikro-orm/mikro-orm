import Project, { ClassInstancePropertyTypes, SourceFile } from 'ts-morph';
import { join } from 'path';
import { existsSync } from 'fs';

import { MetadataProvider } from './MetadataProvider';
import { EntityMetadata } from '../decorators/Entity';
import { Utils } from '../utils/Utils';

export class TypeScriptMetadataProvider extends MetadataProvider {

  private readonly project = new Project();
  private sources: SourceFile[];

  discoverEntity(meta: EntityMetadata, name: string): void {
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
      } else {
        const old = prop.type;
        const property = properties.find(v => v.getName() === prop.name);
        prop.type = property!.getType().getText(property);

        if (prop.type === 'any' && old) {
          prop.type = old;
        }
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
    if (this.options.entitiesDirsTs.length === 0) {
      this.options.entitiesDirsTs = this.options.entitiesDirs;
    }

    if (this.options.entitiesDirsTs.length > 0) {
      const dirs = this.validateDirectories(this.options.entitiesDirsTs);
      this.sources = this.project.addExistingSourceFiles(dirs);
    } else {
      this.sources = this.project.addSourceFilesFromTsConfig(this.options.tsConfigPath);
    }
  }

  private validateDirectories(dirs: string[]): string[] {
    return dirs.map(dir => {
      const path = join(this.options.baseDir, dir);

      if (!existsSync(path)) {
        throw new Error(`Path ${path} does not exist`);
      }

      return join(path, '**', '*.ts');
    });
  }

}
