import { EntityData, IEntityType } from '../decorators';

export interface ChangeSet<T extends IEntityType<T>> {
  name: string;
  collection: string;
  delete: boolean;
  entity: T;
  payload: EntityData<T>;
}
