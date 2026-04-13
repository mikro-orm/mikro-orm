// @Entity() and @Embeddable() ES decorators should accept abstract classes (GH discussion 7553)
import { MikroORM } from '@mikro-orm/sqlite';
import { Embeddable, Embedded, Entity, PrimaryKey, Property } from '@mikro-orm/decorators/es';

@Embeddable({ abstract: true })
abstract class BaseAddress {
  @Property({ type: 'string' })
  street!: string;
}

@Embeddable()
class HomeAddress extends BaseAddress {
  @Property({ type: 'string' })
  apartment!: string;
}

@Entity({ abstract: true })
abstract class Person {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'string' })
  name!: string;
}

@Entity()
class Employee extends Person {
  @Property({ type: 'string' })
  role!: string;

  @Embedded(() => HomeAddress)
  address!: HomeAddress;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = new MikroORM({
    entities: [Employee, HomeAddress],
    dbName: ':memory:',
  });
  await orm.schema.create();
});

afterAll(() => orm.close(true));

test('@Entity() on abstract class with ES decorators', async () => {
  const em = orm.em.fork();
  em.create(Employee, { name: 'John', role: 'dev', address: { street: '1st', apartment: '2A' } });
  await em.flush();
  em.clear();

  const emp = await em.findOneOrFail(Employee, { name: 'John' });
  expect(emp.role).toBe('dev');
  expect(emp.address.street).toBe('1st');
});
