import { Seeder } from '@mikro-orm/seeder';
import type { EntityManager } from '@mikro-orm/core';
import { Project } from '../../features/seeder/entities/project.entity';

export class ProjectSeeder extends Seeder {

  async run(em: EntityManager): Promise<void> {
    em.create(Project, {
      name: 'Construction',
      owner: 'Donald Duck',
      worth: 313,
    }, { persist: true });
  }

}
