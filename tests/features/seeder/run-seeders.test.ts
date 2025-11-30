import { MikroORM } from '@mikro-orm/core';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { House } from './entities/house.entity.js';
import { Project } from './entities/project.entity.js';
import { User } from './entities/user.entity.js';
import { DatabaseSeeder } from '../../database/seeder/database.seeder.js';
import { SqliteDriver } from '@mikro-orm/sqlite';

describe('Run seeders', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Project, User, House],
      driver: SqliteDriver,
      dbName: ':memory:',
    });
    await orm.schema.create();
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
