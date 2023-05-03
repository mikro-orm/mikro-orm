import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  OneToOne,
  IdentifiedReference,
  OneToMany,
  Collection,
  LoadStrategy,
} from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class A {

  @PrimaryKey()
  id!: number;

  @OneToOne(() => B, b => b.a, {
    orphanRemoval: true,
    eager: false,
    wrappedReference: true,
  })
  b!: IdentifiedReference<B>;

  @Property()
  name!: string;

}

@Entity()
class B {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToOne({
    entity: () => A,
    inversedBy: 'b',
    wrappedReference: true,
    serializer: project => project.id,
    onDelete: 'cascade',
  })
  a!: IdentifiedReference<A>;

  @OneToMany(() => C, child => child.parent, {
    eager: true,
    orphanRemoval: true,
  })
  children = new Collection<C>(this);

}

@Entity()
class C {

  @PrimaryKey()
  id!: number;

  @Property()
  value!: string;

  @ManyToOne(() => B, {
    serializer: (b) => b.id,
    wrappedReference: true,
    onDelete: 'cascade',
  })
  parent!: IdentifiedReference<B>;

}

let orm: MikroORM;
let orm2: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [B, A],
    dbName: `mikro_orm_test_gh_4304`,
    port: 3308,
    loadStrategy: LoadStrategy.SELECT_IN,
    filters: {
      hasName: {
        cond: { name: { $ne: null } },
        entity: ['Project', 'Organization', 'Workspace', 'Risk'],
        default: true,
      },
    },
  });
  orm2 = await MikroORM.init({
    entities: [B, A],
    dbName: `mikro_orm_test_gh_4304`,
    port: 3308,
    loadStrategy: LoadStrategy.SELECT_IN,
    filters: {
      hasName: {
        cond: { name: { $ne: null } },
        entity: ['Project', 'Organization', 'Workspace', 'Risk'],
        default: true,
      },
    },
  });
  await orm.schema.refreshDatabase();

  orm.em.create(A, {
    name: 'Root parent',
    b: {
      name: 'Child with children',
      children: [{ value: 'first child' }, { value: 'second child' }],
    },
  });
  await orm.em.flush();
});

afterAll(async () => {
  await orm.close();
  await orm2.close();
});

test('4304', async () => {
  const a = await orm2.em
    .getRepository(A)
    .findOneOrFail(1, { populate: [], filters: { hasName: false } });
  await orm2.em.flush();

  const b = await a.b.load();

  expect(b.children).toBeDefined(); // Test fails here
});
