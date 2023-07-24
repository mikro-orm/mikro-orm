import { Entity, Ref, ManyToOne, PrimaryKey, Property, EventSubscriber, ChangeSet, FlushEventArgs, Subscriber } from '@mikro-orm/core';
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

@Subscriber()
class AfterFlushSubscriber implements EventSubscriber {

  static readonly changeSets: ChangeSet<any>[] = [];

  afterFlush(args: FlushEventArgs) {
    AfterFlushSubscriber.changeSets.push(...args.uow.getChangeSets());
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Node],
    dbName: ':memory:',
  });
  await orm.schema.refreshDatabase();

  orm.em.getEventManager().registerSubscriber(new AfterFlushSubscriber());
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

  const nestedNodeChangeSet = AfterFlushSubscriber.changeSets.filter(
    changeSet =>
      changeSet.name === 'Node' && changeSet.payload.value === secondNode.value,
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
