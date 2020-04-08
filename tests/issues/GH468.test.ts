import { unlinkSync } from 'fs';
import { Collection, Entity, PrimaryKey, Property, ManyToOne, OneToMany, MikroORM, ReflectMetadataProvider, IdentifiedReference, wrap } from '../../lib';
import { SqliteDriver } from '../../lib/drivers/SqliteDriver';

@Entity()
class A {

  @PrimaryKey()
  id!: string;

  @ManyToOne({
    entity: () => B,
    wrappedReference: true,
    nullable: true,
  })
  b?: IdentifiedReference<B>;

}

@Entity()
class B {

  @PrimaryKey()
  id!: string;

  @OneToMany(
    () => A,
    (a) => a.b,
  )
  as = new Collection<A>(this);

}

describe('GH issue 468', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B],
      dbName: __dirname + '/../../temp/mikro_orm_test_gh468.db',
      debug: false,
      highlight: false,
      type: 'sqlite',
      metadataProvider: ReflectMetadataProvider,
      cache: { enabled: false },
    });
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
    unlinkSync(orm.config.get('dbName')!);
  });

  test(`wrap().assign to collections is persisted`, async () => {
    {
      const a = new A();
      a.id = 'a1';
      await orm.em.persistAndFlush(a);

      const b = new B();
      wrap(b).assign({
        id: 'b1',
        as: ['a'],
      }, {
        em: orm.em,
      });
      await orm.em.persistAndFlush(b);
      orm.em.clear();
    }

    const b = await orm.em.findOneOrFail(B, { id: 'b1' });
    await b.as.init();
    expect(b.as.getIdentifiers()).toMatchObject(['a1']);
  });

  test(`assigning to new collection from inverse side is persisted`, async () => {
    {
      const a = new A();
      a.id = 'a2';
      await orm.em.persistAndFlush(a);

      const b = new B();
      b.id = 'b2';
      b.as.set([orm.em.getReference(A, 'a2')]);
      await orm.em.persistAndFlush(b);
      orm.em.clear();
    }

    const b = await orm.em.findOneOrFail(B, { id: 'b2' });
    await b.as.init();
    expect(b.as.getIdentifiers()).toMatchObject(['a2']);
  });

  test(`assigning to loaded collection from inverse side is persisted`, async () => {
    {
      const a = new A();
      a.id = 'a3';
      await orm.em.persistAndFlush(a);

      const b = new B();
      b.id = 'b3';
      await orm.em.persistAndFlush(b);
      orm.em.clear();
    }
    {
      const b = await orm.em.findOneOrFail(B, { id: 'b3' });
      await b.as.init();
      b.as.set([orm.em.getReference(A, 'a3')]);
      await orm.em.flush();
      orm.em.clear();
    }

    const b = await orm.em.findOneOrFail(B, { id: 'b3' });
    await b.as.init();
    expect(b.as.getIdentifiers()).toMatchObject(['a3']);
  });
});
