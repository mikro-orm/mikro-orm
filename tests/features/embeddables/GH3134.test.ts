import {
  Embeddable,
  Embedded,
  Entity,
  MikroORM,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Embeddable()
class Nested {

  @Property()
  field1: string;

  @Property()
  field2: string;

  @Property()
  field3: string;

  constructor(field1: string, field2: string, field3: string) {
    this.field1 = field1;
    this.field2 = field2;
    this.field3 = field3;
  }

}

@Entity()
class Parent {

  @PrimaryKey({ autoincrement: false })
  id: number;

  @Embedded(() => Nested)
  nested: Nested;

  constructor(id: number, nested: Nested) {
    this.id = id;
    this.nested = nested;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Parent],
    dbName: ':memory:',
    driver: SqliteDriver,
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

describe('Github issue 3134', () => {
  test('load embedded entity twice', async () => {
    // initial data
    const nested = new Nested('A', 'B', 'C');
    const parent = new Parent(1, nested);
    await orm.em.fork().persistAndFlush(parent);

    const em1 = orm.em.fork();
    const p1 = await em1.findOneOrFail(Parent, 1);
    expect(p1.nested.field1).toBe('A');
    expect(p1.nested.field2).toBe('B');
    expect(p1.nested.field3).toBe('C');

    const em2 = orm.em.fork();
    const p = await em2.findOneOrFail(Parent, 1);
    p.nested.field1 = 'Z';
    await em2.persistAndFlush(p);

    const p2 = await em1.findOneOrFail(Parent, 1);
    expect(p1).toBe(p2);
    expect(p1.nested).toEqual({
      field1: 'Z',
      field2: 'B',
      field3: 'C',
    });
  });
});

