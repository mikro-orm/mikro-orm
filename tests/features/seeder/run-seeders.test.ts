import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { House } from './entities/house.entity';
import { Project } from './entities/project.entity';
import { User } from './entities/user.entity';
import { DatabaseSeeder } from '../../database/seeder/database.seeder';

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
