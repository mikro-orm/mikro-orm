import { EntityMetadata } from '../types';
import { Configuration, Utils } from '../utils';

export abstract class MetadataProvider {

  constructor(protected readonly config: Configuration) { }

  abstract async loadEntityMetadata(meta: EntityMetadata, name: string): Promise<void>;

  loadFromCache(meta: EntityMetadata, cache: EntityMetadata): void {
    Utils.merge(meta, cache);
  }

}
