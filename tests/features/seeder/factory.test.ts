import { MikroORM } from '@mikro-orm/core';
import type { EntityData } from '@mikro-orm/core';
import { Factory } from '@mikro-orm/seeder';
import type { Faker } from '@mikro-orm/seeder';
import { House } from './entities/house.entity';
import { Project } from './entities/project.entity';
import { User } from './entities/user.entity';
import SpyInstance = jest.SpyInstance;
import { SqliteDriver } from '@mikro-orm/sqlite';

export class ProjectFactory extends Factory<Project> {

  model = Project;

  definition(faker: Faker): EntityData<Project> {
    return {
      name: 'Money vault',
      owner: {
        name: faker.name.fullName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
      } as User,
      worth: 120000,
    };
  }

}

export class HouseFactory extends Factory<House> {

  model = House;

  definition(faker: Faker): Partial<House> {
    return {
      address: faker.address.city(),
    };
  }

}

describe('Factory', () => {

  let orm: MikroORM;
  let persistSpy: SpyInstance;
  let flushSpy: SpyInstance;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Project, House, User],
      driver: SqliteDriver,
      dbName: ':memory:',
    });
    await orm.schema.createSchema();
    persistSpy = jest.spyOn(orm.em, 'persist');
    flushSpy = jest.spyOn(orm.em, 'flush');
  });

  afterAll(() => orm.close(true));
  beforeEach(() => orm.em.clear());

  afterEach(() => {
    persistSpy.mockClear();
    flushSpy.mockClear();
  });

  test('that a factory can make a single instance of an entity without saving it in the database', async () => {
    const project = new ProjectFactory(orm.em).makeOne();
    expect(project).toBeInstanceOf(Project);
    expect(project.id).toBeUndefined();
    expect(persistSpy).toBeCalled();
    expect(flushSpy).not.toBeCalled();
  });

  test('that a factory can create a single instance of an entity and save it in the database', async () => {
    const projectSaved = await new ProjectFactory(orm.em).createOne();
    expect(persistSpy).toBeCalled();
    expect(flushSpy).toBeCalled();
    expect(projectSaved).toBeInstanceOf(Project);
    expect(projectSaved.id).toBeDefined();
  });

  test('that a factory can make multiple instances of an entity without saving them in the database', async () => {
    const projects = new ProjectFactory(orm.em).make(5);
    expect(projects).toBeInstanceOf(Array);
    expect(persistSpy).toBeCalledTimes(1);
    expect(flushSpy).not.toBeCalled();
    expect(projects.length).toBe(5);
  });

  test('that a factory can create multiple instances of an entity and save them in the database', async () => {
    const projectSaved = await new ProjectFactory(orm.em).create(5);
    expect(persistSpy).toBeCalledTimes(1);
    expect(flushSpy).toBeCalledTimes(1);
    expect(projectSaved).toBeInstanceOf(Array);
    expect(projectSaved.length).toBe(5);
  });

  test('that properties of the factory can be overwritten', async () => {
    const projectDefault = new ProjectFactory(orm.em).makeOne();
    expect(projectDefault.worth).toBe(120000);

    const project = new ProjectFactory(orm.em)
      .makeOne({
        worth: 36,
      });
    expect(project.worth).toBe(36);
  });

  test('that relations can be populated on an entity', async () => {
    const project = new ProjectFactory(orm.em)
      .each((p: Project) => {
        p.houses.set(new HouseFactory(orm.em).make(2));
      })
      .makeOne();
    expect(project.houses.count()).toBe(2);
  });

  test('that relations can be populated on an entity and saved at once', async () => {
    const project = await new ProjectFactory(orm.em)
      .each((p: Project) => {
        p.houses.set(new HouseFactory(orm.em).make(2));
      })
      .createOne();
    expect(project.houses.count()).toBe(2);
    expect(project.id).toBeDefined();
    expect(project.houses.getItems()[0].id).toBeDefined();
  });
});
