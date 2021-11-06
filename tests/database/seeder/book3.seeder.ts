import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

export class Book3Seeder extends Seeder {

  run(em: EntityManager): Promise<void> {
    return Promise.resolve(undefined);
  }

}
