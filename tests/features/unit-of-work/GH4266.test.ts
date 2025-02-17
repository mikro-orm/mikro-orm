import {
  Entity,
  Ref,
  ManyToOne,
  PrimaryKey,
  Property,
  SimpleLogger,
} from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

@Entity()
export class A {

  @PrimaryKey()
  id!: number;

  @Property({
    nullable: true,
    type: 'datetime',
  })
  createdAt?: Date;

  @Property({ length: 64, name: 'name', type: 'varchar' })
  name!: string;

}

@Entity()
export class B {

  @PrimaryKey()
  id!: number;

  @Property({ length: 64, name: 'name', type: 'varchar' })
  name!: string;

  @ManyToOne(() => A, { ref: true })
  a!: Ref<A>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [A, B],
    forceUndefined: true,
    loggerFactory: SimpleLogger.create,
  });

  await orm.schema.createSchema();
});

afterAll(() => orm.close(true));

test('update triggered after insert (GH #4266)', async () => {
  const mock = mockLogger(orm);
  orm.em.create(A, {
    id: 1,
    name: 'a',
  });

  await orm.em.flush();
  orm.em.clear();

  const a = await orm.em.findOneOrFail(A, { name: 'a' });

  orm.em.create(B, {
    a: a.id,
    id: 2,
    name: 'b',
  });
  await orm.em.flush();

  expect(mock.mock.calls).toEqual([
    ['[query] begin'],
    ['[query] insert into `a` (`id`, `name`) values (1, \'a\')'],
    ['[query] commit'],
    ['[query] select `a0`.* from `a` as `a0` where `a0`.`name` = \'a\' limit 1'],
    ['[query] begin'],
    ['[query] insert into `b` (`id`, `name`, `a_id`) values (2, \'b\', 1)'],
    ['[query] commit'],
  ]);
});
