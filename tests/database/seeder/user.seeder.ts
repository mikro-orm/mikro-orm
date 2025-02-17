import { Seeder } from '@mikro-orm/seeder';
import type { Dictionary, EntityManager } from '@mikro-orm/core';
import { User } from '../../features/seeder/entities/user.entity.js';

export class UserSeeder extends Seeder {

  async run(em: EntityManager, context: Dictionary): Promise<void> {
    context.user = em.create(User, {
      name: 'Scrooge McDuck',
      email: 'scrooge@money.dc',
      password: 'MoneyIsForSwimming',
    }, { persist: true });
  }

}
