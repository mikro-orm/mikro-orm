import { Entity, ManyToOne, MikroORM, PrimaryKey, PrimaryKeyProp, Property, SimpleLogger } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

@Entity()
class A {

  @PrimaryKey()
  id!: number;

  @Property()
  number!: number;

}

@Entity()
class B {

  @PrimaryKey()
  id!: number;

  @Property()
  number!: number;

}

@Entity()
class Composite {

  @ManyToOne(() => A, { fieldName: 'a_id', primary: true })
  entityA!: A;

  @ManyToOne(() => B, { fieldName: 'b_id', primary: true })
  entityB!: B;

  [PrimaryKeyProp]?: ['entityA', 'entityB'];

}

@Entity()
class Dependent {

  @ManyToOne(() => Composite, { fieldNames: ['a_id', 'b_id'], primary: true })
  composite!: Composite;

  @PrimaryKey()
  anotherId!: number;

  [PrimaryKeyProp]?: ['composite', 'anotherId'];

}

@Entity()
class Dependent2 {

  @ManyToOne(() => Composite, { fieldNames: ['a_id', 'b_id'], primary: true })
  composite!: Composite;

  [PrimaryKeyProp]?: 'composite';

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [A, B, Composite, Dependent, Dependent2],
    loggerFactory: SimpleLogger.create,
  });
  await orm.schema.refreshDatabase();
});

afterEach(async () => {
  await orm.schema.clearDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('#1. Creating an M:1 with underlying M:1 and another ID tries to insert a null value into underlying M:1', async () => {
  // These have to be created without an ID directly. If created with an ID the test passes.
  const a = orm.em.create(A, { number: 1 });
  const b = orm.em.create(B, { number: 2 });

  const composite = orm.em.create(Composite, { entityA: a, entityB: b }); // Create a M:1 composite of a and b

  // Issue #1: When we try to create a M:1 from composite with an extra PK field, `a_id` is filled, while `b_id` is null
  const d = orm.em.create(Dependent, { composite, anotherId: 3 });

  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock.mock.calls).toEqual([
    ['[query] begin'],
    ['[query] insert into `b` (`number`) values (2) returning `id`'],
    ['[query] insert into `a` (`number`) values (1) returning `id`'],
    ['[query] insert into `composite` (`a_id`, `b_id`) values (1, 1)'],
    ['[query] insert into `dependent` (`a_id`, `b_id`, `another_id`) values (1, 1, 3)'],
    ['[query] commit'],
  ]);
});

test(`#2. 'Nested' M:1 relations created without ID causes their composite to be null`, async () => {
  // These have to be created without an ID directly. If created with an ID the test passes.
  const a = orm.em.create(A, { number: 1 });
  const b = orm.em.create(B, { number: 2 });

  const composite = orm.em.create(Composite, { entityA: a, entityB: b }); // Create a M:1 composite of a and b

  // Issue #2: When we try to create a M:1 from composite without the extra PK field, composite appears to be null and we cannot read `entityA`
  orm.em.create(Dependent2, { composite });

  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock.mock.calls).toEqual([
    ['[query] begin'],
    ['[query] insert into `b` (`number`) values (2) returning `id`'],
    ['[query] insert into `a` (`number`) values (1) returning `id`'],
    ['[query] insert into `composite` (`a_id`, `b_id`) values (2, 2)'],
    ['[query] insert into `dependent2` (`a_id`, `b_id`) values (2, 2)'],
    ['[query] commit'],
  ]);
});
