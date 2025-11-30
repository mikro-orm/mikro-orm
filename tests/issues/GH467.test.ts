import { Collection, MikroORM, Ref } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, OneToMany, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class A {

  @PrimaryKey()
  id!: string;

  @ManyToOne({ entity: 'B', ref: true, nullable: true })
  b?: Ref<B>;

}

@Entity()
class B {

  @PrimaryKey()
  id!: string;

  @OneToMany(() => A, a => a.b)
  as = new Collection<A>(this);

}

describe('GH issue 467', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [A, B],
      dbName: ':memory:',
    });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  test(`wrap().assign to collections is persisted`, async () => {
    const a = new A();
    a.id = 'a1';
    await orm.em.persistAndFlush(a);

    const b = new B();
    orm.em.assign(b, {
      id: 'b1',
      as: ['a1'],
    });
    await orm.em.persistAndFlush(b);
    orm.em.clear();

    const b1 = await orm.em.findOneOrFail(B, 'b1', { populate: ['as'] });
    expect(b1.as.getIdentifiers()).toEqual(['a1']);
  });

  test(`assigning to new collection from inverse side is persisted`, async () => {
    const a = new A();
    a.id = 'a2';
    await orm.em.persistAndFlush(a);

    const b = new B();
    b.id = 'b2';
    b.as.set([orm.em.getReference(A, 'a2')]);
    await orm.em.persistAndFlush(b);
    orm.em.clear();

    const b1 = await orm.em.findOneOrFail(B, 'b2', { populate: ['as'] });
    expect(b1.as.getIdentifiers()).toEqual(['a2']);
  });

  test(`assigning to loaded collection from inverse side is persisted`, async () => {
    const a = new A();
    a.id = 'a3';
    await orm.em.persistAndFlush(a);

    const b = new B();
    b.id = 'b3';
    await orm.em.persistAndFlush(b);
    orm.em.clear();

    const b1 = await orm.em.findOneOrFail(B, 'b3', { populate: ['as'] });
    b1.as.set([orm.em.getReference(A, 'a3')]);
    await orm.em.flush();
    orm.em.clear();

    const b2 = await orm.em.findOneOrFail(B, 'b3', { populate: ['as'] });
    expect(b2.as.getIdentifiers()).toEqual(['a3']);
  });

});
