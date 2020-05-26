import { EntityMetadata, AnyEntity, Dictionary } from '../typings';
import { Utils, ValidationError } from '../utils';
import { EntityManager } from '../EntityManager';
import { EntityHelper } from '../entity';

export class MetadataStorage {

  private static readonly metadata: Dictionary<EntityMetadata> = {};
  private readonly metadata: Dictionary<EntityMetadata>;

  constructor(metadata: Dictionary<EntityMetadata> = {}) {
    this.metadata = Utils.copy(metadata);
  }

  static getMetadata(): Dictionary<EntityMetadata>;
  static getMetadata<T extends AnyEntity<T> = any>(entity: string, path: string): EntityMetadata<T>;
  static getMetadata<T extends AnyEntity<T> = any>(entity?: string, path?: string): Dictionary<EntityMetadata> | EntityMetadata<T> {
    const key = entity && path ? entity + '-' + Utils.hash(path) : null;

    if (key && !MetadataStorage.metadata[key]) {
      MetadataStorage.metadata[key] = { className: entity, path, properties: {}, hooks: {}, indexes: [] as any[], uniques: [] as any[] } as EntityMetadata;
    }

    if (key) {
      return MetadataStorage.metadata[key];
    }

    return MetadataStorage.metadata;
  }

  static getMetadataFromDecorator<T = any>(target: T & Dictionary): EntityMetadata<T> {
    const path = Utils.lookupPathFromDecorator();
    const meta = MetadataStorage.getMetadata(target.name, path);
    Object.defineProperty(target, '__path', { value: path, writable: true });

    return meta;
  }

  static init(): MetadataStorage {
    return new MetadataStorage(MetadataStorage.metadata);
  }

  getAll(): Dictionary<EntityMetadata> {
    return this.metadata;
  }

  get<T extends AnyEntity<T> = any>(entity: string, init = false, validate = true): EntityMetadata<T> {
    if (entity && !this.metadata[entity] && validate && !init) {
      throw ValidationError.missingMetadata(entity);
    }

    if (!this.metadata[entity] && init) {
      this.metadata[entity] = { properties: {}, hooks: {}, indexes: [] as any[], uniques: [] as any[] } as EntityMetadata;
    }

    return this.metadata[entity];
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
      .filter(meta => meta.prototype && !Utils.isEntity(meta.prototype))
      .forEach(meta => EntityHelper.decorate(meta, em));
  }

}
