import { ReferenceKind } from '../enums.js';
import { MetadataError } from '../errors.js';
import type { EntityClass, EntityMetadata, EntityProperty } from '../typings.js';
import { Type } from '../types/Type.js';
import { normalizePath, relativePath } from '../utils/path-utils.js';
import { RawQueryFragment } from '../utils/RawQueryFragment.js';
import { Utils } from '../utils/Utils.js';
import { EntitySchema } from './EntitySchema.js';
import { MetadataProvider } from './MetadataProvider.js';

/** A property type as the TypeScript checker reports it, before the provider normalizes it. */
export interface ReflectedPropertyType {
  text: string;
  optional: boolean;
  array: boolean;
  /** Enum values of the type, or of the element type for arrays. */
  enumItems?: (string | number)[];
}

/**
 * Base for metadata providers that infer property types from TypeScript source files or declaration files.
 * Subclasses report each property's type via `reflectPropertyType`, this class normalizes it and handles the metadata cache.
 */
export abstract class AbstractTypeScriptMetadataProvider extends MetadataProvider {
  static override useCache(): boolean {
    return true;
  }

  override useCache(): boolean {
    return this.config.get('metadataCache').enabled ?? AbstractTypeScriptMetadataProvider.useCache();
  }

  override loadEntityMetadata(meta: EntityMetadata): void {
    if (!meta.path) {
      return;
    }

    this.initProperties(meta);
  }

  /** Reads the declared type of `prop`, or returns `undefined` when the entity class has no such property. */
  protected abstract reflectPropertyType(meta: EntityMetadata, prop: EntityProperty): ReflectedPropertyType | undefined;

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
      throw new Error(
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
}
