import { Entity, MikroORM, OneToOne, PrimaryKey, Property } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';
import { mockLogger } from '../../bootstrap';

@Entity()
export class Order {

  @PrimaryKey()
  id!: string;

  @Property()
  status!: string;

}

@Entity()
export class Team {

  @PrimaryKey()
  id!: string;

  @OneToOne({
    entity: () => Order,
    owner: true,
    mapToPk: true,
    nullable: true,
  })
  currentOrder?: string;

  @Property()
  status!: string;

}

describe('mapToPk works with flushing and cascades', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Order, Team],
      dbName: ':memory:',
      type: 'sqlite',
      forceUndefined: true,
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
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
    expect(mock.mock.calls[4][0]).toMatch("insert into `team` (`current_order_id`, `id`, `status`) values ('order1', 'team1', 'status1')");
    expect(mock.mock.calls[5][0]).toMatch('commit');
    expect(mock.mock.calls[6][0]).toMatch("select `e0`.* from `team` as `e0` where `e0`.`id` = 'team1' limit 1");
    expect(mock.mock.calls[7][0]).toMatch('begin');
    expect(mock.mock.calls[8][0]).toMatch("update `team` set `current_order_id` = NULL where `id` = 'team1'");
    expect(mock.mock.calls[9][0]).toMatch('commit');
  });

});
