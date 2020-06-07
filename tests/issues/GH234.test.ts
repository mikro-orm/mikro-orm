import { unlinkSync } from 'fs';
import { Collection, Entity, Logger, ManyToMany, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { SqliteDriver, SchemaGenerator } from '@mikro-orm/sqlite';
import { BASE_DIR } from '../bootstrap';

@Entity()
export class A {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @ManyToMany(() => B, b => b.aCollection)
  bCollection: Collection<B> = new Collection<B>(this);

}

@Entity()
export class B {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany(() => A, undefined, { fixedOrder: true })
  aCollection: Collection<A> = new Collection<A>(this);

}

describe('GH issue 234', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B],
      dbName: BASE_DIR + '/../temp/mikro_orm_test_gh234.db',
      debug: false,
      highlight: false,
      type: 'sqlite',
    });
    await new SchemaGenerator(orm.em).dropSchema();
    await new SchemaGenerator(orm.em).createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
    unlinkSync(orm.config.get('dbName')!);
  });

  test('search by m:n', async () => {
    const a1 = new A();
    a1.name = 'a1';
    const a2 = new A();
    a2.name = 'a2';
    const a3 = new A();
    a3.name = 'a3';
    const b = new B();
    b.name = 'b';
    b.aCollection.add(a1, a2, a3);
    await orm.em.persistAndFlush(b);
    orm.em.clear();

    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.config, { logger });
    orm.config.set('highlight', false);
    const res1 = await orm.em.find<B>(B, { aCollection: [1, 2, 3] }, ['aCollection']);
    expect(mock.mock.calls[0][0]).toMatch('select `e0`.* from `b` as `e0` left join `b_a_collection` as `e1` on `e0`.`id` = `e1`.`b_id` where `e1`.`a_id` in (?, ?, ?)');
    expect(mock.mock.calls[1][0]).toMatch('select `e0`.*, `e1`.`a_id`, `e1`.`b_id` from `a` as `e0` left join `b_a_collection` as `e1` on `e0`.`id` = `e1`.`a_id` where `e1`.`b_id` in (?) order by `e1`.`id` asc');
    expect(res1.map(b => b.id)).toEqual([b.id]);

    orm.em.clear();
    mock.mock.calls.length = 0;
    const res2 = await orm.em.find<A>(A, { bCollection: [1, 2, 3] }, ['bCollection']);
    expect(mock.mock.calls[0][0]).toMatch('select `e0`.* from `a` as `e0` left join `b_a_collection` as `e1` on `e0`.`id` = `e1`.`a_id` where `e1`.`b_id` in (?, ?, ?)');
    expect(mock.mock.calls[1][0]).toMatch('select `e0`.*, `e1`.`b_id`, `e1`.`a_id` from `b` as `e0` left join `b_a_collection` as `e1` on `e0`.`id` = `e1`.`b_id` where `e1`.`a_id` in (?, ?, ?) order by `e1`.`id` asc');
    expect(res2.map(a => a.id)).toEqual([a1.id, a2.id, a3.id]);
  });

});
