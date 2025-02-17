import { Collection, Entity, Ref, ManyToOne, MikroORM, OneToMany, OneToOne, PrimaryKey, PrimaryKeyProp, Property, Reference } from '@mikro-orm/postgresql';
import { mockLogger } from '../helpers.js';

@Entity()
class Node {

  @PrimaryKey()
  id!: number;

}

@Entity()
class B {

  @PrimaryKey()
  id!: number;

  @OneToMany('A', 'b', { eager: true })
  as = new Collection<A>(this);

}


@Entity()
class A {

  [PrimaryKeyProp]?: 'node';
  @OneToOne({ entity: 'Node', ref: true, primary: true, deleteRule: 'cascade', updateRule: 'cascade' })
  node!: Ref<Node>;

  @Property()
  name!: string;

  @ManyToOne({ entity: 'B' })
  b!: B;

}

describe('GH issue 1224', () => {

  let orm: MikroORM;
  const log = vi.fn();

  beforeAll(async () => {
    orm = MikroORM.initSync({
      entities: [Node, A, B],
      dbName: `mikro_orm_test_gh_1224`,
      metadataCache: { enabled: false },
    });
    mockLogger(orm, ['query', 'query-params'], log);
    await orm.schema.ensureDatabase();
  });


  beforeEach(async () => {
    await orm.schema.dropSchema();
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

  test('PK as FK with References & getIdentifiers', async () => {
    const a1 = new A();
    a1.name = 'test';
    a1.node = Reference.create(new Node());

    const b1 = new B();
    b1.as.add(a1);

    await orm.em.persistAndFlush(b1);

    expect(b1.id).toBeTruthy();

    orm.em.clear();

    const b2 = await orm.em.findOneOrFail(B, b1.id);
    const ids = b2.as.getIdentifiers();

    expect(ids).toStrictEqual([a1.node.id]);
  });

});
