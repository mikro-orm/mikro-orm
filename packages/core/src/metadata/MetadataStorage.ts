import { type Dictionary, EntityMetadata, type EntityName } from '../typings.js';
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
  private readonly metadata: Dictionary<EntityMetadata>;
  private readonly idMap: Record<number, EntityMetadata>;
  private readonly classNameMap: Record<string, EntityMetadata>;

  constructor(metadata: Dictionary<EntityMetadata> = {}) {
    this.metadata = Utils.copy(metadata, false);
    this.idMap = {};
    this.classNameMap = {};

    for (const meta of this) {
      this.idMap[meta._id] = meta;
      this.classNameMap[meta.className] = meta;
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

  getAll(): Dictionary<EntityMetadata> {
    return this.metadata;
  }

  get<T = any>(entityName: EntityName<T>, init = false, validate = true): EntityMetadata<T> {
    const className = Utils.className(entityName);

    if (this.has(entityName)) {
      return this.metadata[className];
    }

    if (entityName instanceof EntitySchema) {
      return entityName.meta;
    }

    if (validate && !init && !this.has(entityName)) {
      throw MetadataError.missingMetadata(className);
    }

    if (init && !this.has(entityName)) {
      this.metadata[className] = new EntityMetadata();
    }

    return this.metadata[className];
  }

  find<T = any>(entityName: EntityName<T>): EntityMetadata<T> | undefined {
    if (!entityName) {
      return;
    }

    if (this.has(entityName)) {
      return this.metadata[Utils.className(entityName)];
    }

    if (entityName instanceof EntitySchema) {
      return entityName.meta;
    }

    return;
  }

  has<T>(entityName: EntityName<T>): boolean {
    return Utils.className(entityName) in this.metadata;
  }

  set<T>(entityName: EntityName<T>, meta: EntityMetadata): EntityMetadata {
    this.idMap[meta._id] = meta;
    return this.metadata[Utils.className(entityName)] = meta;
  }

  reset<T>(entityName: EntityName<T>): void {
    const meta = this.get(entityName);
    delete this.metadata[meta.className];
    delete this.idMap[meta._id];
  }

  decorate(em: EntityManager): void {
    Object.values(this.metadata)
      .filter(meta => meta.prototype)
      .forEach(meta => EntityHelper.decorate(meta, em));
  }

  * [Symbol.iterator](): IterableIterator<EntityMetadata> {
    for (const meta of Object.values(this.metadata)) {
      yield meta;
    }
  }

  getById<T>(id: number): EntityMetadata<T> {
    return this.idMap[id];
  }

  getByClassName<T = any>(className: string): EntityMetadata<T> {
    return this.metadata[className];
  }

}
