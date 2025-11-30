import { Collection, MikroORM } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../helpers.js';

@Entity()
class A {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => B, b => b.a)
  bItems = new Collection<B>(this);

}

@Entity()
class B {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => A)
  a!: A;

  @Property()
  foo = 'bar';

}

describe('GH issue 369', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [A, B],
      dbName: ':memory:',
    });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  test(`removing entity that is inside a 1:m collection`, async () => {
    const mock = mockLogger(orm, ['query']);

    const a = new A();
    const b = new B();
    b.a = a;
    await orm.em.persist(b).flush();
    await orm.em.remove(b).flush();
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into `a` (`id`) select null as `id` returning `id`');
    expect(mock.mock.calls[2][0]).toMatch('insert into `b` (`a_id`, `foo`) values (?, ?) returning `id`');
    expect(mock.mock.calls[3][0]).toMatch('commit');
    expect(mock.mock.calls[4][0]).toMatch('begin');
    expect(mock.mock.calls[5][0]).toMatch('delete from `b` where `id` in (?)');
    expect(mock.mock.calls[6][0]).toMatch('commit');
    expect(mock.mock.calls).toHaveLength(7);
  });

});
