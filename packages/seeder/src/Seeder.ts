import type { EntityManager } from '@mikro-orm/core';

export abstract class Seeder {

  abstract run(em: EntityManager): Promise<void>;

  protected async call(em: EntityManager, seeders: { new(): Seeder }[]): Promise<void> {
    for (const Seeder of seeders) {
      const fork = em.fork();
      const instance = new Seeder();
      await instance.run(fork);
      await fork.flush();
    }
  }

}
