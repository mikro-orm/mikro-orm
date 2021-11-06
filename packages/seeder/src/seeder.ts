import type { EntityManager } from '@mikro-orm/core';

export abstract class Seeder {

  abstract run(em: EntityManager): Promise<void>;

  protected call(em: EntityManager, seeders: { new(): Seeder }[]): Promise<void> {
    return new Promise((resolve, reject) => {
      Promise.all(seeders.map(s => {
        return (new s()).run(em.fork());
      })).then(() => resolve()).catch(reject);
    });
  }

}

