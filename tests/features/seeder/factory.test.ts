import { MikroORM } from '@mikro-orm/core';
import { Factory } from '@mikro-orm/seeder';
import { SqliteDriver } from '@mikro-orm/sqlite';
import * as Faker from 'faker';
import { House } from './entities/house.entity';
import { Project } from './entities/project.entity';

export class ProjectFactory extends Factory<Project> {

  model = Project;

  definition(faker: typeof Faker): Partial<Project> {
    return {
      name: 'Money vault',
      owner: faker.name.findName(),
      worth: 120000,
    };
  }

}

export class HouseFactory extends Factory<House> {

  model = House;

  definition(faker: typeof Faker): Partial<House> {
    return {
      address: faker.address.city(),
    };
  }

}

describe('Factory', () => {

  let orm: MikroORM<SqliteDriver>;
  let projectCountBefore: number;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Project, House],
      type: 'sqlite',
      dbName: ':memory:',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  beforeEach(async () => {
    projectCountBefore = (await orm.em.findAndCount(Project, {}))[1];
    orm.em.clear();
  });

  test('that a factory can make a single instance of an entity without saving it in the database', async () => {
    const project = new ProjectFactory(orm.em).makeOne();
    expect(project).toBeInstanceOf(Project);
    expect(project.id).toBeUndefined();

    const projectCountAfter = (await orm.em.findAndCount(Project, {}))[1];
    expect(projectCountAfter).toEqual(projectCountBefore);
  });

  test('that a factory can create a single instance of an entity and save it in the database', async () => {
    const projectSaved = await new ProjectFactory(orm.em).createOne();
    expect(projectSaved).toBeInstanceOf(Project);
    expect(projectSaved.id).toBeDefined();
    const projectCountAfter = (await orm.em.findAndCount(Project, {}))[1];
    expect(projectCountAfter).toEqual(projectCountBefore + 1);
  });

  test('that a factory can make multiple instances of an entity without saving them in the database', async () => {
    const projects = new ProjectFactory(orm.em).make(5);
    expect(projects).toBeInstanceOf(Array);
    expect(projects.length).toBe(5);
    const projectCountAfter = (await orm.em.findAndCount(Project, {}))[1];
    expect(projectCountAfter).toEqual(projectCountBefore);
  });

  test('that a factory can create multiple instances of an entity and save them in the database', async () => {
    const projectSaved = await new ProjectFactory(orm.em).create(5);
    expect(projectSaved).toBeInstanceOf(Array);
    expect(projectSaved.length).toBe(5);
    const projectCountAfter = (await orm.em.findAndCount(Project, {}))[1];
    expect(projectCountAfter).toEqual(projectCountBefore + 5);
  });

  test('that properties of the factory can be overwritten', async () => {
    const projectDefault = new ProjectFactory(orm.em).makeOne();

    expect(projectDefault.worth).toBe(120000);

    const project = new ProjectFactory(orm.em)
      .makeOne({
        worth: 36,
      }) as Project;
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
