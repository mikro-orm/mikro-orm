import { Entity, IdEntity, ManyToOne, MikroORM, PrimaryKey, Property } from '../../lib';
import { BASE_DIR } from '../bootstrap';
import { SqliteDriver } from '../../lib/drivers/SqliteDriver';
import { Logger } from '../../lib/utils';

@Entity()
export class A implements IdEntity<A> {

  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'string' })
  name!: string;

  @ManyToOne(() => B)
  type!: B;

}

@Entity()
export class B implements IdEntity<B> {

  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'string' })
  name!: string;

}

describe('GH issue 228', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B],
      dbName: BASE_DIR + '/../temp/mikro_orm_test_gh228.db',
      debug: false,
      highlight: false,
      type: 'sqlite',
      cache: { enabled: false },
    });
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });
  afterAll(async () => orm.close(true));

  test('search by m:n', async () => {
    const a = new A();
    a.name = 'a';
    a.type = new B();
    a.type.name = 'b';
    await orm.em.persistAndFlush(a);
    orm.em.clear();

    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.config, { logger });
    orm.config.set('highlight', false);
    await orm.em.findAndCount(A, {}, {
      orderBy: { type: 'asc' },
      populate: true,
    });
    expect(mock.mock.calls[0][0]).toMatch('select `e0`.* from `a` as `e0` order by `e0`.`type_id` asc');
    expect(mock.mock.calls[1][0]).toMatch('select `e0`.* from `b` as `e0` where `e0`.`id` in (?)');
  });

});
