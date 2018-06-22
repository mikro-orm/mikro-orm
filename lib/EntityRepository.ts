import { FilterQuery } from 'mongodb';
import { EntityManager } from './EntityManager';
import { BaseEntity } from './BaseEntity';

export class EntityRepository<T extends BaseEntity> {

  constructor(protected em: EntityManager,
              protected entityName: string) { }

  getReference<T extends BaseEntity>(id: string): T {
    return this.em.getReference(this.entityName, id);
  }

  async persist(entity: T, flush = true): Promise<void> {
    return this.em.persist(entity, flush);
  }

  async findOne(where: FilterQuery<T> | string, populate: string[] = []): Promise<T> {
    return this.em.findOne<T>(this.entityName, where, populate);
  }

  async find(where: FilterQuery<T>, populate: string[] = [], orderBy: { [k: string]: 1 | -1 } = {}, limit: number = null, offset: number = null): Promise<T[]> {
    return this.em.find<T>(this.entityName, where, populate, orderBy, limit, offset);
  }

  async findAll(populate: string[] = [], orderBy: { [k: string]: 1 | -1 } = {}, limit: number = null, offset: number = null): Promise<T[]> {
    return this.em.find<T>(this.entityName, {}, populate, orderBy, limit, offset);
  }

  async remove(where: T | any): Promise<number> {
    return this.em.remove(this.entityName, where);
  }

  async flush(): Promise<void> {
    return this.em.flush();
  }

  canPopulate(property: string): boolean {
    return this.em.canPopulate(this.entityName, property);
  }

  async count(where: any = {}): Promise<number> {
    return this.em.count(this.entityName, where);
  }

}
