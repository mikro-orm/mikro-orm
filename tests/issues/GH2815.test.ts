import { Entity, MikroORM, OneToOne, PrimaryKey } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class Position {

  @PrimaryKey()
  id!: number;

  @OneToOne(() => Leg, (leg: Leg) => leg.position, { owner: true, nullable: true })
  leg?: any;

}

@Entity()
export class Leg {

  @PrimaryKey()
  id!: number;

  @OneToOne(() => Position, (position: Position) => position.leg, { nullable: true })
  position?: Position;

}

@Entity()
export class Position2 {

  @PrimaryKey()
  id!: number;

  @OneToOne(() => Leg2, (leg: Leg2) => leg.position, { owner: true, nullable: true, orphanRemoval: true })
  leg?: any;

}

@Entity()
export class Leg2 {

  @PrimaryKey()
  id!: number;

  @OneToOne(() => Position2, (position: Position2) => position.leg, { nullable: true })
  position?: Position2;

}

describe('GH issue 2815', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      driver: SqliteDriver,
      dbName: ':memory:',
      entities: [Position, Leg, Position2, Leg2],
    });
    await orm.schema.createSchema();
  });

  beforeEach(async () => {
    await orm.schema.refreshDatabase();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`find in transaction finds previously inserted entities`, async () => {
    const b = orm.em.create(Leg, {});
    await orm.em.persistAndFlush(b);
    orm.em.clear();

    const p = orm.em.create(Position, { leg: b });
    await orm.em.persistAndFlush(p);

    p.leg = null;

    await orm.em.flush();

    orm.em.clear();

    const leg = await orm.em.findOne(Leg, 1);
    expect(leg).toBeTruthy();
  });

  test(`test 1-1 propagation for orphanremoval false`, async () => {
    const b = orm.em.create(Leg, {});
    await orm.em.persistAndFlush(b);

    const p = orm.em.create(Position, { leg: b });
    await orm.em.persistAndFlush(p);

    p.leg = null;

    const uow = orm.em.getUnitOfWork();
    uow.computeChangeSets();
    expect(uow.getRemoveStack().size).toEqual(0);
  });

  test(`test 1-1 propagation for orphanremoval true`, async () => {
    const b = orm.em.create(Leg2, {});
    await orm.em.persistAndFlush(b);

    const p = orm.em.create(Position2, { leg: b });
    await orm.em.persistAndFlush(p);

    p.leg = null;

    const uow = orm.em.getUnitOfWork();
    uow.computeChangeSets();
    expect(uow.getRemoveStack().size).toEqual(1);
  });

});
