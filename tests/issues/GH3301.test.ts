import { Collection, Entity, OneToMany, ManyToOne, MikroORM, PrimaryKey } from '@mikro-orm/sqlite';

@Entity()
export class Collector {

  @PrimaryKey()
  id!: number;

  @OneToMany({
    entity: 'Collect',
    mappedBy: 'collector',
  })
  collecting = new Collection<Collect>(this);

}

@Entity()
export class Collectable {

  @PrimaryKey()
  id!: number;

  @OneToMany({
    entity: 'Collect',
    mappedBy: 'collectable',
  })
  collectors = new Collection<Collect>(this);

}

@Entity()
export class Collect {

  @PrimaryKey()
  id!: number;

  @ManyToOne()
  collector?: Collector;

  @ManyToOne()
  collectable?: Collectable;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Collect, Collector, Collectable],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

afterAll(() => orm.close(true));

describe('GH issue #3301', () => {
  test('select with $or on 1:m and m:1 auto-joined relation', () => {
    const query = {
      $or: [{
        collecting: {
          collectable: { id: 1 },
        },
      }, {
        collecting: {
          collectable: { id: { $eq: 2 } },
        },
      }],
    };
    const expected = 'select `c0`.* from `collector` as `c0` ' +
      'left join `collect` as `c1` on `c0`.`id` = `c1`.`collector_id` ' +
      'where (`c1`.`collectable_id` = 1 or `c1`.`collectable_id` = 2)';
    const sql1 = orm.em.createQueryBuilder(Collector).select('*').where(query).getFormattedQuery();
    expect(sql1).toBe(expected);
    const sql2 = orm.em.createQueryBuilder(Collector).where(query).getFormattedQuery();
    expect(sql2).toBe(expected);
  });

  test('select 1:m auto-joined relation with $or on m:1 auto-joined relation', () => {
    const query = {
      collecting: {
        $or: [
          { collectable: { id: 1 } },
          { collectable: { id: { $eq: 2 } } },
        ],
      },
    };
    const expected = 'select `c0`.* from `collector` as `c0` ' +
      'left join `collect` as `c1` on `c0`.`id` = `c1`.`collector_id` ' +
      'where (`c1`.`collectable_id` = 1 or `c1`.`collectable_id` = 2)';
    const sql1 = orm.em.createQueryBuilder(Collector).select('*').where(query).getFormattedQuery();
    expect(sql1).toBe(expected);
    const sql2 = orm.em.createQueryBuilder(Collector).where(query).getFormattedQuery();
    expect(sql2).toBe(expected);
  });

  test('select 1:m and m:1 auto-joined relation with $or', () => {
    const query = {
      collecting: {
        collectable: {
          $or: [{
            id: 1,
          }, {
            id: { $eq: 2 },
          }],
        },
      },
    };
    const expected = 'select `c0`.* from `collector` as `c0` ' +
      'left join `collect` as `c1` on `c0`.`id` = `c1`.`collector_id` ' +
      'left join `collectable` as `c2` on `c1`.`collectable_id` = `c2`.`id` ' +
      'where (`c2`.`id` = 1 or `c2`.`id` = 2)';
    const sql1 = orm.em.createQueryBuilder(Collector).select('*').where(query).getFormattedQuery();
    expect(sql1).toBe(expected);
    const sql2 = orm.em.createQueryBuilder(Collector).where(query).getFormattedQuery();
    expect(sql2).toBe(expected);
  });

});
