import { Seeder } from '@mikro-orm/seeder';
import type { EntityManager } from '@mikro-orm/core';
import { User } from '../../features/seeder/entities/user.entity';

export class UserSeeder extends Seeder {

  async run(em: EntityManager): Promise<void> {
    const user = em.create(User, {
      name: 'Scrooge McDuck',
      email: 'scrooge@money.dc',
      password: 'MoneyIsForSwimming',
    });
    await em.persistAndFlush(user);
    em.clear();
  }

}
