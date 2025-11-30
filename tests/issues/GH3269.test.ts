import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Main {

  @Property({ primary: true })
  pk_one!: string;

  @Property({ primary: true })
  pk_two!: string;

  @Property()
  type!: string;

}

@Entity()
class Dependent {

  @ManyToOne(() => Main, { primary: true })
  main!: Main;

  @PrimaryKey()
  id!: string;

  @Property()
  bar!: string;

}

@Entity()
class LogEntry {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Dependent, { deleteRule: 'cascade' })
  dependent!: Dependent;

  @Property()
  foo!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [LogEntry],
  });
  await orm.schema.create();
});
beforeEach(async () => orm.schema.clear());
afterAll(() => orm.close(true));

test('GH #3269', async () => {
  // Create some entities
  const main = orm.em.create(Main, {
    pk_one: 'one-1',
    pk_two: 'two-1',
    type: 'some-type',
  });

  const dependent = orm.em.create(Dependent, {
    id: 'app-1',
    main,
    bar: 'some-bar',
  });

  const logEntry = orm.em.create(LogEntry, {
    dependent,
    foo: 'some-foo',
  });

  await orm.em.persist([main, dependent, logEntry]).flush();
  orm.em.clear();

  // Loading with `populate` from `Dependent` fully populates `Main`.
  const result1 = await orm.em.findOneOrFail(Dependent, { id: 'app-1' }, { populate: ['main'] });
  expect(result1.main.type).toBe('some-type');
  orm.em.clear();

  // Loading with `populate` from `LogEntry` fails to fully populate `Main`.
  const result2 = await orm.em.findOneOrFail(LogEntry, { id: 1 }, { populate: ['dependent.main'] });
  expect(result2.dependent.main.type).toBe('some-type');
});
