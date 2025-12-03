import { Collection, MikroORM } from '@mikro-orm/sqlite';

import { Entity, ManyToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

type SquadType = 'GROUND' | 'AIR';

@Entity()
class Soldier {

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
class Squad {

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

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Soldier, Squad],
    dbName: ':memory:',
  });
  await orm.schema.create();
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

  await orm.em.persist([luke, leia]).flush();
  orm.em.clear();

  const soldiers = await orm.em.find(Soldier, {});

  const squad = orm.em.create(Squad, {
    type: 'AIR',
    formedAt: new Date(),
    soldiers,
  });

  await orm.em.persist(squad).flush();
  orm.em.clear();

  const fetchedSquad = await orm.em.findOneOrFail(
    Squad,
    { type: 'AIR' },
    { populate: ['soldiers'] },
  );
  expect(fetchedSquad.soldiers).toHaveLength(2);

  await orm.close();
});
