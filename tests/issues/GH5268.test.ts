import {
  Collection,
  Entity,
  OneToMany,
  MikroORM,
  PrimaryKey,
  Property,
  ManyToOne,
  ManyToMany,
} from '@mikro-orm/sqlite';

@Entity()
class Project {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => MeasureFilter, measureFilter => measureFilter.project)
  measureFilters = new Collection<MeasureFilter>(this);

  @OneToMany(() => Risk, risk => risk.project)
  risks = new Collection<Risk>(this);

}

@Entity()
class Risk {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => Cause, cause => cause.risk)
  causes = new Collection<Cause>(this);

  @ManyToMany(() => Measure, measure => measure.risks, {
    owner: true,
    eager: true,
  })
  measures = new Collection<Measure>(this);

  @ManyToOne(() => Project)
  project!: Project;

}

@Entity()
class Cause {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Risk)
  risk!: Risk;

  @ManyToMany(() => Measure, measure => measure.causes)
  measures = new Collection<Measure>(this);

}

@Entity()
class Measure {

  @PrimaryKey()
  id!: number;

  @ManyToMany(() => Risk, r => r.measures, { eager: true })
  risks = new Collection<Risk>(this);

  @ManyToMany(() => Cause, cause => cause.measures, { owner: true })
  causes = new Collection<Cause>(this);

  @ManyToMany(
    () => MeasureFilterValue,
    measureFilterValue => measureFilterValue.measures,
    {
      owner: true,
    },
  )
  measureFilterValues = new Collection<MeasureFilterValue>(this);

}

@Entity()
class MeasureFilter {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => MeasureFilterValue, value => value.measureFilter)
  values = new Collection<MeasureFilterValue>(this);

  @ManyToOne(() => Project)
  project!: Project;

}

@Entity()
class MeasureFilterValue {

  @PrimaryKey()
  id!: number;

  @ManyToOne()
  measureFilter!: MeasureFilter;

  @ManyToMany(() => Measure, measure => measure.measureFilterValues)
  measures = new Collection<Measure>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [
      Cause,
      Measure,
      MeasureFilter,
      MeasureFilterValue,
      Project,
      Risk,
    ],
    allowGlobalContext: true, // only for testing
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

beforeEach(async () => {
  await orm.schema.clearDatabase();
  const project = orm.em.create(Project, {});
  await orm.em.persistAndFlush(project);

  const measureFilter = orm.em.create(MeasureFilter, { project: project.id });
  await orm.em.persistAndFlush(measureFilter);

  const risk = orm.em.create(Risk, {
    name: 'TestRisk',
    project: project.id,
  });
  await orm.em.persistAndFlush(risk);

  const cause = orm.em.create(Cause, { risk: risk.id });
  await orm.em.persistAndFlush(cause);

  const measure = orm.em.create(Measure, {
    risks: [risk.id],
    causes: [cause.id],
    measureFilterValues: [{ measureFilter: measureFilter.id }],
  });
  await orm.em.persistAndFlush(measure);

  orm.em.clear();
});

test('"loadItems()" overwriting unflushed changes', async () => {
  const risk = await orm.em.getRepository(Risk).findOneOrFail(1);
  expect(risk.name).toBe('TestRisk');

  risk.name = 'Updated';
  expect(risk.name).toBe('Updated');

  await risk.causes.loadItems();
  expect(risk.name).toBe('Updated'); // <-- this assertion fails

  await orm.em.flush();
  expect(risk.name).toBe('Updated');
});
