import { EntityManager } from './EntityManager';
import { BaseEntity } from './BaseEntity';

export class EntityRepository<T extends BaseEntity> {

  constructor(private em: EntityManager,
              private entityName: string) { }

  async persist(entity: T, flush = false): Promise<void> {
    return this.em.persist(entity, flush);
  }

  async findOne(where: any, populate: string[] = []): Promise<T> {
    return this.em.findOne<T>(this.entityName, where, populate);
  }

  async findAll(populate: string[] = []): Promise<T[]> {
    return this.em.find<T>(this.entityName, {}, populate);
  }

  async remove(where: any): Promise<number> {
    return this.em.remove(this.entityName, where);
  }

  async count(where: any): Promise<number> {
    return this.em.count(this.entityName, where);
  }

}
