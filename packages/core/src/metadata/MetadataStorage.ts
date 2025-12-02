import { EntityMetadata, type Dictionary, type EntityName } from '../typings.js';
import { Utils } from '../utils/Utils.js';
import { MetadataError } from '../errors.js';
import type { EntityManager } from '../EntityManager.js';
import { EntityHelper } from '../entity/EntityHelper.js';

function getGlobalStorage(namespace: string): Dictionary {
  const key = `mikro-orm-${namespace}` as keyof typeof globalThis;
  (globalThis as Dictionary)[key] = globalThis[key] || {};

  return globalThis[key];
}

export class MetadataStorage {

  static readonly PATH_SYMBOL = Symbol('MetadataStorage.PATH_SYMBOL');

  private static readonly metadata: Dictionary<EntityMetadata> = getGlobalStorage('metadata');
  private readonly metadata: Dictionary<EntityMetadata>;

  constructor(metadata: Dictionary<EntityMetadata> = {}) {
    this.metadata = Utils.copy(metadata, false);
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
    entityName = Utils.className(entityName);

    if (validate && !init && !this.has(entityName)) {
      throw MetadataError.missingMetadata(entityName);
    }

    if (init && !this.has(entityName)) {
      this.metadata[entityName] = new EntityMetadata();
    }

    return this.metadata[entityName];
  }

  find<T = any>(entityName: EntityName<T>): EntityMetadata<T> | undefined {
    if (!entityName) {
      return;
    }

    entityName = Utils.className(entityName);
    return this.metadata[entityName];
  }

  has(entity: string): boolean {
    return entity in this.metadata;
  }

  set(entity: string, meta: EntityMetadata): EntityMetadata {
    return this.metadata[entity] = meta;
  }

  reset(entity: string): void {
    delete this.metadata[entity];
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

}
