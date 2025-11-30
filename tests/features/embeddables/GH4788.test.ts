import { EventArgs, EventSubscriber, PrimaryKeyProp, Ref } from '@mikro-orm/core';
import { Embeddable, Embedded, Entity, ManyToOne, OneToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';

@Embeddable()
class A {

  @Property({ nullable: true })
  alpha!: number | null;

  @ManyToOne(() => C, { ref: true })
  c!: Ref<C>;

}

@Entity()
class B {

  @PrimaryKey()
  id!: number;

  @Embedded({ entity: () => A, object: false, nullable: true })
  a!: A | null;

}

@Entity()
class C {

  [PrimaryKeyProp]!: 'node';
  @OneToOne({ entity: () => D, primary: true, deleteRule: 'cascade', updateRule: 'cascade' })
  node!: Ref<D>;

}

@Entity()
class D {

  @PrimaryKey()
  id!: number;

}

@Embeddable()
class A2 {

  @Property()
  alpha!: number | null;

  @ManyToOne(() => C2, { ref: true })
  c2!: Ref<C2>;

}

@Entity()
class B2 {

  @PrimaryKey()
  id!: number;

  @Embedded({ entity: () => A2, object: false, nullable: true })
  a2!: A2 | null;

}

@Entity()
class C2 {

  @PrimaryKey()
  id!: number;

}

class FooBarSubscriber implements EventSubscriber {

  async afterUpdate(args: EventArgs<any>): Promise<void> {
    throw new Error('afterUpdate called but nothing changed');
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [A, B, C, D, A2, B2, C2],
    dbName: ':memory:',
    subscribers: [new FooBarSubscriber()],
  });
  await orm.schema.create();
});

afterAll(() => orm.close(true));

test('embedded with ManyToOne to foreign key as primary key entity', async () => {
  orm.em.create(B, { a: null });
  await orm.em.flush();
  orm.em.clear();
  await orm.em.getRepository(B).findAll();
  await orm.em.flush(); // update query is created
  orm.em.clear();
});

test('embedded with ManyToOne to entity', async () => {
  orm.em.create(B2, { a2: null });
  await orm.em.flush();
  orm.em.clear();
  await orm.em.getRepository(B2).findAll();
  await orm.em.flush(); // no update query is created
  orm.em.clear();
});
