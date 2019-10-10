import { EntityClass, IEntity } from './Entity';
import { EntityRepository } from '../entity';
import { MetadataStorage } from '../metadata';
import { Constructor } from '../drivers';

export function Repository<T extends IEntity>(entity: EntityClass<T>) {
  return function (target: Constructor<EntityRepository<T>>) {
    const meta = MetadataStorage.getMetadata(entity.name);
    meta.customRepository = () => target;
  };
}
