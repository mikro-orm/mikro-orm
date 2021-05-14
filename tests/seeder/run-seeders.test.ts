import { EntityManager, MikroORM } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { House } from './entities/house.entity';
import { Project } from './entities/project.entity';
import { User } from './entities/user.entity';

class ProjectSeeder extends Seeder {

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

class UserSeeder extends Seeder {

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

class DatabaseSeeder extends Seeder {

  run(em: EntityManager): Promise<void> {
    return this.call(em, [
      ProjectSeeder,
      UserSeeder,
    ]);
  }

}


describe('Run seeders', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Project, User, House],
      type: 'sqlite',
      dbName: ':memory:',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test('that by calling DatabaseSeeder both ProjectSeeder and UserSeeder have been called', async () => {

    const seeder = new DatabaseSeeder();
    await seeder.run(orm.em);

    const projects = await orm.em.findAndCount(Project, {});
    expect(projects[1]).toBe(1);

    const users = await orm.em.findAndCount(User, {});
    expect(users[1]).toBe(1);
  });
});
