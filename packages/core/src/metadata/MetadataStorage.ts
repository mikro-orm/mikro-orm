import { EntityMetadata, AnyEntity, Dictionary } from '../typings';
import { MetadataError, Utils } from '../utils';
import { EntityManager } from '../EntityManager';
import { EntityHelper } from '../entity';
import { EventSubscriber } from '../events';

export class MetadataStorage {

  private static readonly metadata: Dictionary<EntityMetadata> = Utils.getGlobalStorage('metadata');
  private static readonly subscribers: Dictionary<EventSubscriber> = Utils.getGlobalStorage('subscribers');
  private readonly metadata: Dictionary<EntityMetadata>;

  constructor(metadata: Dictionary<EntityMetadata> = {}) {
    this.metadata = Utils.copy(metadata);
  }

  static getMetadata(): Dictionary<EntityMetadata>;
  static getMetadata<T extends AnyEntity<T> = any>(entity: string, path?: string): EntityMetadata<T>;
  static getMetadata<T extends AnyEntity<T> = any>(entity?: string, path?: string): Dictionary<EntityMetadata> | EntityMetadata<T> {
    path = path ?? entity;
    const key = entity && path ? entity + '-' + Utils.hash(path) : null;

    if (key && !MetadataStorage.metadata[key]) {
      MetadataStorage.metadata[key] = { className: entity, path, properties: {}, hooks: {}, filters: {}, indexes: [] as any[], uniques: [] as any[] } as EntityMetadata;
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

  static getSubscriberMetadata(): Dictionary<EventSubscriber> {
    return MetadataStorage.subscribers;
  }

  static init(): MetadataStorage {
    return new MetadataStorage(MetadataStorage.metadata);
  }

  getAll(): Dictionary<EntityMetadata> {
    return this.metadata;
  }

  get<T extends AnyEntity<T> = any>(entity: string, init = false, validate = true): EntityMetadata<T> {
    if (validate && !init && entity && !this.has(entity)) {
      throw MetadataError.missingMetadata(entity);
    }

    if (init && !this.has(entity)) {
      this.metadata[entity] = { properties: {}, hooks: {}, indexes: [] as any[], uniques: [] as any[] } as EntityMetadata;
    }

    return this.metadata[entity];
  }

  find<T extends AnyEntity<T> = any>(entity: string): EntityMetadata<T> | undefined {
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
