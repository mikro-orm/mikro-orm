import { EntityMetadata, IEntityType } from '../decorators';

export class MetadataStorage {

  private static readonly metadata: Record<string, EntityMetadata> = {};

  static getMetadata(): Record<string, EntityMetadata>; // tslint:disable-next-line:lines-between-class-members
  static getMetadata<T extends IEntityType<T> = any>(entity: string): EntityMetadata<T>; // tslint:disable-next-line:lines-between-class-members
  static getMetadata<T extends IEntityType<T> = any>(entity?: string): Record<string, EntityMetadata> | EntityMetadata<T> {
    if (entity && !MetadataStorage.metadata[entity]) {
      MetadataStorage.metadata[entity] = { properties: {} } as EntityMetadata;
    }

    if (entity) {
      return MetadataStorage.metadata[entity];
    }

    return MetadataStorage.metadata;
  }

}
