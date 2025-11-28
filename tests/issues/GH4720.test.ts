import { Collection, LoadStrategy, PrimaryKeyProp } from '@mikro-orm/core';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider, Unique } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/postgresql';

@Entity()
class Parent {

  @PrimaryKey()
  id!: number;

  @Property()
  @Unique()
  uniqueProp!: string;

  @OneToMany({ entity: () => Child, mappedBy: 'parent' })
  children: Collection<Child> = new Collection<Child>(this);

  @Property()
  data!: string;

}
@Entity()
class ChildType {

  [PrimaryKeyProp]?: ['foo', 'boo'];

  @PrimaryKey()
  foo!: string;

  @PrimaryKey()
  boo!: string;

  @Property()
  data!: string;

}

@Entity()
class Child {

  [PrimaryKeyProp]?: ['parent', 'type'];

  @ManyToOne({ entity: () => Parent, primary: true })
  parent!: Parent;

  @ManyToOne({ entity: () => ChildType, primary: true })
  type!: ChildType;

  @Property()
  data!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Parent],
    dbName: '4720',
    loadStrategy: LoadStrategy.JOINED,
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

test('GH 4720', async () => {
  const parent = await orm.em.insert(Parent, {
    uniqueProp: 'aaa',
    data: '123',
  });
  await orm.em.insertMany(ChildType, [
    { foo: 'f1', boo: 'b1', data: '456' },
    { foo: 'f2', boo: 'b2', data: '789' },
  ]);
  await orm.em.insertMany(Child, [
    { parent, type: ['f1', 'b1'], data: '111' },
    { parent, type: ['f2', 'b2'], data: '222' },
  ]);

  const p = await orm.em.findOneOrFail(Parent, {
    uniqueProp: 'aaa',
  });

  p.data = 'pppppppppp';
  await orm.em.flush();

  const sameParent = await orm.em.findOneOrFail(
    Parent,
    { uniqueProp: 'aaa' },
    { populate: ['children', 'children.type'] },
  );

  sameParent.children[0].data = 'eeeeeeeeeee';
  sameParent.children[1].data = 'wwwwwwwwwww';
  await orm.em.flush();
});
