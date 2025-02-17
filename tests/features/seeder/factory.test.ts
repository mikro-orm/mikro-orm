import { MikroORM } from '@mikro-orm/sqlite';
import type { EntityData } from '@mikro-orm/core';
import { Factory } from '@mikro-orm/seeder';
import { House } from './entities/house.entity.js';
import { Project } from './entities/project.entity.js';
import { User } from './entities/user.entity.js';
import { MockInstance } from 'vitest';

export class ProjectFactory extends Factory<Project> {

  model = Project;

  definition(): EntityData<Project> {
    return {
      name: 'Money vault',
      owner: {
        name: 'name',
        email: 'email',
        password: 'pass',
      } as User,
      worth: 120000,
    };
  }

}

export class HouseFactory extends Factory<House> {

  model = House;

  definition(input?: EntityData<House>): EntityData<House> {
    return {
      address: 'addr',
      ...input,
    };
  }

}

export class MaybeMansionFactory extends Factory<
  House,
  EntityData<House> & { mansion: boolean }
> {

  model = House;

  definition(input: EntityData<House> & { mansion: boolean }) {
    return {
      ...(input.mansion ? { address: 'mansion street' } : {}),
      ...input,
    };
  }

}

describe('Factory', () => {
  let orm: MikroORM;
  let persistSpy: MockInstance;
  let flushSpy: MockInstance;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Project, House, User],
      dbName: ':memory:',
    });
    await orm.schema.createSchema();
    persistSpy = vi.spyOn(orm.em, 'persist');
    flushSpy = vi.spyOn(orm.em, 'flush');
  });

  afterAll(() => orm.close(true));
  beforeEach(() => orm.em.clear());

  afterEach(() => {
    persistSpy.mockClear();
    flushSpy.mockClear();
  });

  test('a factory can make a single instance of an entity without saving it in the database', async () => {
    const project = new ProjectFactory(orm.em).makeOne();
    expect(project).toBeInstanceOf(Project);
    expect(project.id).toBeUndefined();
    expect(persistSpy).toHaveBeenCalled();
    expect(flushSpy).not.toHaveBeenCalled();
  });

  test('a factory can create a single instance of an entity and save it in the database', async () => {
    const projectSaved = await new ProjectFactory(orm.em).createOne();
    expect(persistSpy).toHaveBeenCalled();
    expect(flushSpy).toHaveBeenCalled();
    expect(projectSaved).toBeInstanceOf(Project);
    expect(projectSaved.id).toBeDefined();
  });

  test('a factory can make multiple instances of an entity without saving them in the database', async () => {
    const projects = new ProjectFactory(orm.em).make(5);
    expect(projects).toBeInstanceOf(Array);
    expect(persistSpy).toHaveBeenCalledTimes(1);
    expect(flushSpy).not.toHaveBeenCalled();
    expect(projects.length).toBe(5);
  });

  test('a factory can create multiple instances of an entity and save them in the database', async () => {
    const projectSaved = await new ProjectFactory(orm.em).create(5);
    expect(persistSpy).toHaveBeenCalledTimes(1);
    expect(flushSpy).toHaveBeenCalledTimes(1);
    expect(projectSaved).toBeInstanceOf(Array);
    expect(projectSaved.length).toBe(5);
  });

  test('properties of the factory can be overwritten', async () => {
    const projectDefault = new ProjectFactory(orm.em).makeOne();
    expect(projectDefault.worth).toBe(120000);

    const project = new ProjectFactory(orm.em).makeOne({
      worth: 36,
    });
    expect(project.worth).toBe(36);
  });

  test('relations can be populated on an entity', async () => {
    const project = new ProjectFactory(orm.em)
      .each((p: Project) => {
        p.houses.set(new HouseFactory(orm.em).make(2));
      })
      .makeOne();
    expect(project.houses.count()).toBe(2);
  });

  test('relations can be populated on an entity and saved at once', async () => {
    const project = await new ProjectFactory(orm.em)
      .each((p: Project) => {
        p.houses.set(new HouseFactory(orm.em).make(2));
      })
      .createOne();
    expect(project.houses.count()).toBe(2);
    expect(project.id).toBeDefined();
    expect(project.houses.getItems()[0].id).toBeDefined();
  });

  test('index is passed to the `.each()` function', async () => {
    const projects = await new ProjectFactory(orm.em)
      .each((p: Project, i: number) => {
        p.houses.set(new HouseFactory(orm.em).make(i));
      })
      .create(3);
    expect(projects.map(p => p.houses.count())).toEqual([0, 1, 2]);
  });

  test("a factory can have custom input params on which it bases its' definition", async () => {
    const project = await new ProjectFactory(orm.em).createOne();
    const house = await new MaybeMansionFactory(orm.em).createOne({
      project: { id: project.id },
      mansion: true,
    });
    expect(house).toMatchObject({
      project,
      address: 'mansion street',
    });
  });
});
