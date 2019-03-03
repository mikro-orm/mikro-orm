import Project, { ClassInstancePropertyTypes, SourceFile } from 'ts-morph';
import { join } from 'path';
import { existsSync } from 'fs';

import { MetadataProvider } from './MetadataProvider';
import { EntityMetadata } from '../decorators/Entity';
import { Utils } from '../utils/Utils';
import { MikroORMOptions } from '../MikroORM';

export class TypeScriptMetadataProvider extends MetadataProvider {

  private readonly project: Project;
  private readonly sources: SourceFile[];

  constructor(protected readonly options: MikroORMOptions) {
    super(options);
    this.project = new Project();

    if (!this.options.entitiesDirsTs) {
      this.options.entitiesDirsTs = this.options.entitiesDirs;
    }

    const dirs = this.options.entitiesDirsTs.map(dir => {
      const path = join(this.options.baseDir, dir);

      if (!existsSync(path)) {
        throw new Error(`Path ${path} does not exist`);
      }

      return join(path, '**', '*.ts');
    });

    this.sources = this.project.addExistingSourceFiles(dirs);
  }

  discoverEntity(meta: EntityMetadata, name: string): void {
    const file = meta.path.match(/\/[^\/]+$/)![0].replace(/\.js$/, '.ts');
    const source = this.sources.find(s => !!s.getFilePath().match(file));
    const properties = source!.getClass(name)!.getInstanceProperties();
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

}
