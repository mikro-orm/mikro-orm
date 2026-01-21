import { type Dictionary, type EntityCtor, EntityMetadata, type EntityName } from '../typings.js';
import { Utils } from '../utils/Utils.js';
import { MetadataError } from '../errors.js';
import type { EntityManager } from '../EntityManager.js';
import { EntityHelper } from '../entity/EntityHelper.js';
import { EntitySchema } from './EntitySchema.js';

function getGlobalStorage(namespace: string): Dictionary {
  const key = `mikro-orm-${namespace}` as keyof typeof globalThis;
  (globalThis as Dictionary)[key] = globalThis[key] || {};

  return globalThis[key];
}

export class MetadataStorage {

  static readonly PATH_SYMBOL = Symbol('MetadataStorage.PATH_SYMBOL');

  private static readonly metadata: Dictionary<EntityMetadata> = getGlobalStorage('metadata');
  private readonly metadata = new Map<EntityName, EntityMetadata>();
  private readonly idMap: Record<number, EntityMetadata>;
  private readonly classNameMap: Record<string, EntityMetadata>;
  private readonly uniqueNameMap: Record<string, EntityMetadata>;

  constructor(metadata: Dictionary<EntityMetadata> = {}) {
    this.idMap = {};
    this.uniqueNameMap = {};
    this.classNameMap = Utils.copy(metadata, false);

    for (const meta of Object.values(this.classNameMap)) {
      this.idMap[meta._id] = meta;
      this.uniqueNameMap[meta.uniqueName] = meta;
      this.metadata.set(meta.class, meta);
    }
  }

  static getMetadata(): Dictionary<EntityMetadata>;
  static getMetadata<T = any>(entity: string, path: string): EntityMetadata<T>;
  static getMetadata<T = any>(entity?: string, path?: string): Dictionary<EntityMetadata> | EntityMetadata<T> {
    const key = entity && path ? entity + '-' + Utils.hash(path) : null;

    if (key && !MetadataStorage.metadata[key]) {
      MetadataStorage.metadata[key] = new EntityMetadata({ className: entity, path });
    }

    if (key) {
      return MetadataStorage.metadata[key];
    }

    return MetadataStorage.metadata;
  }

  static isKnownEntity(name: string): boolean {
    return !!Object.values(this.metadata).find(meta => meta.className === name);
  }

  static clear(): void {
    Object.keys(this.metadata).forEach(k => delete this.metadata[k]);
  }

  getAll(): Map<EntityName, EntityMetadata> {
    return this.metadata;
  }

  get<T = any>(entityName: EntityName<T>, init = false): EntityMetadata<T> {
    const exists = this.find(entityName);

    if (exists) {
      return exists;
    }

    const className = Utils.className(entityName);

    if (!init) {
      throw MetadataError.missingMetadata(className);
    }

    const meta = new EntityMetadata({ class: entityName as EntityCtor, name: className });
    this.set(entityName, meta);

    return meta;
  }

  find<T = any>(entityName: EntityName<T>): EntityMetadata<T> | undefined {
    if (!entityName) {
      return;
    }

    const meta = this.metadata.get(entityName);

    if (meta) {
      return meta;
    }

    if (entityName instanceof EntitySchema) {
      return this.metadata.get(entityName.meta.class) ?? entityName.meta;
    }

    return this.classNameMap[Utils.className(entityName)];
  }

  has<T>(entityName: EntityName<T>): boolean {
    return this.metadata.has(entityName);
  }

  // TODO remove first param, since its always `meta.class`?
  set<T>(entityName: EntityName<T>, meta: EntityMetadata): EntityMetadata {
    this.metadata.set(entityName, meta);
    this.idMap[meta._id] = meta;
    this.uniqueNameMap[meta.uniqueName] = meta;
    this.classNameMap[Utils.className(entityName)] = meta;

    return meta;
  }

  reset<T>(entityName: EntityName<T>): void {
    const meta = this.find(entityName);

    if (meta) {
      this.metadata.delete(meta.class);
      delete this.idMap[meta._id];
      delete this.uniqueNameMap[meta.uniqueName];
      delete this.classNameMap[meta.className];
    }
  }

  decorate(em: EntityManager): void {
    [...this.metadata.values()]
      .filter(meta => meta.prototype)
      .forEach(meta => EntityHelper.decorate(meta, em));
  }

  * [Symbol.iterator](): IterableIterator<EntityMetadata> {
    for (const meta of this.metadata.values()) {
      yield meta;
    }
  }

  getById<T>(id: number): EntityMetadata<T> {
    return this.idMap[id];
  }

  getByClassName<T = any, V extends boolean = true>(
    className: string,
    validate = true as V,
  ): V extends true ? EntityMetadata<T> : EntityMetadata<T> | undefined {
    return this.validate(this.classNameMap[className], className, validate);
  }

  getByUniqueName<T = any, V extends boolean = true>(
    uniqueName: string,
    validate = true as V,
  ): V extends true ? EntityMetadata<T> : EntityMetadata<T> | undefined {
    return this.validate(this.uniqueNameMap[uniqueName], uniqueName, validate);
  }

  private validate<T = any, V extends boolean = true>(
    meta: EntityMetadata | undefined,
    id: string,
    validate: boolean,
  ): V extends true ? EntityMetadata<T> : EntityMetadata<T> | undefined {
    if (!meta && validate) {
      throw MetadataError.missingMetadata(id);
    }

    return meta as any;
  }

}
