import { unlinkSync } from 'fs';
import { Entity, ManyToOne, MikroORM, PrimaryKey, Property, ReflectMetadataProvider } from '../../lib';
import { BASE_DIR } from '../bootstrap';
import { SqliteDriver } from '../../lib/drivers/SqliteDriver';
import { Logger } from '../../lib/utils';

@Entity()
export class B {

  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'string' })
  name!: string;

}

@Entity()
export class A {

  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'string' })
  name!: string;

  @ManyToOne(() => B)
  type!: B;

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
      metadataProvider: ReflectMetadataProvider,
      cache: { enabled: false },
    });
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
    unlinkSync(orm.config.get('dbName')!);
  });

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

    const queries: string[] = mock.mock.calls.map(c => c[0]).sort();
    expect(queries).toHaveLength(3);
    expect(queries[0]).toMatch('select `e0`.* from `a` as `e0` order by `e0`.`type_id` asc');
    expect(queries[1]).toMatch('select `e0`.* from `b` as `e0` where `e0`.`id` in (?)');
  });

});
