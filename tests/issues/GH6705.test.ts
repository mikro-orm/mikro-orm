import { Collection, EagerProps, MikroORM, Ref, t } from '@mikro-orm/sqlite';

import {
  Embeddable,
  Embedded,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { v4 as uuidv4 } from 'uuid';

@Embeddable()
class ExampleEmbeddable {
  @Property({
    type: t.text,
  })
  firstProperty!: string;

  @Property({
    type: t.text,
  })
  secondProperty!: string;
}

@Entity()
class Foo {
  @PrimaryKey({ type: t.uuid })
  id: string = uuidv4();

  @OneToMany({ entity: () => Bar, mappedBy: bar => bar.foo })
  bars = new Collection<Bar>(this);

  @Embedded(() => ExampleEmbeddable)
  embeddedProperty!: ExampleEmbeddable;
}

@Entity()
class Bar {
  [EagerProps]?: 'foo';

  @PrimaryKey({ type: t.uuid })
  id: string = uuidv4();

  @ManyToOne({ entity: () => Foo, nullable: false, ref: true, eager: true })
  foo!: Ref<Foo>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Foo, Bar],
  });
  await orm.schema.create();
});

beforeEach(async () => {
  await orm.schema.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('em.refresh() marks embedded property of populated relationship as undefined in the changeset', async () => {
  const foo = orm.em.create(Foo, { id: uuidv4(), embeddedProperty: { firstProperty: 'Foo', secondProperty: 'foo' } });
  orm.em.create(Bar, { id: uuidv4(), foo });
  await orm.em.flush();
  orm.em.clear();

  const bar = await orm.em.findOneOrFail(Bar, { foo: foo.id });
  await orm.em.nativeUpdate(Foo, foo.id, { embeddedProperty: { firstProperty: 'Foo2', secondProperty: 'foo2' } });
  expect(bar.foo.$.embeddedProperty).toMatchObject({ firstProperty: 'Foo', secondProperty: 'foo' });
  await orm.em.refresh(bar);
  expect(bar.foo.$.embeddedProperty).toMatchObject({ firstProperty: 'Foo2', secondProperty: 'foo2' });

  orm.em.getUnitOfWork().computeChangeSets();
  expect(orm.em.getUnitOfWork().getChangeSets()).toHaveLength(0);
});

test('findOne with refresh:true', async () => {
  const foo = orm.em.create(Foo, { id: uuidv4(), embeddedProperty: { firstProperty: 'Foo', secondProperty: 'foo' } });
  orm.em.create(Bar, { id: uuidv4(), foo });
  await orm.em.flush();
  orm.em.clear();

  const bar = await orm.em.findOneOrFail(Bar, { foo: foo.id });

  await orm.em.findOneOrFail(Bar, bar.id, { refresh: true });

  orm.em.getUnitOfWork().computeChangeSets();
  expect(orm.em.getUnitOfWork().getChangeSets()).toHaveLength(0);
});

test('InvalidFieldNameException thrown after using em.refresh() for 2 entities', async () => {
  const foo = orm.em.create(Foo, { id: uuidv4(), embeddedProperty: { firstProperty: 'Foo', secondProperty: 'foo' } });
  const foo2 = orm.em.create(Foo, { id: uuidv4(), embeddedProperty: { firstProperty: 'Foo', secondProperty: 'foo' } });
  orm.em.create(Bar, { id: uuidv4(), foo });
  orm.em.create(Bar, { id: uuidv4(), foo: foo2 });
  await orm.em.flush();
  orm.em.clear();

  const bar = await orm.em.findOneOrFail(Bar, { foo: foo.id });
  const bar2 = await orm.em.findOneOrFail(Bar, { foo: foo2.id });

  await orm.em.refresh(bar);
  await orm.em.refresh(bar2);

  await expect(orm.em.flush()).resolves.not.toThrow();
});

test('findOne with refresh:true', async () => {
  const foo = orm.em.create(Foo, { id: uuidv4(), embeddedProperty: { firstProperty: 'Foo', secondProperty: 'foo' } });
  const foo2 = orm.em.create(Foo, { id: uuidv4(), embeddedProperty: { firstProperty: 'Foo', secondProperty: 'foo' } });
  orm.em.create(Bar, { id: uuidv4(), foo });
  orm.em.create(Bar, { id: uuidv4(), foo: foo2 });
  await orm.em.flush();
  orm.em.clear();

  const bar = await orm.em.findOneOrFail(Bar, { foo: foo.id });
  const bar2 = await orm.em.findOneOrFail(Bar, { foo: foo2.id });

  await orm.em.findOneOrFail(Bar, bar.id, { refresh: true });
  await orm.em.findOneOrFail(Bar, bar2.id, { refresh: true });

  await expect(orm.em.flush()).resolves.not.toThrow();
});
