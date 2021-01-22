import {
  Collection,
  Entity,
  IdentifiedReference,
  LoadStrategy,
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
  order!: number;

  @ManyToOne({
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    entity: () => Radio,
    wrappedReference: true,
  })
  radio!: IdentifiedReference<Radio>;

}

@Entity()
export class Radio {

  @PrimaryKey()
  id!: number;

  @Property()
  order!: number;

  @ManyToOne({
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    entity: () => Project,
    wrappedReference: true,
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

describe('GH issue 1331', () => {

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

  test(`relations' orderBy should be respectend when using LoadStrategy.JOINED`, async () => {
    const project = orm.em.create(Project, { name: 'project name' });
    const radio1 = orm.em.create(Radio, { order: 0 });
    const radio2 = orm.em.create(Radio, { order: 2 });
    const radio3 = orm.em.create(Radio, { order: 1 });

    radio1.options.add(orm.em.create(RadioOption, { order: 3 }));
    radio1.options.add(orm.em.create(RadioOption, { order: 2 }));
    radio1.options.add(orm.em.create(RadioOption, { order: 4 }));
    radio1.options.add(orm.em.create(RadioOption, { order: 1 }));

    radio2.options.add(orm.em.create(RadioOption, { order: 5 }));
    radio2.options.add(orm.em.create(RadioOption, { order: 2 }));
    radio2.options.add(orm.em.create(RadioOption, { order: 11 }));
    radio2.options.add(orm.em.create(RadioOption, { order: 12 }));

    radio3.options.add(orm.em.create(RadioOption, { order: 0 }));
    radio3.options.add(orm.em.create(RadioOption, { order: 2 }));
    radio3.options.add(orm.em.create(RadioOption, { order: 4 }));
    radio3.options.add(orm.em.create(RadioOption, { order: 1 }));

    project.radios.add(radio1, radio2, radio3);

    await orm.em.persistAndFlush(project);
    orm.em.clear();

    const loadedProject = await orm.em.findOneOrFail(Project, project.id);
    expect(loadedProject.radios.getItems().map(r => r.order)).toStrictEqual([0, 1, 2]);
    expect(loadedProject.radios[0].options.getIdentifiers('order')).toEqual([1, 2, 3, 4]);
    expect(loadedProject.radios[2].options.getIdentifiers('order')).toEqual([2, 5, 11, 12]);
    expect(loadedProject.radios[1].options.getIdentifiers('order')).toEqual([0, 1, 2, 4]);
  });

});
