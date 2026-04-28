import { Collection, MikroORM, Ref, ref } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

// Repro for em.transactional leaving residue on the parent EM:
// when parent's OneToMany was populated on the outer EM before
// `em.transactional`, the populated children get added to the outer EM's
// persist stack (Collection.add for OneToMany calls em.persist). Removing
// the child inside the transactional callback then unsets the identity on
// the parent EM via the deletion handler, but the child stayed in the
// outer persist stack with no `__originalEntityData` — so the next
// `em.flush()` re-INSERTed it.

@Entity()
class Parent {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => Child, c => c.parent, { orphanRemoval: true })
  children = new Collection<Child>(this);
}

@Entity()
class Child {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => Parent, { ref: true })
  parent!: Ref<Parent>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Parent, Child],
    metadataProvider: ReflectMetadataProvider,
    allowGlobalContext: true,
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

beforeEach(() => orm.schema.clear());

async function seed() {
  const em = orm.em.fork();
  const p = em.create(Parent, { name: 'P' });
  await em.flush();
  const c = em.create(Child, { name: 'C', parent: ref(Parent, p.id) });
  await em.flush();
  return { parentId: p.id, childId: c.id };
}

const childExists = async (id: number) => (await orm.em.fork().count(Child, { id })) === 1;

test('SANITY: txn commits the DELETE', async () => {
  const { childId } = await seed();
  const em = orm.em.fork();
  const child = await em.findOneOrFail(Child, { id: childId });
  await em.transactional(async txEm => {
    txEm.remove(child);
  });
  expect(await childExists(childId)).toBe(false);
});

test('CONTROL: no parent populate — outer flush is a no-op', async () => {
  const { childId } = await seed();
  const em = orm.em.fork();
  const child = await em.findOneOrFail(Child, { id: childId });
  await em.transactional(async txEm => {
    txEm.remove(child);
  });
  expect(await childExists(childId)).toBe(false);
  await em.flush();
  expect(await childExists(childId)).toBe(false);
});

test('GHx45: populate parent.children + remove inside transactional + outer flush should be a no-op', async () => {
  const { childId } = await seed();
  const em = orm.em.fork();
  const child = await em.findOneOrFail(Child, { id: childId }, { populate: ['parent.children'] });
  await em.transactional(async txEm => {
    txEm.remove(child);
  });
  expect(await childExists(childId)).toBe(false);
  await em.flush();
  expect(await childExists(childId)).toBe(false);
});
