import { EntityMetadata } from '../decorators/Entity';
import { MikroORMOptions } from '../MikroORM';

export abstract class MetadataProvider {

  constructor(protected readonly options: MikroORMOptions) { }

  abstract discover(meta: EntityMetadata, name: string): void;

}
