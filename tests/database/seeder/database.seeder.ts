import { Seeder } from '@mikro-orm/seeder';
import type { EntityManager } from '@mikro-orm/core';
import { ProjectSeeder } from './project.seeder';
import { UserSeeder } from './user.seeder';

export class DatabaseSeeder extends Seeder {

  run(em: EntityManager): Promise<void> {
    return this.call(em, [
      ProjectSeeder,
      UserSeeder,
    ]);
  }

}
