import { ModuleKind, Project, type PropertyDeclaration, type SourceFile } from 'ts-morph';
import { MetadataError, MetadataProvider, MetadataStorage, ReferenceKind, Utils, type EntityMetadata, type EntityProperty } from '@mikro-orm/core';

export class TsMorphMetadataProvider extends MetadataProvider {

  private readonly project = new Project({
    compilerOptions: {
      strictNullChecks: true,
      module: ModuleKind.Node16,
    },
  });

  private sources!: SourceFile[];

  override useCache(): boolean {
    return this.config.get('metadataCache').enabled ?? true;
  }

  loadEntityMetadata(meta: EntityMetadata, name: string): void {
    if (!meta.path) {
      return;
    }

    this.initProperties(meta);
  }

  getExistingSourceFile(path: string, ext?: string, validate = true): SourceFile {
    if (!ext) {
      return this.getExistingSourceFile(path, '.d.ts', false) || this.getExistingSourceFile(path, '.ts');
    }

    const tsPath = path.match(/.*\/[^/]+$/)![0].replace(/\.js$/, ext);

    return this.getSourceFile(tsPath, validate)!;
  }

  protected initProperties(meta: EntityMetadata): void {
    // load types and column names
    for (const prop of Object.values(meta.properties)) {
      const type = this.extractType(prop);

      if (!type || this.config.get('discovery').alwaysAnalyseProperties) {
        this.initPropertyType(meta, prop);
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

  private initPropertyType(meta: EntityMetadata, prop: EntityProperty): void {
    const { type, optional } = this.readTypeFromSource(meta, prop);
    prop.type = type;

    if (optional) {
      prop.optional = true;
    }

    this.processWrapper(prop, 'Ref');
    this.processWrapper(prop, 'Reference');
    this.processWrapper(prop, 'Ref');
    this.processWrapper(prop, 'Collection');
  }

  private readTypeFromSource(meta: EntityMetadata, prop: EntityProperty): { type: string; optional?: boolean } {
    const source = this.getExistingSourceFile(meta.path);
    const cls = source.getClass(meta.className);

    /* istanbul ignore next */
    if (!cls) {
      throw new MetadataError(`Source class for entity ${meta.className} not found. Verify you have 'compilerOptions.declaration' enabled in your 'tsconfig.json'. If you are using webpack, see https://bit.ly/35pPDNn`);
    }

    const properties = cls.getInstanceProperties();
    const property = properties.find(v => v.getName() === prop.name) as PropertyDeclaration;

    if (!property) {
      return { type: prop.type, optional: prop.nullable };
    }

    const tsType = property.getType();
    const typeName = tsType.getText(property);

    if (prop.enum && tsType.isEnum()) {
      prop.items = tsType.getUnionTypes().map(t => t.getLiteralValueOrThrow()) as string[];
    }

    if (tsType.isArray()) {
      prop.array = true;

      /* istanbul ignore else */
      if (tsType.getArrayElementType()!.isEnum()) {
        prop.items = tsType.getArrayElementType()!.getUnionTypes().map(t => t.getLiteralValueOrThrow()) as string[];
      }
    }

    if (prop.array && prop.enum) {
      prop.enum = false;
    }

    let type = typeName;
    const union = type.split(' | ');
    const optional = property.hasQuestionToken?.() || union.includes('null') || union.includes('undefined');
    type = union.filter(t => !['null', 'undefined'].includes(t)).join(' | ');

    prop.array ??= type.endsWith('[]') || !!type.match(/Array<(.*)>/);
    type = type
      .replace(/Array<(.*)>/, '$1') // unwrap array
      .replace(/\[]$/, '')          // remove array suffix
      .replace(/\((.*)\)/, '$1');   // unwrap union types

    // keep the array suffix in the type, it is needed in few places in discovery and comparator (`prop.array` is used only for enum arrays)
    if (prop.array && !type.includes(' | ') && prop.kind === ReferenceKind.SCALAR) {
      type += '[]';
    }

    return { type, optional };
  }

  private getSourceFile(tsPath: string, validate: boolean): SourceFile | undefined {
    if (!this.sources) {
      this.initSourceFiles();
    }

    const source = this.sources.find(s => s.getFilePath().endsWith(tsPath.replace(/^\.+/, '')));

    if (!source && validate) {
      throw new MetadataError(`Source file '${tsPath}' not found. Check your 'entitiesTs' option and verify you have 'compilerOptions.declaration' enabled in your 'tsconfig.json'. If you are using webpack, see https://bit.ly/35pPDNn`);
    }

    return source;
  }

  private processWrapper(prop: EntityProperty, wrapper: string): void {
    // type can be sometimes in form of:
    // `'({ object?: Entity | undefined; } & import("...").Reference<Entity>)'`
    // `{ object?: import("...").Entity | undefined; } & import("...").Reference<Entity>`
    // `{ node?: ({ id?: number | undefined; } & import("...").Reference<import("...").Entity>) | undefined; } & import("...").Reference<Entity>`
    // the regexp is looking for the `wrapper`, possible prefixed with `.` or wrapped in parens.
    const type = prop.type.replace(/import\(.*\)\./g, '');
    const m = type.match(new RegExp(`(?:^|[.( ])${wrapper}<(\\w+),?.*>(?:$|[) ])`));

    if (!m) {
      return;
    }

    prop.type = m[1];

    if (['Ref', 'Reference', 'Ref'].includes(wrapper)) {
      prop.ref = true;
    }
  }

  private initSourceFiles(): void {
    // All entity files are first required during the discovery, before we reach here, so it is safe to get the parts from the global
    // metadata storage. We know the path thanks the decorators being executed. In case we are running via ts-node, the extension
    // will be already `.ts`, so no change needed. `.js` files will get renamed to `.d.ts` files as they will be used as a source for
    // the ts-morph reflection.
    const paths = Object.values(MetadataStorage.getMetadata()).map(m => m.path.replace(/\.js$/, '.d.ts'));
    this.sources = this.project.addSourceFilesAtPaths(paths);
  }

}
