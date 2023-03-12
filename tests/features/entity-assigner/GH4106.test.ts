import { Embeddable, Embedded, Entity, Ref, ManyToOne, PrimaryKey, Reference } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class C {

  @PrimaryKey()
  id!: number;

}

@Embeddable()
class B {

  @ManyToOne(() => C, { ref: true })
  c!: Ref<C>;

}

@Entity()
class A {

  @PrimaryKey()
  id!: number;

  @Embedded(() => B)
  b!: B;

}


let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [A, B, C],
    dbName: ':memory:',
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

test('orm.create.assign on embedded with reference', async () => {
  orm.em.create(A, {
    id: 1,
    b: {
      c: { id: 1 },
    },
  });
  orm.em.create(C, { id: 2 });

  await orm.em.flush();
  orm.em.clear();

  const a1 = await orm.em.find(A, {});

  expect(a1.length).toEqual(1);
  expect(a1[0].b.c).toBeInstanceOf(Reference);
  expect(a1[0].b.c.id).toEqual(1);

  orm.em.assign(a1[0], {
    b: {
      c: 2,
    },
  });
  expect(a1[0].b.c).toBeInstanceOf(Reference);

  await orm.em.flush();

  orm.em.clear();
  expect(a1.length).toEqual(1);
  expect(a1[0].b.c.id).toEqual(2);
});
