import { Collection, Entity, ManyToMany, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

type SquadType = 'GROUND' | 'AIR';

@Entity()
export class Soldier {

  @PrimaryKey()
  id!: number;

  @Property()
  firstName!: string;

  @Property()
  lastName!: string;

  @ManyToMany({ entity: 'Squad' })
  squads = new Collection<Squad>(this);

}

@Entity()
export class Squad {

  @PrimaryKey()
  id!: number;

  @Property()
  type!: SquadType;

  @Property()
  formedAt!: Date;

  @Property({ nullable: true })
  disbandedAt?: Date;

  @ManyToMany({ entity: 'Soldier', mappedBy: 'squads' })
  soldiers = new Collection<Soldier>(this);

}

let orm: MikroORM<SqliteDriver>;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Soldier, Squad],
    dbName: ':memory:',
    driver: SqliteDriver,
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test(`GH issue 3240`, async () => {
  const luke = orm.em.create(Soldier, {
    firstName: 'Luke',
    lastName: 'Skywalker',
  });

  const leia = orm.em.create(Soldier, {
    firstName: 'Leia',
    lastName: 'Organa',
  });

  await orm.em.persistAndFlush([luke, leia]);
  orm.em.clear();

  const soldiers = await orm.em.find(Soldier, {});

  const squad = orm.em.create(Squad, {
    type: 'AIR',
    formedAt: new Date(),
    soldiers,
  });

  await orm.em.persistAndFlush(squad);
  orm.em.clear();

  const fetchedSquad = await orm.em.findOneOrFail(
    Squad,
    { type: 'AIR' },
    { populate: ['soldiers'] },
  );
  expect(fetchedSquad.soldiers).toHaveLength(2);

  await orm.close();
});
