import { Collection, Entity, LoadStrategy, ManyToOne, MikroORM, OneToMany, OneToOne, Primary, PrimaryKey, PrimaryKeyProp, Property, StringType } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

@Entity()
export class User {

  @PrimaryKey({ length: 100 })
  firstName!: string;

  @PrimaryKey({ length: 100 })
  lastName!: string;

  @OneToMany({ entity: () => Team, mappedBy: 'manager' })
  managedTeams = new Collection<Team>(this);

  [PrimaryKeyProp]?: ['firstName', 'lastName'];

}

@Entity()
export class Order {

  @PrimaryKey({ type: StringType })
  id!: string;

  @Property()
  status!: string;

  @OneToOne({
    entity: () => Team,
    mappedBy: 'currentOrder',
    mapToPk: true,
    nullable: true,
  })
  owningTeam?: string;

}

@Entity()
export class Team {

  @PrimaryKey({ type: StringType })
  id!: string;

  @OneToOne({
    entity: () => Order,
    owner: true,
    mapToPk: true,
    nullable: true,
  })
  currentOrder?: string;

  @ManyToOne({
    entity: () => User,
    mapToPk: true,
    nullable: true,
  })
  manager?: Primary<User>;

  @Property()
  status!: string;

}

describe('mapToPk', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Order, Team],
      dbName: ':memory:',
      driver: SqliteDriver,
      forceUndefined: true,
    });

    await orm.schema.createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  beforeEach(async () => {
    await orm.schema.clearDatabase();
    orm.em.clear();
  });

  test('mapToPk works with flushing and cascades', async () => {
    const mock = mockLogger(orm, ['query', 'query-params']);

    const o1 = orm.em.create(Order, {
      id: 'order1',
      status: 'confirmed',
    });

    await orm.em.persistAndFlush(o1);
    const t3 = new Team();
    orm.em.assign(t3, {
      id: 'team1',
      status: 'status1',
      currentOrder: o1.id,
    });
    expect(t3.currentOrder).toBe(o1.id);
    await orm.em.persistAndFlush(t3);
    orm.em.clear();

    const team = await orm.em.findOneOrFail(Team, {
      id: 'team1',
    });

    team.currentOrder = undefined;
    await orm.em.flush();

    expect(mock.mock.calls).toHaveLength(10);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch("insert into `order` (`id`, `status`) values ('order1', 'confirmed')");
    expect(mock.mock.calls[2][0]).toMatch('commit');
    expect(mock.mock.calls[3][0]).toMatch('begin');
    expect(mock.mock.calls[4][0]).toMatch("insert into `team` (`id`, `current_order_id`, `status`) values ('team1', 'order1', 'status1')");
    expect(mock.mock.calls[5][0]).toMatch('commit');
    expect(mock.mock.calls[6][0]).toMatch("select `t0`.* from `team` as `t0` where `t0`.`id` = 'team1' limit 1");
    expect(mock.mock.calls[7][0]).toMatch('begin');
    expect(mock.mock.calls[8][0]).toMatch("update `team` set `current_order_id` = NULL where `id` = 'team1'");
    expect(mock.mock.calls[9][0]).toMatch('commit');

    mock.mockReset();
  });

  test.each(Object.values(LoadStrategy))('mapToPk works with populate using "%s" strategy (simplePK)', async strategy => {
    const o1 = orm.em.create(Order, {
      id: 'order1',
      status: 'confirmed',
    });

    await orm.em.persistAndFlush(o1);

    const t3 = orm.em.create(Team, {
      id: 'team1',
      status: 'status1',
      currentOrder: o1.id,
    });

    expect(t3.currentOrder).toBe(o1.id);
    // id is not propagated to the inversed side
    // expect(o1.owningTeam).toBe(t3.id);
    await orm.em.persistAndFlush(t3);
    orm.em.clear();

    const mock = mockLogger(orm, ['query', 'query-params']);
    // owning side
    const team = await orm.em.findOneOrFail(
      Team,
      { id: 'team1' },
      { populate: ['currentOrder'], strategy },
    );

    expect(team.currentOrder).toBe(o1.id);
    orm.em.clear();

    // inverse side
    const order = await orm.em.findOneOrFail(
      Order,
      { id: 'order1' },
      { populate: ['owningTeam'], strategy },
    );

    expect(order.owningTeam).toBe(t3.id);
    expect(mock.mock.calls).toHaveLength(2);
    expect(mock.mock.calls[0][0]).toMatch("select `t0`.* from `team` as `t0` where `t0`.`id` = 'team1' limit 1");
    expect(mock.mock.calls[1][0]).toMatch("select `o0`.*, `o1`.`id` as `o1__id` from `order` as `o0` left join `team` as `o1` on `o0`.`id` = `o1`.`current_order_id` where `o0`.`id` = 'order1' limit 1");
    mock.mockReset();
  });

  test.each(Object.values(LoadStrategy))('mapToPk works with populate using "%s" strategy (compositePK)', async strategy => {
    const u = orm.em.create(User, {
      firstName: 'f',
      lastName: 'l',
    });

    const t = orm.em.create(Team, {
      id: 'team1',
      status: 'status1',
      manager: [u.firstName, u.lastName],
    });

    await orm.em.flush();

    expect(t.manager).toEqual(['f', 'l']);

    orm.em.clear();

    const team = await orm.em.findOneOrFail(
      Team,
      { id: 'team1' },
      { populate: ['manager'], strategy },
    );

    expect(team.manager).toEqual(t.manager);
  });

});
