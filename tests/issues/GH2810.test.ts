import { Cascade, Collection, MikroORM, PrimaryKeyProp } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryKey,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
export class NodeEntity {

  @PrimaryKey()
  id!: number;

  @ManyToOne({ entity: () => NodeEntity, deleteRule: 'cascade', updateRule: 'cascade', nullable: true })
  parent?: NodeEntity | null;

}

@Entity()
export class ElementEntity {

  [PrimaryKeyProp]?: 'node';

  @OneToOne({ entity: () => NodeEntity, primary: true, deleteRule: 'cascade', updateRule: 'cascade' })
  node!: NodeEntity;

  @OneToMany({ entity: () => DependentEntity, mappedBy: 'element', cascade: [Cascade.ALL] })
  dependents = new Collection<DependentEntity>(this);

}

@Entity()
export class DependentEntity {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => ElementEntity, { deleteRule: 'cascade' })
  element!: ElementEntity;

}

describe('GH issue 2810', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [ElementEntity, DependentEntity, NodeEntity],
      dbName: ':memory:',
    });
    await orm.schema.create();
  });

  beforeEach(async () => await orm.schema.clear());
  afterAll(async () => await orm.close(true));

  test('create without existing parent', async () => {
    const element = orm.em.create(ElementEntity, {});
    element.node = new NodeEntity();
    element.node.parent = null;

    const dependent = new DependentEntity();
    dependent.element = element;
    element.dependents.add(dependent);

    await orm.em.persist(element).flush();
  });

  test('create with existing parent', async () => {
    const parent = orm.em.create(NodeEntity, {});
    await orm.em.fork().persist(parent).flush();

    const element = new ElementEntity();
    element.node = new NodeEntity();
    element.node.parent = orm.em.getReference(NodeEntity, parent.id);

    const dependent = new DependentEntity();
    dependent.element = element;
    element.dependents.add(dependent);

    await orm.em.persist(element).flush();
  });

});
