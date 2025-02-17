import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

@Entity()
class Race {

  @PrimaryKey()
  id!: bigint;

  @Property()
  name!: string;

  @OneToMany({
    entity: () => Runner,
    mappedBy: runner => runner.race,
  })
  runners = new Collection<Runner>(this);

}

@Entity()
class Runner {

  @PrimaryKey()
  id!: bigint;

  @Property()
  name!: string;

  @Property()
  position!: number;

  @ManyToOne(() => Race)
  race!: Race;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Runner],
    dbName: `:memory:`,
    loadStrategy: 'select-in',
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

test('5693', async () => {
  const race = new Race();
  race.name = 'New York City Marathon';
  const runner1 = new Runner();
  runner1.name = 'John Smith';
  runner1.position = 3;
  race.runners.add(runner1);
  const runner2 = new Runner();
  runner2.name = 'Silvia Hamilton';
  runner2.position = 1;
  race.runners.add(runner2);
  const runner3 = new Runner();
  runner3.name = 'Arthur McFly';
  runner3.position = 2;
  race.runners.add(runner3);
  await orm.em.persistAndFlush(race);
  orm.em.clear();

  const mock = mockLogger(orm);
  const loadedRace = await orm.em.findOneOrFail(Race, { id: { $ne: null } }, {
    populate: ['runners'],
    populateOrderBy: {
      runners: {
        position: 'asc',
      },
    },
  });
  expect(mock.mock.calls[0][0]).toMatch('select `r0`.* from `race` as `r0` where `r0`.`id` is not null limit 1');
  expect(mock.mock.calls[1][0]).toMatch('select `r0`.* from `runner` as `r0` where `r0`.`race_id` in (\'1\') order by `r0`.`position` asc');
  expect(loadedRace.runners.getItems()).toMatchObject([
    { position: 1 },
    { position: 2 },
    { position: 3 },
  ]);
});
