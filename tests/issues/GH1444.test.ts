import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
class A {

  @PrimaryKey({ hidden: true })
  _id!: number;

  @Property({ unique: true, length: 36 })
  id: string = uuid();

  @Property()
  name!: string;

  constructor(name: string) {
    this.name = name;
  }

}

describe('GH issue 1444', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A],
      dbName: `:memory:`,
      driver: SqliteDriver,
    });
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

  test(`GH issue 1444`, async () => {
    await orm.em.fork().persistAndFlush(new A('a1'));
    const found1 = await orm.em.findOneOrFail(A, { name: 'a1' });
    expect(typeof found1._id).toBe('number');
    expect(typeof found1.id).toBe('string');
  });
});
