import {
  Collection,
  Entity,
  IdentifiedReference,
  LoadStrategy,
  Logger,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  Property,
  QueryOrder,
} from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class RadioOption {

  @PrimaryKey()
  id!: number;

  @Property()
  value!: string;

  @Property()
  order!: number;

  @ManyToOne({
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    entity: () => Radio,
  })
  radio!: IdentifiedReference<Radio>;

}

@Entity()
export class Radio {

  @PrimaryKey()
  id!: number;

  @Property()
  order!: number;

  @Property()
  question!: string;

  @ManyToOne({
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    entity: () => Project,
  })
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

}

@Entity()
export class Project {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(
    () => Radio,
    radio => radio.project,
    {
      eager: true,
      orderBy: { order: QueryOrder.ASC, id: QueryOrder.ASC },
    },
  )
  radios = new Collection<Radio>(this);

}

function createProject(): Project {
  const project = new Project();
  project.name = 'project name';
  return project;
}

function createRadio(order: number): Radio {
  const radio = new Radio();
  radio.order = order;
  radio.question = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10);
  return radio;
}

function createOption(order: number): RadioOption {
  const radioOption = new RadioOption();
  radioOption.order = order;
  radioOption.value = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10);
  return radioOption;
}

describe('GH issue xxxx', () => {

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

  test(`GH issue 1278`, async () => {
    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    const project = createProject();
    const radio1 = createRadio(0);
    const radio2 = createRadio(2);
    const radio3 = createRadio(1);

    radio1.options.add(createOption(3));
    radio1.options.add(createOption(2));
    radio1.options.add(createOption(4));
    radio1.options.add(createOption(1));

    radio2.options.add(createOption(5));
    radio2.options.add(createOption(2));
    radio2.options.add(createOption(11));
    radio2.options.add(createOption(12));

    radio3.options.add(createOption(0));
    radio3.options.add(createOption(2));
    radio3.options.add(createOption(4));
    radio3.options.add(createOption(1));

    project.radios.add(radio1, radio2, radio3);

    await orm.em.persistAndFlush(project);
    orm.em.clear();

    const loadedProject = await orm.em.findOne(Project, { id: 1 });
    expect(loadedProject?.radios.getItems().map(r => r.order)).toStrictEqual([0, 1, 2]);
    expect(loadedProject?.radios.getItems()[0].options.getItems().map(r => r.order).toString()).toBe([1, 2, 3, 4].toString());
    expect(loadedProject?.radios.getItems()[2].options.getItems().map(r => r.order).toString()).toBe([2, 5, 11, 12].toString());
    expect(loadedProject?.radios.getItems()[1].options.getItems().map(r => r.order).toString()).toBe([0, 1, 2, 4].toString());
  });

});
