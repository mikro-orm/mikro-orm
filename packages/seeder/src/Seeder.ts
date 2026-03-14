import type { Dictionary, EntityManager } from '@mikro-orm/core';

/** Base class for database seeders. Extend this class and implement `run()` to populate the database with data. */
export abstract class Seeder<T extends Dictionary = Dictionary> {
  abstract run(em: EntityManager, context?: T): void | Promise<void>;

  protected async call(em: EntityManager, seeders: { new (): Seeder }[], context: T = {} as T): Promise<void> {
    for (const Seeder of seeders) {
      const fork = em.fork();
      const instance = new Seeder();
      await instance.run(fork, context);
      await fork.flush();
    }
  }
}
