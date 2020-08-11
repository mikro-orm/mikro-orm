import { Project, PropertyDeclaration, SourceFile } from 'ts-morph';
import { EntityMetadata, EntityProperty, MetadataError, MetadataProvider, MetadataStorage, Utils } from '@mikro-orm/core';

export class TsMorphMetadataProvider extends MetadataProvider {

  private readonly project = new Project({
    compilerOptions: {
      strictNullChecks: true,
    },
  });

  private sources!: SourceFile[];

  useCache(): boolean {
    return this.config.get('cache').enabled ?? true;
  }

  async loadEntityMetadata(meta: EntityMetadata, name: string): Promise<void> {
    if (!meta.path) {
      return;
    }

    await this.initProperties(meta);
  }

  async getExistingSourceFile(path: string, ext?: string, validate = true): Promise<SourceFile> {
    if (!ext) {
      return await this.getExistingSourceFile(path, '.d.ts', false) || await this.getExistingSourceFile(path, '.ts');
    }

    const tsPath = path.match(/.*\/[^/]+$/)![0].replace(/\.js$/, ext);

    return (await this.getSourceFile(tsPath, validate))!;
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
    const source = await this.getExistingSourceFile(meta.path);
    const cls = source.getClass(meta.className);

    /* istanbul ignore next */
    if (!cls) {
      throw new MetadataError(`Source class for entity ${meta.className} not found. Verify you have 'compilerOptions.declaration' enabled in your 'tsconfig.json'. If you are using webpack, see https://bit.ly/35pPDNn`);
    }

    const properties = cls.getInstanceProperties();
    const property = properties.find(v => v.getName() === prop.name) as PropertyDeclaration;

    /* istanbul ignore next */
    if (!property) {
      return { type: prop.type, optional: prop.nullable };
    }

    let type = property.getType().getText(property);
    const union = type.split(' | ');
    /* istanbul ignore next */
    const optional = property.hasQuestionToken?.() || union.includes('null') || union.includes('undefined');
    type = union.filter(t => !['null', 'undefined'].includes(t)).join(' | ');

    return { type, optional };
  }

  private async getSourceFile(tsPath: string, validate: boolean): Promise<SourceFile | undefined> {
    if (!this.sources) {
      await this.initSourceFiles();
    }

    const source = this.sources.find(s => s.getFilePath().endsWith(tsPath.replace(/^\./, '')));

    if (!source && validate) {
      throw new MetadataError(`Source file '${tsPath}' not found. Check your 'entitiesTs' option and verify you have 'compilerOptions.declaration' enabled in your 'tsconfig.json'. If you are using webpack, see https://bit.ly/35pPDNn`);
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
    // All entity files are first required during the discovery, before we reach here, so it is safe to get the parts from the global
    // metadata storage. We know the path thanks the the decorators being executed. In case we are running via ts-node, the extension
    // will be already `.ts`, so no change needed. `.js` files will get renamed to `.d.ts` files as they will be used as a source for
    // the ts-morph reflection.
    const paths = Object.values(MetadataStorage.getMetadata()).map(m => m.path.replace(/\.js$/, '.d.ts'));
    this.sources = this.project.addSourceFilesAtPaths(paths);
  }

}
