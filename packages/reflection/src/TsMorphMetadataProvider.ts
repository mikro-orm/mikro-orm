import { extname } from 'node:path';
import { ComputedPropertyName, ModuleKind, NoSubstitutionTemplateLiteral, Project, StringLiteral, type PropertyDeclaration, type SourceFile } from 'ts-morph';
import {
  type EntityClass,
  type EntityMetadata,
  type EntityProperty,
  EntitySchema,
  MetadataError,
  MetadataProvider,
  MetadataStorage,
  RawQueryFragment,
  ReferenceKind,
  Type,
  Utils,
} from '@mikro-orm/core';
import { fs } from '@mikro-orm/core/fs-utils';

export class TsMorphMetadataProvider extends MetadataProvider {

  private project!: Project;
  private sources!: SourceFile[];

  static override useCache(): boolean {
    return true;
  }

  override useCache(): boolean {
    return this.config.get('metadataCache').enabled ?? TsMorphMetadataProvider.useCache();
  }

  override loadEntityMetadata(meta: EntityMetadata): void {
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
    meta.path = fs.normalizePath(meta.path);

    // load types and column names
    for (const prop of Object.values(meta.properties)) {
      const { type, target } = this.extractType(meta, prop);
      this.initPropertyType(meta, prop);
      prop.type = type ?? prop.type;
      prop.target = target!;
    }
  }

  private extractType(meta: EntityMetadata, prop: EntityProperty): { type: string; target?: EntityClass } {
    /* v8 ignore next */
    if (typeof prop.entity === 'string') {
      throw new Error(`Relation target needs to be an entity class or EntitySchema instance, '${prop.entity}' given instead for ${meta.className}.${prop.name}.`);
    }

    if (!prop.entity) {
      return { type: prop.type };
    }

    const tmp = prop.entity() as EntityClass;
    const target = tmp instanceof EntitySchema ? tmp.meta.class : tmp;

    return { type: Utils.className(target), target };
  }

  private cleanUpTypeTags(type: string): string {
    const genericTags = [/Opt<(.*?)>/, /Hidden<(.*?)>/, /RequiredNullable<(.*?)>/];
    const intersectionTags = [
      'Opt.Brand',
      'Hidden.Brand',
      'RequiredNullable.Brand',
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
    prop.type = this.cleanUpTypeTags(typeRaw);

    if (optional) {
      prop.optional = true;
    }

    this.processWrapper(prop, 'Ref');
    this.processWrapper(prop, 'Reference');
    this.processWrapper(prop, 'EntityRef');
    this.processWrapper(prop, 'ScalarRef');
    this.processWrapper(prop, 'ScalarReference');
    this.processWrapper(prop, 'Collection');
    prop.runtimeType ??= prop.type;

    if (prop.type.replace(/import\(.*\)\./g, '').match(/^(Dictionary|Record)<.*>$/)) {
      prop.type = 'json';
    }
  }

  private readTypeFromSource(meta: EntityMetadata, prop: EntityProperty): { type: string; optional?: boolean } {
    const source = this.getExistingSourceFile(meta.path);
    const cls = source.getClass(meta.className);

    /* v8 ignore next */
    if (!cls) {
      throw new MetadataError(`Source class for entity ${meta.className} not found. Verify you have 'compilerOptions.declaration' enabled in your 'tsconfig.json'. If you are using webpack, see https://bit.ly/35pPDNn`);
    }

    const properties = cls.getInstanceProperties();
    const property = properties.find(v => {
      if (v.getName() === prop.name) {
        return true;
      }

      const nameNode = v.getNameNode();

      if (nameNode instanceof StringLiteral && nameNode.getLiteralText() === prop.name) {
        return true;
      }

      if (nameNode instanceof ComputedPropertyName) {
        const expr = nameNode.getExpression();
        if (expr instanceof NoSubstitutionTemplateLiteral && expr.getLiteralText() === prop.name) {
          return true;
        }
      }

      return false;
    }) as PropertyDeclaration | undefined;

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

      /* v8 ignore next */
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

    /* v8 ignore next */
    if (outDir != null) {
      const outDirRelative = fs.relativePath(outDir, baseDir);
      path = path.replace(new RegExp(`^${outDirRelative}`), '');
    }

    path = this.stripRelativePath(path);
    const source = this.sources.find(s => s.getFilePath().endsWith(path));

    if (!source && validate) {
      throw new MetadataError(`Source file '${fs.relativePath(tsPath, baseDir)}' not found. Check your 'entitiesTs' option and verify you have 'compilerOptions.declaration' enabled in your 'tsconfig.json'. If you are using webpack, see https://bit.ly/35pPDNn`);
    }

    return source;
  }

  private stripRelativePath(str: string): string {
    return str.replace(/^(?:\.\.\/|\.\/)+/, '/');
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

    if (['Ref', 'Reference', 'EntityRef', 'ScalarRef', 'ScalarReference'].includes(wrapper)) {
      prop.ref = true;
    }
  }

  private initProject(): void {
    /* v8 ignore next */
    const tsConfigFilePath = this.config.get('discovery').tsConfigPath ?? './tsconfig.json';

    try {
      this.project = new Project({
        tsConfigFilePath: fs.normalizePath(process.cwd(), tsConfigFilePath),
        skipAddingFilesFromTsConfig: true,
        compilerOptions: {
          strictNullChecks: true,
          module: ModuleKind.Node20,
        },
      });
    } catch (e: any) {
      this.config.getLogger().warn('discovery', e.message);
      this.project = new Project({
        compilerOptions: {
          strictNullChecks: true,
          module: ModuleKind.Node20,
        },
      });
    }
  }

  private initSourceFiles(): void {
    this.initProject();
    this.sources = [];

    // All entity files are first required during the discovery, before we reach here, so it is safe to get the parts from the global
    // metadata storage. We know the path thanks to the decorators being executed. In case we are running the TS code, the extension
    // will be already `.ts`, so no change is needed. `.js` files will get renamed to `.d.ts` files as they will be used as a source for
    // the ts-morph reflection.
    for (const meta of Utils.values(MetadataStorage.getMetadata())) {
      const metaPath = fs.normalizePath(meta.path);
      /* v8 ignore next */
      const path = metaPath.match(/\.[jt]s$/)
        ? metaPath.replace(/\.js$/, '.d.ts')
        : `${metaPath}.d.ts`; // when entities are bundled, their paths are just their names
      const sourceFile = this.project.addSourceFileAtPathIfExists(path);

      if (sourceFile) {
        this.sources.push(sourceFile);
      }
    }
  }

  override loadFromCache(meta: EntityMetadata, cache: EntityMetadata): void {
    Object.values(cache.properties).forEach(prop => {
      const metaProp = meta.properties[prop.name];

      /* v8 ignore next */
      if (metaProp?.enum && Array.isArray(metaProp.items)) {
        delete prop.items;
      }
    });

    Utils.mergeConfig(meta, cache);
  }

  override saveToCache(meta: EntityMetadata): void {
    if (!this.useCache()) {
      return;
    }

    Reflect.deleteProperty(meta, 'root'); // to allow caching (as root can contain cycles)
    const copy = Utils.copy(meta, false);

    for (const prop of copy.props) {
      if (Type.isMappedType(prop.type)) {
        Reflect.deleteProperty(prop, 'type');
        Reflect.deleteProperty(prop, 'customType');
      }

      if (prop.default) {
        const raw = RawQueryFragment.getKnownFragment(prop.default as string);

        if (raw) {
          prop.defaultRaw ??= this.config.getPlatform().formatQuery(raw.sql, raw.params);
          Reflect.deleteProperty(prop, 'default');
        }
      }

      Reflect.deleteProperty(prop, 'targetMeta');
    }

    ([
      'prototype', 'props', 'referencingProperties', 'propertyOrder', 'relations',
      'concurrencyCheckKeys', 'checks',
    ] as const).forEach(key => delete copy[key]);

    // base entity without properties might not have path, but nothing to cache there
    if (meta.path) {
      meta.path = fs.relativePath(meta.path, this.config.get('baseDir'));
      this.config.getMetadataCacheAdapter().set(this.getCacheKey(meta), copy, meta.path);
    }
  }

  override getCacheKey(meta: Pick<EntityMetadata, 'className' | 'path'>): string {
    /* v8 ignore next */
    return meta.className + (meta.path ? extname(meta.path) : '');
  }

}
