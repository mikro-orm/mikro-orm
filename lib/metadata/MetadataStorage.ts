import { EntityMetadata } from '../decorators';

export class MetadataStorage {

  private static readonly metadata: Record<string, EntityMetadata> = {};

  static getMetadata(): Record<string, EntityMetadata>;
  static getMetadata(entity: string): EntityMetadata;
  static getMetadata(entity?: string): Record<string, EntityMetadata> | EntityMetadata {
    if (entity && !MetadataStorage.metadata[entity]) {
      MetadataStorage.metadata[entity] = { properties: {} } as EntityMetadata;
    }

    if (entity) {
      return MetadataStorage.metadata[entity];
    }

    return MetadataStorage.metadata;
  }

}
