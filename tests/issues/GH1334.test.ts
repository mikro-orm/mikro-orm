import { Collection, Entity, IdentifiedReference, LoadStrategy, Logger, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property, QueryOrder } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class RadioOption {

  @PrimaryKey()
  id!: number;

  @Property()
  value!: string;

  @Property()
  order!: number;

  @ManyToOne('Radio', { wrappedReference: true })
  radio!: IdentifiedReference<Radio>;

}

@Entity()
export class Radio {

  @PrimaryKey()
  id!: number;

  @Property()
  order!: number;

  @Property()
  question: string = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10);

  @ManyToOne('Project', { wrappedReference: true })
  project!: IdentifiedReference<Project>;

  @OneToMany(
    () => RadioOption,
    option => option.radio,
    {
      eager: true,
      orderBy: { order: QueryOrder.ASC, id: QueryOrder.ASC },
    },
  )
  options = new Collection<RadioOption>(this);

  constructor(order: number) {
    this.order = order;
  }

}

@Entity()
export class Project {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @OneToMany(
    () => Radio,
    radio => radio.project,
    {
      eager: true,
      orderBy: { order: QueryOrder.ASC, id: QueryOrder.ASC },
    },
  )
  radios = new Collection<Radio>(this);

  constructor(name: string) {
    this.name = name;
  }

}

describe('GH issue 1334', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      type: 'sqlite',
      dbName: ':memory:',
      entities: [Project, Radio, RadioOption],
      loadStrategy: LoadStrategy.JOINED,
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`GH issue 1334`, async () => {
    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    const project = new Project('p1');
    const radio1 = new Radio(0);
    const radio2 = new Radio(2);
    const radio3 = new Radio(1);
    project.radios.add(radio1, radio2, radio3);
    await orm.em.persistAndFlush(project);
    orm.em.clear();

    await orm.em.findOneOrFail(Radio, radio1.id, { populate: ['project'] });
    mock.mock.calls.length = 0;
    await orm.em.flush();
    expect(mock.mock.calls).toHaveLength(0);
  });

});
