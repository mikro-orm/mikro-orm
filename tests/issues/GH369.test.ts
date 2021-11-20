import { Entity, ManyToOne, OneToMany, PrimaryKey, Property, Collection, MikroORM } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';
import { SchemaGenerator } from '@mikro-orm/sqlite';
import { mockLogger } from '../bootstrap';

@Entity()
class A {

  @PrimaryKey()
  id!: number;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
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

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await new SchemaGenerator(orm.em).createSchema();
  });

  afterAll(() => orm.close(true));

  test(`removing entity that is inside a 1:m collection`, async () => {
    const mock = mockLogger(orm, ['query']);

    const a = new A();
    const b = new B();
    b.a = a;
    await orm.em.persistAndFlush(b);
    await orm.em.removeAndFlush(b);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into `a` default values');
    expect(mock.mock.calls[2][0]).toMatch('insert into `b` (`a_id`, `foo`) values (?, ?)');
    expect(mock.mock.calls[3][0]).toMatch('commit');
    expect(mock.mock.calls[4][0]).toMatch('begin');
    expect(mock.mock.calls[5][0]).toMatch('delete from `b` where `id` in (?)');
    expect(mock.mock.calls[6][0]).toMatch('commit');
    expect(mock.mock.calls).toHaveLength(7);
  });

});
