import { ModuleKind, Project, type PropertyDeclaration, type SourceFile } from 'ts-morph';
import {
  MetadataError,
  MetadataProvider,
  MetadataStorage,
  ReferenceKind,
  Utils,
  type EntityMetadata,
  type EntityProperty,
  ConfigurationLoader,
} from '@mikro-orm/core';

export class TsMorphMetadataProvider extends MetadataProvider {

  private project!: Project;
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

  private cleanUpTypeTags(type: string): string {
    const genericTags = [/Opt<(.*?)>/, /Hidden<(.*?)>/];
    const intersectionTags = [
      '{ [__optional]?: 1 | undefined; }',
      '{ [__optional]?: 1; }',
      '{ [__hidden]?: 1 | undefined; }',
      '{ [__hidden]?: 1; }',
    ];

    for (const tag of genericTags) {
      type = type.replace(tag, '$1');
    }

    for (const tag of intersectionTags) {
      type = type.replace(' & ' + tag, '');
      type = type.replace(tag + ' & ', '');
    }

    return type;
  }

  private initPropertyType(meta: EntityMetadata, prop: EntityProperty): void {
    const { type: typeRaw, optional } = this.readTypeFromSource(meta, prop);
    const type = this.cleanUpTypeTags(typeRaw);
    prop.type = type;
    prop.runtimeType = type as 'string';

    if (optional) {
      prop.optional = true;
    }

    this.processWrapper(prop, 'Ref');
    this.processWrapper(prop, 'Reference');
    this.processWrapper(prop, 'ScalarReference');
    this.processWrapper(prop, 'Ref');
    this.processWrapper(prop, 'Collection');

    if (prop.type.replace(/import\(.*\)\./g, '').match(/^(Dictionary|Record)<.*>$/)) {
      prop.type = 'json';
    }
  }

  private readTypeFromSource(meta: EntityMetadata, prop: EntityProperty): { type: string; optional?: boolean } {
    const source = this.getExistingSourceFile(meta.path);
    const cls = source.getClass(meta.className);

    /* v8 ignore next 3 */
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

      /* v8 ignore next 3 */
      if (tsType.getArrayElementType()!.isEnum()) {
        prop.items = tsType.getArrayElementType()!.getUnionTypes().map(t => t.getLiteralValueOrThrow()) as string[];
      }
    }

    if (prop.array && prop.enum) {
      prop.enum = false;
    }

    let type = typeName;
    const union = type.split(' | ');
    const optional = property.hasQuestionToken?.() || union.includes('null') || union.includes('undefined') || tsType.isNullable();
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

    const baseDir = this.config.get('baseDir');
    const outDir = this.project.getCompilerOptions().outDir;
    let path = tsPath;

    if (outDir != null) {
      const outDirRelative = Utils.relativePath(outDir, baseDir);
      path = path.replace(new RegExp(`^${outDirRelative}`), '');
    }

    path = Utils.stripRelativePath(path);
    const source = this.sources.find(s => s.getFilePath().endsWith(path));

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
    const type = prop.type
      .replace(/import\(.*\)\./g, '')
      .replace(/\{ .* } & ([\w &]+)/g, '$1');
    const m = type.match(new RegExp(`(?:^|[.( ])${wrapper}<(\\w+),?.*>(?:$|[) ])`));

    if (!m) {
      return;
    }

    prop.type = m[1];

    if (['Ref', 'Reference', 'Ref'].includes(wrapper)) {
      prop.ref = true;
    }
  }

  private initProject(): void {
    const settings = ConfigurationLoader.getSettings();
    /* v8 ignore next */
    const tsConfigFilePath = this.config.get('discovery').tsConfigPath ?? settings.tsConfigPath ?? './tsconfig.json';

    try {
      this.project = new Project({
        tsConfigFilePath: Utils.normalizePath(process.cwd(), tsConfigFilePath),
        skipAddingFilesFromTsConfig: true,
        compilerOptions: {
          strictNullChecks: true,
          module: ModuleKind.Node16,
        },
      });
    } catch (e: any) {
      this.config.getLogger().warn('discovery', e.message);
      this.project = new Project({
        compilerOptions: {
          strictNullChecks: true,
          module: ModuleKind.Node16,
        },
      });
    }
  }

  private initSourceFiles(): void {
    if (!this.project) {
      this.initProject();
    }

    this.sources = [];

    // All entity files are first required during the discovery, before we reach here, so it is safe to get the parts from the global
    // metadata storage. We know the path thanks to the decorators being executed. In case we are running the TS code, the extension
    // will be already `.ts`, so no change is needed. `.js` files will get renamed to `.d.ts` files as they will be used as a source for
    // the ts-morph reflection.
    for (const meta of Utils.values(MetadataStorage.getMetadata())) {
      /* v8 ignore next 3 */
      const path = meta.path.match(/\.[jt]s$/)
        ? meta.path.replace(/\.js$/, '.d.ts')
        : `${meta.path}.d.ts`; // when entities are bundled, their paths are just their names
      const sourceFile = this.project.addSourceFileAtPathIfExists(path);

      if (sourceFile) {
        this.sources.push(sourceFile);
      }
    }
  }

}
