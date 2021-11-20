import { Collection, Entity, IdentifiedReference, ManyToOne, MikroORM, OneToMany, OneToOne, PrimaryKey, PrimaryKeyProp, PrimaryKeyType, Property, Reference } from '@mikro-orm/core';
import type { AbstractSqlDriver } from '@mikro-orm/knex';
import { SchemaGenerator } from '@mikro-orm/knex';
import { mockLogger } from '../bootstrap';

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

  [PrimaryKeyType]: number;
  [PrimaryKeyProp]: 'node';
  @OneToOne({ entity: 'Node', wrappedReference: true, primary: true, onDelete: 'cascade', onUpdateIntegrity: 'cascade' })
  node!: IdentifiedReference<Node>;

  @Property()
  name!: string;

  @ManyToOne({ entity: 'B' })
  b!: B;

}

describe('GH issue 1224', () => {

  let orm: MikroORM<AbstractSqlDriver>;
  const log = jest.fn();

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Node, A, B],
      dbName: `mikro_orm_test_gh_1224`,
      type: 'postgresql',
      cache: { enabled: false },
    });
    mockLogger(orm, ['query', 'query-params'], log);
    await new SchemaGenerator(orm.em).ensureDatabase();
  });


  beforeEach(async () => {
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
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
