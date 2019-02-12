import { EntityManager } from './EntityManager';
import { RequestContext } from './utils/RequestContext';
import { FilterQuery } from './drivers/DatabaseDriver';
import { IPrimaryKey } from './decorators/PrimaryKey';
import { IEntityType } from './decorators/Entity';

export class EntityRepository<T extends IEntityType<T>> {

  constructor(private _em: EntityManager,
              protected entityName: string) { }

  async persist(entity: T, flush = true): Promise<void> {
    return this.em.persist(entity, flush);
  }

  async findOne(where: FilterQuery<T> | IPrimaryKey, populate: string[] = []): Promise<T | null> {
    return this.em.findOne<T>(this.entityName, where, populate);
  }

  async find(where: FilterQuery<T> | IPrimaryKey, populate: string[] = [], orderBy: { [k: string]: 1 | -1 } = {}, limit?: number, offset?: number): Promise<T[]> {
    return this.em.find<T>(this.entityName, where as FilterQuery<T>, populate, orderBy, limit, offset);
  }

  async findAll(populate: string[] = [], orderBy: { [k: string]: 1 | -1 } = {}, limit?: number, offset?: number): Promise<T[]> {
    return this.em.find<T>(this.entityName, {}, populate, orderBy, limit, offset);
  }

  async remove(where: T | any, flush = true): Promise<number> {
    return this.em.remove(this.entityName, where, flush);
  }

  async flush(): Promise<void> {
    return this.em.flush();
  }

  async nativeInsert(data: any): Promise<IPrimaryKey> {
    return this.em.nativeInsert(this.entityName, data)
  }

  async nativeUpdate(where: FilterQuery<T>, data: any): Promise<number> {
    return this.em.nativeUpdate(this.entityName, where, data)
  }

  async nativeDelete(where: FilterQuery<T> | any): Promise<number> {
    return this.em.nativeDelete(this.entityName, where)
  }

  async aggregate(pipeline: any[]): Promise<any[]> {
    return this.em.aggregate(this.entityName, pipeline)
  }

  /**
   * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
   */
  getReference<T extends IEntityType<T>>(id: IPrimaryKey): T {
    return this.em.getReference<T>(this.entityName, id);
  }

  canPopulate(property: string): boolean {
    return this.em.canPopulate(this.entityName, property);
  }

  /**
   * Creates new instance of given entity and populates it with given data
   */
  create(data: any): T {
    return this.em.create<T>(this.entityName, data);
  }

  async count(where: any = {}): Promise<number> {
    return this.em.count(this.entityName, where);
  }

  protected get em(): EntityManager {
    return RequestContext.getEntityManager() || this._em;
  }

}
