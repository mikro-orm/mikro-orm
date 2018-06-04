import { FilterQuery } from 'mongodb';
import { EntityManager } from './EntityManager';
import { BaseEntity } from './BaseEntity';

export class EntityRepository<T extends BaseEntity> {

  constructor(private em: EntityManager,
              private entityName: string) { }

  async persist(entity: T, flush = false): Promise<void> {
    return this.em.persist(entity, flush);
  }

  async findOne(where: FilterQuery<T>, populate: string[] = []): Promise<T> {
    return this.em.findOne<T>(this.entityName, where, populate);
  }

  async find(where: FilterQuery<T>, populate: string[] = [], orderBy: { [k: string]: 1 | -1 } = {}, limit: number = null, offset = 0): Promise<T[]> {
    return this.em.find<T>(this.entityName, where, populate, orderBy, limit, offset);
  }

  async findAll(populate: string[] = [], orderBy: { [k: string]: 1 | -1 } = {}, limit: number = null, offset = 0): Promise<T[]> {
    return this.em.find<T>(this.entityName, {}, populate, orderBy, limit, offset);
  }

  async remove(where: any): Promise<number> {
    return this.em.remove(this.entityName, where);
  }

  async count(where: any): Promise<number> {
    return this.em.count(this.entityName, where);
  }

}
