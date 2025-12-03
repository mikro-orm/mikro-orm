import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../helpers.js';

@Entity()
class B {

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

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [A, B],
      dbName: ':memory:',
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  test('search by m:n', async () => {
    const a = new A();
    a.name = 'a';
    a.type = new B();
    a.type.name = 'b';
    await orm.em.persist(a).flush();
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);
    await orm.em.findAndCount(A, {}, {
      orderBy: { type: 'asc' },
      populate: ['*'],
    });

    const queries: string[] = mock.mock.calls.map(c => c[0]).sort();
    expect(queries).toHaveLength(3);
    expect(queries[0]).toMatch('select `a0`.* from `a` as `a0` order by `a0`.`type_id` asc');
    expect(queries[1]).toMatch('select `b0`.* from `b` as `b0` where `b0`.`id` in (?)');
  });

});
