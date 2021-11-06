import { Seeder } from '@mikro-orm/seeder';
import type { EntityManager } from '@mikro-orm/core';

export class Author3Seeder extends Seeder {

  run(em: EntityManager): Promise<void> {
    return Promise.resolve(undefined);
  }

}
