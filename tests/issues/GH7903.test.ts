import { rmSync } from 'node:fs';
import { Cascade, Collection } from '@mikro-orm/core';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';
import { TEMP_DIR } from '../helpers.js';

@Entity()
class Parent {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @OneToMany(() => Child, c => c.parent, { orphanRemoval: true, cascade: [Cascade.PERSIST] })
  children = new Collection<Child>(this);
}

@Entity()
class Child {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Parent)
  parent!: Parent;

  @Property()
  body!: string;
}

// File-based metadata cache so the two ORM instances below share the persisted `_id`.
const CACHE_DIR = TEMP_DIR + '/.metadata-cache-7903';

const baseConfig = {
  dbName: ':memory:',
  entities: [Parent, Child],
  metadataProvider: ReflectMetadataProvider,
  // Persist EntityMetadata._id to disk (TsMorphMetadataProvider enables this implicitly).
  metadataCache: { enabled: true, options: { cacheDir: CACHE_DIR } },
};

// Replacing a re-fetched parent's 1:m collection (with orphanRemoval) by a new child via
// `em.assign()` and flushing must not silently skip the INSERT for the new child.
//
// Two `MikroORM` instances share a file-based metadata cache, so the second init reads back the
// persisted `_id` and ends up with a second `EntityMetadata` instance carrying the same `_id`.
// `getChangeSetGroups()` keyed groups by the meta instance while `getCommitOrder()` dedupes by
// `_id`, so the CREATE group stored under instance A was looked up by instance B and dropped.
test('GH 7903: INSERT of a new collection item is not skipped with duplicate metadata sharing an _id', async () => {
  rmSync(CACHE_DIR, { recursive: true, force: true });

  // We operate on `orm`; `orm2` is initialized last so it overwrites the entity class's attached
  // metadata, making hydrated entities resolve to a different instance than freshly created ones.
  const orm = await MikroORM.init({ ...baseConfig, contextName: 'ctx1' });
  const orm2 = await MikroORM.init({ ...baseConfig, contextName: 'ctx2' });
  await orm.schema.refresh();

  // seed: a parent with one child
  let parentId: number;
  {
    const em = orm.em.fork();
    const parent = new Parent();
    parent.title = 'seed';
    const child = new Child();
    child.body = 'old-child';
    child.parent = parent;
    parent.children.add(child);
    em.persist(parent);
    await em.flush();
    parentId = parent.id;
  }

  // re-fetch the parent and replace its collection with a new child
  const em = orm.em.fork();
  const [parent] = await em.populate([em.getReference(Parent, parentId)], ['children']);
  const newChild = new Child();
  newChild.parent = parent;
  newChild.body = 'new-child';
  em.assign(parent, { children: [newChild] });
  await em.flush();

  const newChildId = newChild.id;
  const count = await orm.em.fork().count(Child);

  await orm.close(true);
  await orm2.close(true);
  rmSync(CACHE_DIR, { recursive: true, force: true });

  expect(newChildId).toBeDefined();
  expect(count).toBe(1);
});
