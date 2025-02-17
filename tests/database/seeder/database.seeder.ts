import { Seeder } from '@mikro-orm/seeder';
import type { EntityManager } from '@mikro-orm/core';
import { ProjectSeeder } from './project.seeder.js';
import { UserSeeder } from './user.seeder.js';

export class DatabaseSeeder extends Seeder {

  run(em: EntityManager): Promise<void> {
    return this.call(em, [
      UserSeeder,
      ProjectSeeder,
    ]);
  }

}
