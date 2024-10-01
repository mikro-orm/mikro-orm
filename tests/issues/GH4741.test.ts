import {
  Collection,
  Entity,
  LoadStrategy,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Rel,
  wrap,
} from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class Division {

  @PrimaryKey()
  id!: number;

  @ManyToOne({ entity: 'Outer', deleteRule: 'cascade' })
  outer!: Rel<Outer>;

  @OneToMany({ entity: 'Inner', mappedBy: 'division', orphanRemoval: true })
  inners = new Collection<Inner>(this);

}

@Entity()
class Geometry {

  @PrimaryKey()
  id!: number;

}

@Entity()
class Inner {

  @PrimaryKey()
  id!: number;

  @ManyToOne({ entity: 'Geometry' })
  geometry!: Geometry;

  @ManyToOne({ entity: 'Division', deleteRule: 'cascade' })
  division!: Division;

}

@Entity()
class Outer {

  @PrimaryKey()
  id!: number;

  @OneToMany('Division', (item: Division) => item.outer, { orphanRemoval: true })
  divisions = new Collection<Division>(this);

  @OneToOne({ entity: 'Division', owner: true, nullable: true })
  activeDivision?: Division;

}


let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Outer, Division, Inner, Geometry],
    dbName: ':memory:',
    loadStrategy: LoadStrategy.JOINED,
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

beforeEach(async () => {
  await orm.schema.clearDatabase();
  const em = orm.em.fork();

  // Create an external boundary using the recently created geometry.
  const o = em.create(Outer, { divisions: [] as number[] });

  // Create a division assigned to the recently created external boundary.
  // The external boundary has this single division so let it be the active one.
  const d = em.create(Division, { outer: o, inners: [] as number[] });
  o.divisions.add(d);
  o.activeDivision = d;

  // Create a geometry
  const g = em.create(Geometry, {});

  // Create an internal boundary assigned to the recently created division.
  const i = em.create(Inner, { id: 123, geometry: g, division: d });
  d.inners.add(i);

  await em.flush();
});

// Outer --> active Division --> [Inners] --> Geometry
test(`GH4741 issue (1/3)`, async () => {
  const em = orm.em.fork();
  const qb = em.createQueryBuilder(Outer, 'o');
  qb.select('*');
  const qb2 = qb.leftJoinAndSelect('o.activeDivision', 'ad');
  const qb3 = qb2.leftJoinAndSelect('ad.inners', 'ai');
  const qb4 = qb3.leftJoinAndSelect('ai.geometry', 'g');

  const q = qb.toQuery();
  expect(q.sql).toBe('select `o`.*, `ad`.`id` as `ad__id`, `ad`.`outer_id` as `ad__outer_id`, `ai`.`id` as `ai__id`, `ai`.`geometry_id` as `ai__geometry_id`, `ai`.`division_id` as `ai__division_id`, `g`.`id` as `g__id` from `outer` as `o` left join `division` as `ad` on `o`.`active_division_id` = `ad`.`id` left join `inner` as `ai` on `ad`.`id` = `ai`.`division_id` left join `geometry` as `g` on `ai`.`geometry_id` = `g`.`id`');

  const res = await qb4.getResult();
  expect(res.length).toBe(1);

  const outer = res[0];
  expect(outer).toBeInstanceOf(Outer);

  const activeDivision = outer.activeDivision;
  expect(activeDivision).toBeInstanceOf(Division);

  if (activeDivision) {
    const inners = activeDivision.inners;
    expect(inners.isInitialized()).toBeTruthy();	// Succeeds
    expect(inners.count()).toBe(1);

    const inner = inners.getItems()[0];
    expect(inner).toBeInstanceOf(Inner);

    const geom = inner.geometry;
    expect(geom).toBeInstanceOf(Geometry);
    expect(wrap(geom).isInitialized()).toBeTruthy();	// Succeeds
  }
});

// Outer --> active Division --> [Inners] --> Geometry
//       |-> [Divisions]
test(`GH4741 issue (2/3)`, async () => {

  const em = orm.em.fork();
  const qb = em.createQueryBuilder(Outer, 'o');

  qb.select('*');
  qb.leftJoinAndSelect('o.divisions', 'd');	// extra join
  qb.leftJoinAndSelect('o.activeDivision', 'ad');
  qb.leftJoinAndSelect('ad.inners', 'ai');
  qb.leftJoinAndSelect('ai.geometry', 'g');

  const q = qb.toQuery();
  expect(q.sql).toBe('select `o`.*, `d`.`id` as `d__id`, `d`.`outer_id` as `d__outer_id`, `ad`.`id` as `ad__id`, `ad`.`outer_id` as `ad__outer_id`, `ai`.`id` as `ai__id`, `ai`.`geometry_id` as `ai__geometry_id`, `ai`.`division_id` as `ai__division_id`, `g`.`id` as `g__id` from `outer` as `o` left join `division` as `d` on `o`.`id` = `d`.`outer_id` left join `division` as `ad` on `o`.`active_division_id` = `ad`.`id` left join `inner` as `ai` on `ad`.`id` = `ai`.`division_id` left join `geometry` as `g` on `ai`.`geometry_id` = `g`.`id`');

  const res = await qb.getResult();
  expect(res.length).toBe(1);

  const outer = res[0];
  expect(outer).toBeInstanceOf(Outer);

  const activeDivision = outer.activeDivision;
  expect(activeDivision).toBeInstanceOf(Division);

  if (activeDivision) {
    const inners = activeDivision.inners;
    expect(inners.isInitialized()).toBeTruthy();	// Succeeds
    expect(inners.count()).toBe(1);

    const inner = inners.getItems()[0];
    expect(inner).toBeInstanceOf(Inner);

    const geom = inner.geometry;
    expect(geom).toBeInstanceOf(Geometry);
    expect(wrap(geom).isInitialized()).toBeTruthy();	// Succeeds
  }
});

// Outer --> active Division --> [Inners] --> Geometry
//       |-> [Divisions] --> [Inners]
test(`GH4741 issue (3/3)`, async () => {
  const em = orm.em.fork();
  const qb = em.createQueryBuilder(Outer, 'o');

  qb.select('*');
  qb.leftJoinAndSelect('o.divisions', 'd');
  qb.leftJoinAndSelect('d.inners', 'i');		// extra join
  qb.leftJoinAndSelect('o.activeDivision', 'ad');
  qb.leftJoinAndSelect('ad.inners', 'ai');
  qb.leftJoinAndSelect('ai.geometry', 'g');

  const q = qb.toQuery();
  expect(q.sql).toBe('select `o`.*, `d`.`id` as `d__id`, `d`.`outer_id` as `d__outer_id`, `i`.`id` as `i__id`, `i`.`geometry_id` as `i__geometry_id`, `i`.`division_id` as `i__division_id`, `ad`.`id` as `ad__id`, `ad`.`outer_id` as `ad__outer_id`, `ai`.`id` as `ai__id`, `ai`.`geometry_id` as `ai__geometry_id`, `ai`.`division_id` as `ai__division_id`, `g`.`id` as `g__id` from `outer` as `o` left join `division` as `d` on `o`.`id` = `d`.`outer_id` left join `inner` as `i` on `d`.`id` = `i`.`division_id` left join `division` as `ad` on `o`.`active_division_id` = `ad`.`id` left join `inner` as `ai` on `ad`.`id` = `ai`.`division_id` left join `geometry` as `g` on `ai`.`geometry_id` = `g`.`id`');

  const res = await qb.getResult();
  expect(res.length).toBe(1);

  const outer = res[0];
  expect(outer).toBeInstanceOf(Outer);

  const activeDivision = outer.activeDivision;
  expect(activeDivision).toBeInstanceOf(Division);

  if (activeDivision) {
    const inners = activeDivision.inners;
    expect(inners.isInitialized()).toBeTruthy();	// Succeeds
    expect(inners.count()).toBe(1);

    const inner = inners.getItems()[0];
    expect(inner).toBeInstanceOf(Inner);

    const geom = inner.geometry;
    expect(geom).toBeInstanceOf(Geometry);
    expect(wrap(geom).isInitialized()).toBeTruthy();	// Fails
  }
});
