import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, OneToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
export class A {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToOne({ entity: () => B, nullable: true, orphanRemoval: true })
  b?: any;

}

@Entity()
export class B {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToOne(() => A, a => a.b, { nullable: true })
  a?: A;

}

describe('GH issue 2806', () => {

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
    const a = orm.em.create(A, { name: 'a', b: { name: 'b' } });
    await orm.em.fork().persistAndFlush(a);
    orm.em.clear();

    const a1 = await orm.em.findOneOrFail(A, a, { populate: ['b'] });
    a1.b = orm.em.create(B, { name: 'b2' });
    await orm.em.flush();
    expect(a1.b).toBeDefined();
    const a2 = await orm.em.fork().findOneOrFail(A, a, { populate: ['b'] });
    expect(a2.b).toBeDefined();
  });

});
