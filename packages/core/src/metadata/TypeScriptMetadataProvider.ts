import type * as Ast from 'typescript/ast';
import type { ClassDeclaration, Node } from 'typescript/ast';
import type * as Sync from 'typescript/sync';
import type { API, Checker, Program, Type as TsType, TypeReference } from 'typescript/sync';
import { ReferenceKind } from '../enums.js';
import { MetadataError } from '../errors.js';
import type { EntityClass, EntityMetadata, EntityProperty } from '../typings.js';
import { Type } from '../types/Type.js';
import { absolutePath, normalizePath, relativePath } from '../utils/path-utils.js';
import { RawQueryFragment } from '../utils/RawQueryFragment.js';
import { Utils } from '../utils/Utils.js';
import { EntitySchema } from './EntitySchema.js';
import { MetadataProvider } from './MetadataProvider.js';
import { MetadataStorage } from './MetadataStorage.js';

/** A property type as the TypeScript checker reports it, before the provider normalizes it. */
export interface ReflectedPropertyType {
  text: string;
  optional: boolean;
  array: boolean;
  /** Enum values of the type, or of the element type for arrays. */
  enumItems?: (string | number)[];
}

interface Session {
  api: API;
  program: Program;
  checker: Checker;
  sync: typeof Sync;
  ast: typeof Ast;
}

/**
 * Metadata provider that infers property types from TypeScript source files or declaration files via the TypeScript API.
 * Subclasses can read the types with a different compiler by overriding `reflectPropertyType`.
 */
export class TypeScriptMetadataProvider extends MetadataProvider {
  /** Package the TypeScript 7 API is loaded from. */
  protected static apiPackage = 'typescript';

  #session?: Session;
  // `undefined` when the class does not declare the property
  readonly #types = new Map<string, Map<string, ReflectedPropertyType | undefined>>();

  /** Reads the declared type of `prop`, or returns `undefined` when the entity class has no such property. */
  protected reflectPropertyType(meta: EntityMetadata, prop: EntityProperty): ReflectedPropertyType | undefined {
    const key = this.getKey(meta);

    if (!this.#types.get(key)?.has(prop.name)) {
      // the first lookup reflects every registered entity in the same requests
      const prefetch = this.#session
        ? []
        : Utils.values(MetadataStorage.getMetadata()).filter(m => this.getKey(m) !== key);
      this.reflect(meta, prefetch);
    }

    return this.#types.get(key)!.get(prop.name);
  }

  /** Absolute path to the tsconfig file set via `discovery.tsConfigPath`. */
  protected getTsConfigPath(): string {
    /* v8 ignore next */
    return normalizePath(process.cwd(), this.config.get('discovery').tsConfigPath ?? './tsconfig.json');
  }

  /** Paths of the files to read the types from, `.js` entity paths are mapped to their `.d.ts` files. */
  protected getSourcePaths(): string[] {
    return Utils.values(MetadataStorage.getMetadata()).map(meta => {
      const path = normalizePath(meta.path);
      /* v8 ignore next */
      return /\.[jt]s$/.exec(path) ? path.replace(/\.js$/, '.d.ts') : `${path}.d.ts`; // bundled entities have just their name as path
    });
  }

  protected sourceFileNotFound(path: string): MetadataError {
    return new MetadataError(
      `Source file '${relativePath(path, this.config.get('baseDir'))}' not found. Check your 'entitiesTs' option and verify you have 'compilerOptions.declaration' enabled in your 'tsconfig.json'. If you are using webpack, see https://bit.ly/35pPDNn`,
    );
  }

  protected sourceClassNotFound(meta: EntityMetadata): MetadataError {
    return new MetadataError(
      `Source class for entity ${meta.className} not found. Verify you have 'compilerOptions.declaration' enabled in your 'tsconfig.json'. If you are using webpack, see https://bit.ly/35pPDNn`,
    );
  }

  static override useCache(): boolean {
    return true;
  }

  override useCache(): boolean {
    return this.config.get('metadataCache').enabled ?? TypeScriptMetadataProvider.useCache();
  }

  override loadEntityMetadata(meta: EntityMetadata): void {
    if (!meta.path) {
      return;
    }

    try {
      this.initProperties(meta);
    } catch (e) {
      // discovery fails, so `combineCache` would never close the API process
      this.closeSession();
      throw e;
    }
  }

  protected initProperties(meta: EntityMetadata): void {
    meta.path = normalizePath(meta.path);

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
      throw new MetadataError(
        `Relation target needs to be an entity class or EntitySchema instance, '${prop.entity}' given instead for ${meta.className}.${prop.name}.`,
      );
    }

    if (!prop.entity) {
      return { type: prop.type };
    }

    const tmp = prop.entity() as EntityClass;
    const target = EntitySchema.is(tmp) ? tmp.meta.class : tmp;

    return { type: Utils.className(target), target };
  }

  private cleanUpTypeTags(type: string): string {
    const genericTags = [/Opt<(.*?)>/, /Hidden<(.*?)>/, /RequiredNullable<(.*?)>/];
    const intersectionTags = ['Opt.Brand', 'Hidden.Brand', 'RequiredNullable.Brand'];

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

    if (typeRaw != null) {
      prop.type = this.cleanUpTypeTags(typeRaw);
    }

    if (optional) {
      prop.optional = true;
    }

    this.processWrapper(prop, 'Ref');
    this.processWrapper(prop, 'Reference');
    this.processWrapper(prop, 'EntityRef');
    this.processWrapper(prop, 'ScalarRef');
    this.processWrapper(prop, 'ScalarReference');
    // `LazyRef<T>` is a type-only marker — unwrap the type for metadata but do NOT set `ref: true`
    // (there is no `Reference` wrapper at runtime for `LazyRef`). If the user also set `ref: true`
    // explicitly via options, that's a contradiction — the property type promises a plain entity
    // with PK access, but `ref: true` would produce a `Reference` wrapper at runtime.
    const hadLazyRef = /(?:^|[.( ])LazyRef</.test(prop.type.replace(/import\(.*\)\./g, ''));
    this.processWrapper(prop, 'LazyRef');

    if (hadLazyRef && prop.ref) {
      throw new MetadataError(
        `Property '${meta.className}.${prop.name}' is typed as 'LazyRef<T>' but also has 'ref: true' set — these are incompatible. Remove 'ref: true' to keep 'LazyRef' semantics, or change the type to 'Ref<T>'.`,
      );
    }
    this.processWrapper(prop, 'Collection');
    prop.runtimeType ??= prop.type;

    if (/^(Dictionary|Record)<.*>$/.exec(prop.type.replace(/import\(.*\)\./g, ''))) {
      prop.type = 'json';
    }
  }

  private readTypeFromSource(meta: EntityMetadata, prop: EntityProperty): { type: string; optional?: boolean } {
    const reflected = this.reflectPropertyType(meta, prop);

    if (!reflected) {
      return { type: prop.type, optional: prop.nullable };
    }

    if (reflected.enumItems && (prop.enum || reflected.array)) {
      prop.items = reflected.enumItems;
    }

    if (reflected.array) {
      prop.array = true;
    }

    let type = reflected.text;
    const union = type.split(' | ');
    const optional = reflected.optional || union.includes('null') || union.includes('undefined');
    type = union.filter(t => !['null', 'undefined'].includes(t)).join(' | ');

    prop.array ??= type.endsWith('[]') || !!/Array<(.*)>/.exec(type);

    if (prop.array && prop.enum) {
      prop.enum = false;
    }
    type = type
      .replace(/Array<(.*)>/, '$1') // unwrap array
      .replace(/\[]$/, '') // remove array suffix
      .replace(/\((.*)\)/, '$1'); // unwrap union types

    // keep the array suffix in the type, it is needed in few places in discovery and comparator (`prop.array` is used only for enum arrays)
    if (prop.array && !type.includes(' | ') && prop.kind === ReferenceKind.SCALAR) {
      type += '[]';
    }

    return { type, optional };
  }

  private processWrapper(prop: EntityProperty, wrapper: string): void {
    // type can be sometimes in form of:
    // `'({ object?: Entity | undefined; } & import("...").Reference<Entity>)'`
    // `{ object?: import("...").Entity | undefined; } & import("...").Reference<Entity>`
    // `{ node?: ({ id?: number | undefined; } & import("...").Reference<import("...").Entity>) | undefined; } & import("...").Reference<Entity>`
    // the regexp is looking for the `wrapper`, possible prefixed with `.` or wrapped in parens.
    const type = prop.type.replace(/import\(.*\)\./g, '').replace(/\{ .* } & ([\w &]+)/g, '$1');
    const m = new RegExp(`(?:^|[.( ])${wrapper}<(\\w+),?.*>(?:$|[) ])`).exec(type);

    if (!m) {
      return;
    }

    prop.type = m[1];

    if (['Ref', 'Reference', 'EntityRef', 'ScalarRef', 'ScalarReference'].includes(wrapper)) {
      prop.ref = true;
    }
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

    (
      [
        'prototype',
        'props',
        'referencingProperties',
        'propertyOrder',
        'relations',
        'concurrencyCheckKeys',
        'checks',
      ] as const
    ).forEach(key => delete copy[key]);

    // base entity without properties might not have path, but nothing to cache there
    if (meta.path) {
      meta.path = relativePath(meta.path, this.config.get('baseDir'));
      this.config.getMetadataCacheAdapter().set(this.getCacheKey(meta), copy, meta.path);
    }
  }

  override getCacheKey(meta: Pick<EntityMetadata, 'className' | 'path'>): string {
    /* v8 ignore next */
    return meta.className + (meta.path ? globalThis.process.getBuiltinModule('node:path').extname(meta.path) : '');
  }

  // discovery calls this once it is done
  override combineCache(): void {
    this.closeSession();
    super.combineCache();
  }

  private closeSession(): void {
    this.#session?.api.close();
    this.#session = undefined;
    this.#types.clear();
  }

  private getKey(meta: EntityMetadata): string {
    return `${normalizePath(meta.path)}#${meta.className}`;
  }

  private open(): Session {
    const { apiPackage } = this.constructor as typeof TypeScriptMetadataProvider;
    // built-ins are loaded lazily to keep the main entry browser-safe
    const require = globalThis.process.getBuiltinModule('node:module').createRequire(import.meta.url);
    const { existsSync } = globalThis.process.getBuiltinModule('node:fs');
    let sync: typeof Sync;
    let ast: typeof Ast;

    try {
      sync = require(`${apiPackage}/sync`);
      ast = require(`${apiPackage}/ast`);
    } catch (e: any) {
      throw new MetadataError(
        `TypeScriptMetadataProvider could not load the TypeScript 7 API from '${apiPackage}', install 'typescript' 7.1+: ${e.message}`,
      );
    }

    const api = new sync.API({ cwd: process.cwd() });
    let options = {};

    try {
      options = api.parseConfigFile(this.getTsConfigPath()).options;
    } catch (e: any) {
      this.config.getLogger().warn('discovery', e.message);
    }

    const files = this.getSourcePaths()
      .map(path => absolutePath(path))
      .filter(path => existsSync(path));
    const program = api.createProgram([...new Set(files)], {
      ...options,
      strictNullChecks: true,
      module: sync.ModuleKind.Node20,
    });

    return { api, program, checker: program.getProject().checker, sync, ast };
  }

  private findClass(meta: EntityMetadata, required: boolean): ClassDeclaration | undefined {
    const { program, ast } = this.#session!;
    const path = absolutePath(meta.path);
    const source =
      program.getSourceFile(path.replace(/\.js$/, '.d.ts')) ?? program.getSourceFile(path.replace(/\.js$/, '.ts'));
    const cls = source?.statements.find(
      (node): node is ClassDeclaration => ast.isClassDeclaration(node) && node.name?.text === meta.className,
    );

    if (cls || !required) {
      return cls;
    }

    if (!source) {
      throw this.sourceFileNotFound(meta.path.replace(/\.js$/, '.ts'));
    }

    throw this.sourceClassNotFound(meta);
  }

  private reflect(meta: EntityMetadata, prefetch: EntityMetadata[]): void {
    this.#session ??= this.open();
    const { api, checker, sync, ast } = this.#session;
    const { ModifierFlags, SymbolFlags, TypeFlags, TypeFormatFlags } = sync;
    const entities: { key: string; cls: ClassDeclaration; props: string[] }[] = [];

    for (const m of [meta, ...prefetch]) {
      const cls = this.findClass(m, m === meta);

      if (cls) {
        entities.push({ key: this.getKey(m), cls, props: Object.keys(m.properties) });
      }
    }

    // own instance members come from the AST, inherited ones from the checker
    const declarations = new Map<string, Node | undefined>();
    const inherited: { id: string; cls: ClassDeclaration; prop: string }[] = [];

    for (const { key, cls, props } of entities) {
      for (const prop of props) {
        const id = `${key}.${prop}`;
        const member = cls.members.find(
          node =>
            (ast.isPropertyDeclaration(node) ||
              ast.isGetAccessorDeclaration(node) ||
              ast.isSetAccessorDeclaration(node)) &&
            !(node.modifierFlags & ModifierFlags.Static) &&
            'text' in node.name &&
            node.name.text === prop,
        );

        if (member) {
          declarations.set(id, member);
        } else {
          inherited.push({ id, cls, prop });
        }
      }
    }

    const classes = [...new Set(inherited.map(({ cls }) => cls))];
    const classTypes = new Map(checker.getTypeAtLocation(classes).map((type, i) => [classes[i], type]));
    const symbols = api.batch(
      ...inherited.map(({ cls, prop }) => checker.getPropertyOfType.gen(classTypes.get(cls)!, prop)),
    );
    inherited.forEach(({ id }, i) => declarations.set(id, symbols[i]?.declarations[0]?.resolve()));

    const nodes = [...new Set([...declarations.values()].filter(node => node != null))];
    const types = checker.getTypeAtLocation(nodes);
    // ts-morph's default flags for `Type.getText()`
    const flags =
      TypeFormatFlags.UseTypeOfFunction |
      TypeFormatFlags.NoTruncation |
      TypeFormatFlags.UseFullyQualifiedType |
      TypeFormatFlags.WriteTypeArgumentsOfSignature;
    const texts = api.batch(...types.map((type, i) => checker.typeToString.gen(type, nodes[i], flags)));
    const arrays = api.batch(...types.map(type => checker.isArrayType.gen(type)));

    const arrayTypes = types.filter((type, i): type is TypeReference => arrays[i] && type.isTypeReference());
    const typeArguments = api.batch(...arrayTypes.map(type => checker.getTypeArguments.gen(type)));
    const elementTypes = new Map<TsType, TsType>(arrayTypes.map((type, i) => [type, typeArguments[i][0]]));

    const enumCandidates = types.map(type => elementTypes.get(type) ?? type);
    const enumUnions = [
      ...new Set(enumCandidates.filter(type => type.flags & TypeFlags.EnumLiteral && type.flags & TypeFlags.Union)),
    ];
    const enumSymbols = api.batch(...enumUnions.map(type => type.getSymbol.gen()));
    const enums = new Set(enumUnions.filter((type, i) => (enumSymbols[i]?.flags ?? 0) & SymbolFlags.Enum));
    const unions = [...new Set([...types, ...enums].filter(type => type.isUnionType()))];
    const unionMembers = new Map<TsType, readonly TsType[]>(
      api.batch(...unions.map(type => type.getTypes.gen())).map((members, i) => [unions[i], members]),
    );

    const reflected = new Map(
      nodes.map((node, i): [Node, ReflectedPropertyType] => {
        const type = types[i];
        const enumType = enumCandidates[i];
        const hasQuestionToken =
          ((ast.isPropertyDeclaration(node) || ast.isPropertySignatureDeclaration(node)) &&
            node.postfixToken?.kind === ast.SyntaxKind.QuestionToken) ||
          (ast.isParameterDeclaration(node) && !!node.questionToken);
        const isEnum = !!(enumType.flags & TypeFlags.Enum) || enums.has(enumType);

        return [
          node,
          {
            text: texts[i],
            optional:
              hasQuestionToken ||
              !!unionMembers.get(type)?.some(member => member.flags & (TypeFlags.Null | TypeFlags.Undefined)),
            array: arrays[i],
            enumItems: isEnum
              ? (unionMembers.get(enumType) ?? [])
                  .filter(member => member.isLiteralType())
                  .map(member => member.value as string | number)
              : undefined,
          },
        ];
      }),
    );

    for (const { key, props } of entities) {
      const propTypes = this.#types.get(key) ?? new Map<string, ReflectedPropertyType | undefined>();
      this.#types.set(key, propTypes);

      for (const prop of props) {
        const node = declarations.get(`${key}.${prop}`);
        propTypes.set(prop, node && reflected.get(node));
      }
    }
  }
}
