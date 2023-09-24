import { Collection, Entity, IdentifiedReference, ManyToOne, MikroORM, OneToMany, OneToOne, PrimaryKey, PrimaryKeyProp, PrimaryKeyType, Property, Reference } from '@mikro-orm/postgresql';
import { mockLogger } from '../helpers';

@Entity()
class Node {

  @PrimaryKey()
  id!: number;

}

@Entity()
class A {

  [PrimaryKeyType]?: number;
  [PrimaryKeyProp]?: 'node';
  @OneToOne({ entity: () => Node, wrappedReference: true, primary: true, onDelete: 'cascade', onUpdateIntegrity: 'cascade' })
  node!: IdentifiedReference<Node>;

  @OneToMany('B', 'a', { eager: true, orphanRemoval: true })
  bs = new Collection<B>(this);

  @Property()
  name!: string;

}

@Entity()
class B {

  @PrimaryKey()
  id!: number;

  @ManyToOne({ entity: () => A })
  a!: A;

  @Property()
  type!: number;

}


describe('GH issue 1111', () => {

  let orm: MikroORM;
  const log = jest.fn();

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Node, A, B],
      dbName: `mikro_orm_test_gh_1111`,
      cache: { enabled: false },
    });
    mockLogger(orm, ['query', 'query-params'], log);
    await orm.schema.ensureDatabase();
  });


  beforeEach(async () => {
    await orm.schema.dropSchema();
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

  test('FK as PK with IdentifiedReference - single insert', async () => {
    const a1 = new A();
    a1.name = 'test';
    a1.node = Reference.create(new Node());
    await orm.em.persistAndFlush(a1);

    expect(a1.node.unwrap().id).toBeTruthy();

    const b1 = new B();
    b1.type = 4;

    a1.bs.add(b1);

    await orm.em.flush();
    orm.em.clear();

    const a2 = await orm.em.findOneOrFail(A, { name: 'test' }, { populate: ['bs'] });
    expect(a2.bs.count()).toBe(1);
  });

  test('FK as PK with IdentifiedReference - multiple inserts', async () => {
    const a1 = new A();
    a1.name = 'test';
    a1.node = Reference.create(new Node());
    await orm.em.persistAndFlush(a1);

    expect(a1.node.unwrap().id).toBeTruthy();

    const b1 = new B();
    b1.type = 4;

    const b2 = new B();
    b2.type = 4;

    a1.bs.add(b1, b2);

    await orm.em.flush();
    orm.em.clear();

    const a2 = await orm.em.findOneOrFail(A, { name: 'test' }, { populate: ['bs'] });
    expect(a2.bs.count()).toBe(2);
  });

});
