import { Cascade, Collection, Entity, ManyToOne, MikroORM, OneToMany, OneToOne, PrimaryKey, PrimaryKeyProp, PrimaryKeyType } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class NodeEntity {

  @PrimaryKey()
  id!: number;

  @ManyToOne({ entity: () => NodeEntity, onDelete: 'cascade', onUpdateIntegrity: 'cascade', nullable: true })
  parent?: NodeEntity | null;

}

@Entity()
export class ElementEntity {

  [PrimaryKeyType]?: number;
  [PrimaryKeyProp]?: 'node';

  @OneToOne({ entity: () => NodeEntity, primary: true, onDelete: 'cascade', onUpdateIntegrity: 'cascade' })
  node!: NodeEntity;

  @OneToMany({ entity: () => DependentEntity, mappedBy: 'element', cascade: [Cascade.ALL] })
  dependents = new Collection<DependentEntity>(this);

}

@Entity()
export class DependentEntity {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => ElementEntity, { onDelete: 'cascade' })
  element!: ElementEntity;

}

describe('GH issue 2810', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [ElementEntity, DependentEntity, NodeEntity],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.createSchema();
  });

  beforeEach(async () => await orm.schema.clearDatabase());
  afterAll(async () => await orm.close(true));

  test('create without existing parent', async () => {
    const element = new ElementEntity();
    element.node = new NodeEntity();
    element.node.parent = null;

    const dependent = new DependentEntity();
    dependent.element = element;
    element.dependents.add(dependent);

    await orm.em.persistAndFlush(element);
  });

  test('create with existing parent', async () => {
    const parent = orm.em.create(NodeEntity, {});
    await orm.em.fork().persistAndFlush(parent);

    const element = new ElementEntity();
    element.node = new NodeEntity();
    element.node.parent = orm.em.getReference(NodeEntity, parent.id);

    const dependent = new DependentEntity();
    dependent.element = element;
    element.dependents.add(dependent);

    await orm.em.persistAndFlush(element);
  });

});
