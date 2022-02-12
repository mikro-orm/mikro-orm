import type { EntityManager } from '@mikro-orm/core';

export abstract class Seeder {

  abstract run(em: EntityManager): Promise<void>;

  protected call(em: EntityManager, seeders: { new(): Seeder }[]): Promise<void> {
    const promises = seeders.map(s => (new s()).run(em.fork()));
    return Promise.all(promises).then();
  }

}
