import { Seeder } from '@mikro-orm/seeder';
import { EntityManager } from '@mikro-orm/core';
import { Project } from '../../features/seeder/entities/project.entity';

export class ProjectSeeder extends Seeder {

  async run(em: EntityManager): Promise<void> {
    const project = em.create(Project, {
      name: 'Construction',
      owner: 'Donald Duck',
      worth: 313,
    });
    await em.persistAndFlush(project);
    em.clear();
  }

}
