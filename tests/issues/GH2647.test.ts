import { Entity, ManyToOne, MikroORM, PrimaryKey } from '@mikro-orm/core';

@Entity()
export class A {

  @PrimaryKey()
  id: number;

  constructor(id: number) {
    this.id = id;
  }

}

@Entity()
export class B {

  @PrimaryKey()
  id: number;

  constructor(id: number) {
    this.id = id;
  }

}

@Entity()
export class C {

  @PrimaryKey()
  id: number;

  constructor(id: number) {
    this.id = id;
  }

}

@Entity()
export class D {

  @PrimaryKey()
  id: number;

  constructor(id: number) {
    this.id = id;
  }

}

@Entity()
export class AB {

  @ManyToOne(() => A, { eager: true, primary: true })
  a: A;

  @ManyToOne(() => B, { eager: true, primary: true })
  b: B;

  constructor(a: A, b: B) {
    this.a = a;
    this.b = b;
  }

}

@Entity()
export class CAB {

  @ManyToOne(() => C, { eager: true, primary: true })
  c: C;

  @ManyToOne(() => AB, { eager: true, primary: true })
  ab: AB;

  constructor(c: C, ab: AB) {
    this.c = c;
    this.ab = ab;
  }

}

@Entity()
export class DCAB {

  @ManyToOne(() => D, { eager: true, primary: true })
  d: D;

  @ManyToOne(() => CAB, { eager: true, primary: true })
  cab: CAB;

  constructor(d: D, cab: CAB) {
    this.d = d;
    this.cab = cab;
  }

}

describe('GH #2647', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B, C, D, AB, CAB, DCAB],
      dbName: `:memory:`,
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  beforeEach(async () => {
    await orm.em.nativeDelete(DCAB, {});
    await orm.em.nativeDelete(CAB, {});
    await orm.em.nativeDelete(AB, {});
    await orm.em.nativeDelete(D, {});
    await orm.em.nativeDelete(C, {});
    await orm.em.nativeDelete(B, {});
    await orm.em.nativeDelete(A, {});
  });

  function createEntities(pks: [number, number, number, number]) {
    const a = new A(pks[0]);
    const b = new B(pks[1]);
    const c = new C(pks[2]);
    const d = new D(pks[3]);
    const ab = new AB(a, b);
    const cab = new CAB(c, ab);
    const dcab = new DCAB(d, cab);
    orm.em.persist([a, b, c, d, ab, cab, dcab]);

    return { d, cab };
  }

  it('should be able to find entity with nested composite key', async () => {
    const { d, cab } = createEntities([1, 2, 3, 4]);
    await orm.em.flush();
    orm.em.clear();

    const res = await orm.em.find(DCAB, { d, cab });
    expect(res).toHaveLength(1);
  });

  it('should be able to find entity with nested composite key (multi insert)', async () => {
    createEntities([11, 12, 13, 14]);
    createEntities([21, 22, 23, 24]);
    createEntities([31, 32, 33, 34]);
    await orm.em.flush();
    orm.em.clear();

    const res = await orm.em.find(DCAB, {});
    expect(res).toHaveLength(3);
  });

});
