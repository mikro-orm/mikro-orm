import {
  Collection,
  Entity,
  ManyToOne,
  MikroORM,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Property,
  Ref,
} from '@mikro-orm/sqlite';

@Entity()
class A {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => B, b => b.a, { eager: true, orphanRemoval: true })
  b = new Collection<B>(this);

}

@Entity()
class B {

  @PrimaryKey()
  id!: number;

  @ManyToOne({ entity: () => A, deleteRule: 'cascade', updateRule: 'cascade' })
  a!: Ref<A>;

  @OneToOne(() => C, c => c.b1, { owner: true, nullable: true, default: null, orphanRemoval: true })
  c1!: Ref<C> | null;

  @OneToOne(() => C, c => c.b2, { owner: true, nullable: true, default: null, orphanRemoval: true })
  c2!: Ref<C> | null;

}

@Entity()
class C {

  @PrimaryKey()
  id!: number;

  @ManyToOne({ entity: () => D, deleteRule: 'cascade', updateRule: 'cascade', eager: true })
  e!: Ref<D>;

  @OneToOne(() => B, b => b.c1, { nullable: true })
  b1!: B | null;

  @OneToOne(() => B, b => b.c2, { nullable: true })
  b2!: B | null;

}

@Entity()
class D {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [A, B, C, D],
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #5213', async () => {
  orm.em.create(A, {
    b: [{
      c1: {
        e: { name: 'test' },
      },
    }],
  });
  await orm.em.flush();
  orm.em.clear();

  const [a] = await orm.em.findAll(A, { populate: ['b.*'] });

  a.b.getItems().forEach(b => orm.em.assign(b, {
    c1: null,
    c2: null,
  }));

  await orm.em.flush();
  orm.em.clear();

  const count = await orm.em.count(C);

  // expecting that count is 0, because the only existing C is not referenced in any B anymore
  expect(count).toBe(0);
});
