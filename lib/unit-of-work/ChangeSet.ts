import { EntityData, IEntityType } from '../decorators';

export interface ChangeSet<T extends IEntityType<T> = IEntityType<any>> {
  index: number;
  name: string;
  collection: string;
  delete: boolean;
  entity: T;
  payload: EntityData<T>;
}
