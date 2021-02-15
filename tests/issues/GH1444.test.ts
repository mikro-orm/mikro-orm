import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';

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
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test(`GH issue 1444`, async () => {
    const fixture1 = new A('a1');
    await orm.em.persistAndFlush(fixture1);
    orm.em.clear();

    const found1 = await orm.em.findOneOrFail(A, { name: 'a1' });

    expect(typeof found1._id).toBe('number');
    expect(typeof found1.id).toBe('string');
  });
});
