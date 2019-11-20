import { AnyEntity, Constructor, EntityClass } from '../types';
import { EntityRepository } from '../entity';
import { MetadataStorage } from '../metadata';

export function Repository<T extends AnyEntity>(entity: EntityClass<T>) {
  return function (target: Constructor<EntityRepository<T>>) {
    const meta = MetadataStorage.getMetadata(entity.name);
    meta.customRepository = () => target;
  };
}
