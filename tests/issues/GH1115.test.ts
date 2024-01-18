import { Entity, ManyToOne, MikroORM, PrimaryKey, Property } from '@mikro-orm/sqlite';

@Entity()
class B {

  @PrimaryKey()
  id!: number;

  @Property()
  property!: string;

}

@Entity()
class A {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => B)
  property!: B;

}

describe('GH issue 1115', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B],
      dbName: ':memory:',
    });
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

  test('findAll({ populate: true }) should return all properties on child even when it has the same name in the parent', async () => {
    const b = orm.em.create(B, { property: 'foo' });
    const a = orm.em.create(A, { property: b });
    await orm.em.persistAndFlush(a);
    orm.em.clear();

    const user = await orm.em.findOne(A, { id: 1 }, { populate: ['*'] });
    const data = JSON.parse(JSON.stringify(user));
    await expect(data.property).toEqual({ id: 1, property: 'foo' });
  });
});
