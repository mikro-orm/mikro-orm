import { Ref, EventSubscriber, ChangeSet, FlushEventArgs } from '@mikro-orm/core';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class Node {

  @PrimaryKey()
  id!: number;

  @Property()
  value!: string;

  @ManyToOne(() => Node, { nullable: true, ref: true })
  parent?: Ref<Node>;

}

class AfterFlushSubscriber implements EventSubscriber {

  static readonly changeSets: ChangeSet<any>[] = [];

  afterFlush(args: FlushEventArgs) {
    AfterFlushSubscriber.changeSets.push(...args.uow.getChangeSets());
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Node],
    dbName: ':memory:',
    subscribers: [AfterFlushSubscriber],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close();
});

test('4245', async () => {
  const firstNode = orm.em.create(Node, {
    value: 'First node',
  });

  const secondNode = orm.em.create(Node, {
    value: 'Second node',
    parent: firstNode,
  });

  await orm.em.flush();

  const meta = orm.getMetadata(Node);
  const nestedNodeChangeSet = AfterFlushSubscriber.changeSets.filter(
    changeSet => changeSet.meta === meta && changeSet.payload.value === secondNode.value,
  )[0];

  // Check entity values
  expect(nestedNodeChangeSet.entity.value).toBe(secondNode.value);
  expect(nestedNodeChangeSet.entity.id).toBeDefined();
  expect(nestedNodeChangeSet.entity.parent).toBeDefined();
  expect(nestedNodeChangeSet.entity.parent.id).toBeDefined();

  // Check changeset payload
  expect(nestedNodeChangeSet.payload.value).toBe(nestedNodeChangeSet.entity.value);
  expect(nestedNodeChangeSet.payload.id).toBe(nestedNodeChangeSet.entity.id);
  expect(nestedNodeChangeSet.payload.parent).toBeDefined();
  expect(nestedNodeChangeSet.payload.parent).toBe(nestedNodeChangeSet.entity.parent.id);
});
