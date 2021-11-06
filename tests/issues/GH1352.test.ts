import { Collection, Entity, IdentifiedReference, LoadStrategy, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class Manager {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne('Project', { wrappedReference: true })
  project!: IdentifiedReference<Project>;

  constructor(name: string) {
    this.name = name;
  }

}

@Entity()
export class Owner {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne('Risk', { wrappedReference: true })
  risk!: IdentifiedReference<Risk>;

  constructor(name: string) {
    this.name = name;
  }

}

@Entity()
export class Risk {

  @PrimaryKey()
  id!: number;

  @Property()
  value!: string;

  @OneToMany(() => Owner, owner => owner.risk)
  owners = new Collection<Owner>(this);

  @ManyToOne('Project', { wrappedReference: true })
  project!: IdentifiedReference<Project>;

  constructor(value: string) {
    this.value = value;
  }

}

@Entity()
export class Project {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @OneToMany(() => Risk, risk => risk.project, { eager: true })
  risks = new Collection<Risk>(this);

  @OneToMany(() => Manager, manager => manager.project, { eager: true })
  managers = new Collection<Manager>(this);

  constructor(name: string) {
    this.name = name;
  }

}

describe('GH issue 1352', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      type: 'sqlite',
      dbName: ':memory:',
      entities: [Project, Owner, Risk, Manager],
      loadStrategy: LoadStrategy.JOINED,
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`GH issue 1352`, async () => {
    const project = new Project('Apartment construction');
    const manager1 = new Manager('John 1');
    const manager2 = new Manager('John 2');
    const manager3 = new Manager('John 3');
    const risk1 = new Risk('Wild animals');
    const risk2 = new Risk('Oil pipe');
    const risk3 = new Risk('Earth quake');

    risk1.owners.add(new Owner('Some name 1'));
    risk2.owners.add(new Owner('Some name 2'));
    risk3.owners.add(new Owner('Some name 3'));
    project.managers.add(manager1, manager2, manager3);
    project.risks.add(risk1, risk2, risk3);
    await orm.em.persistAndFlush(project);
    orm.em.clear();

    const queriedProject = await orm.em.findOneOrFail(Manager, manager1, { populate: ['project'] });
    expect(queriedProject.project.unwrap().managers.isInitialized()).toBeTruthy();
    expect(queriedProject.project.unwrap().risks.isInitialized()).toBeTruthy();
  });

});
