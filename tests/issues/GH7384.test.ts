import { MikroORM, Ref } from '@mikro-orm/sqlite';
import { Entity, Enum, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

enum ItemKind {
  ALPHA = 'alpha',
  BETA = 'beta',
  GAMMA = 'gamma',
}

@Entity({
  discriminatorColumn: 'kind',
  abstract: true,
})
abstract class BaseItem {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Enum({ items: () => ItemKind, nullable: true })
  kind?: ItemKind;
}

@Entity({ discriminatorValue: ItemKind.ALPHA })
class AlphaItem extends BaseItem {}

@Entity({ discriminatorValue: ItemKind.BETA })
class BetaItem extends BaseItem {}

@Entity({ discriminatorValue: ItemKind.GAMMA })
class GammaItem extends BaseItem {}

@Entity()
class Parent {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => AlphaItem, { nullable: true, ref: true })
  alpha?: Ref<AlphaItem>;

  @ManyToOne(() => BetaItem, { nullable: true, ref: true })
  beta?: Ref<BetaItem>;

  @ManyToOne(() => GammaItem, { nullable: true, ref: true })
  gamma?: Ref<GammaItem>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [BaseItem, AlphaItem, BetaItem, GammaItem, Parent],
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #7384 - uninitialized Ref proxies to STI entities should not cause false dirty detection', async () => {
  const em = orm.em.fork();
  const alpha = em.create(AlphaItem, { name: 'a1' });
  const beta = em.create(BetaItem, { name: 'b1' });
  const parent = em.create(Parent, { name: 'p1', alpha, beta });
  await em.flush();
  em.clear();

  // Load Parent WITHOUT populating the STI refs
  const em2 = orm.em.fork();
  const loaded = await em2.findOneOrFail(Parent, parent.id);

  // loaded.alpha and loaded.beta are uninitialized Ref proxies
  // with only the id — the discriminator column 'kind' is undefined

  // Lazy-load only ONE of the refs
  await loaded.alpha!.load();

  // The other ref (beta) remains as an uninitialized proxy with kind=undefined
  // Computing change sets should NOT detect any changes
  const uow = em2.getUnitOfWork();
  uow.computeChangeSets();
  const changeSets = uow.getChangeSets();

  expect(changeSets).toHaveLength(0);
});

test('GH #7384 - uninitialized Ref proxies should not cause false dirty detection without any lazy load', async () => {
  const em = orm.em.fork();
  const alpha = em.create(AlphaItem, { name: 'a2' });
  const beta = em.create(BetaItem, { name: 'b2' });
  const gamma = em.create(GammaItem, { name: 'g2' });
  const parent = em.create(Parent, { name: 'p2', alpha, beta, gamma });
  await em.flush();
  em.clear();

  // Load Parent WITHOUT populating the STI refs
  const em2 = orm.em.fork();
  await em2.findOneOrFail(Parent, parent.id);

  // Without loading any refs, change sets should be empty
  const uow = em2.getUnitOfWork();
  uow.computeChangeSets();
  const changeSets = uow.getChangeSets();

  expect(changeSets).toHaveLength(0);
});

test('GH #7384 - modified uninitialized STI proxy should not include discriminator in changeset', async () => {
  const em = orm.em.fork();
  const alpha = em.create(AlphaItem, { name: 'a4' });
  const parent = em.create(Parent, { name: 'p4', alpha });
  await em.flush();
  em.clear();

  const em2 = orm.em.fork();
  const loaded = await em2.findOneOrFail(Parent, parent.id);

  // Modify a property on the uninitialized ref proxy directly
  const alphaRef = loaded.alpha!.unwrap();
  alphaRef.name = 'modified';

  const uow = em2.getUnitOfWork();
  uow.computeChangeSets();
  const changeSets = uow.getChangeSets();

  // Should have a changeset for the name change, but discriminator should not be in the payload
  const alphaCs = changeSets.filter(cs => cs.payload.name === 'modified');
  expect(alphaCs).toHaveLength(1);
  expect(alphaCs[0].payload).toEqual({ name: 'modified' });
  expect(alphaCs[0].payload).not.toHaveProperty('kind');
});

test('GH #7384 - populated Ref proxies to STI entities should not cause false dirty detection', async () => {
  const em = orm.em.fork();
  const alpha = em.create(AlphaItem, { name: 'a3' });
  const beta = em.create(BetaItem, { name: 'b3' });
  const parent = em.create(Parent, { name: 'p3', alpha, beta });
  await em.flush();
  em.clear();

  // Load Parent WITH populating the STI refs (workaround)
  const em2 = orm.em.fork();
  await em2.findOneOrFail(Parent, parent.id, {
    populate: ['alpha', 'beta'],
  });

  const uow = em2.getUnitOfWork();
  uow.computeChangeSets();
  const changeSets = uow.getChangeSets();

  expect(changeSets).toHaveLength(0);
});
