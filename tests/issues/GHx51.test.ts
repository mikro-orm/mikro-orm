// When populating a relation to a TPT child entity, scalar properties that use
// a custom type with `convertToJSValueSQL` (e.g. JSON columns inherited from a
// TPT parent) were being selected from the child sub-table alias instead of
// the parent table alias, producing "no such column" errors.
import {
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { Collection, MikroORM, type Rel } from '@mikro-orm/sqlite';

@Entity({ inheritance: 'tpt' })
abstract class ProjectSnapshot {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'json' })
  metadata: Record<string, any>;

  constructor(metadata: Record<string, any>) {
    this.metadata = metadata;
  }
}

@Entity()
class Offer extends ProjectSnapshot {
  @Property({ type: 'json' })
  offerProp: Record<string, any>;

  constructor(metadata: Record<string, any>, offerProp: Record<string, any>) {
    super(metadata);
    this.offerProp = offerProp;
  }
}

@Entity()
class Addendum extends ProjectSnapshot {
  @ManyToOne(() => Contract)
  contract!: Rel<Contract>;

  @Property({ type: 'json' })
  addendumProp: Record<string, any>;

  constructor(metadata: Record<string, any>, addendumProp: Record<string, any>) {
    super(metadata);
    this.addendumProp = addendumProp;
  }
}

@Entity()
class Contract {
  @PrimaryKey()
  id!: number;

  @OneToOne(() => Offer)
  offer!: Rel<Offer>;

  @OneToMany(() => Addendum, a => a.contract)
  addendums = new Collection<Addendum>(this);
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [ProjectSnapshot, Offer, Addendum, Contract],
    metadataProvider: ReflectMetadataProvider,
    allowGlobalContext: true,
  });
  await orm.schema.refresh();
});

afterAll(async () => orm.close(true));

test('populating contract.offer from a TPT child does not collide with own TPT parent join', async () => {
  const offer = orm.em.create(Offer, { metadata: { foo: 'bar' }, offerProp: { x: 1 } });
  await orm.em.flush();

  const contract = orm.em.create(Contract, { offer });
  const addendum = orm.em.create(Addendum, { metadata: { baz: 'qux' }, addendumProp: { y: 2 }, contract });
  await orm.em.flush();
  orm.em.clear();

  const result = await orm.em.findOneOrFail(Addendum, addendum.id, {
    populate: ['contract.offer'],
  });

  expect(result.metadata).toEqual({ baz: 'qux' });
  expect(result.contract.offer.metadata).toEqual({ foo: 'bar' });
});

test('populating contract.offer from a TPT child with select-in does not collide', async () => {
  const offer = orm.em.create(Offer, { metadata: { foo: 'bar' }, offerProp: { x: 1 } });
  await orm.em.flush();

  const contract = orm.em.create(Contract, { offer });
  const addendum = orm.em.create(Addendum, { metadata: { baz: 'qux' }, addendumProp: { y: 2 }, contract });
  await orm.em.flush();
  orm.em.clear();

  const result = await orm.em.findOneOrFail(Addendum, addendum.id, {
    populate: ['contract.offer'],
    strategy: 'select-in',
  });

  expect(result.metadata).toEqual({ baz: 'qux' });
  expect(result.contract.offer.metadata).toEqual({ foo: 'bar' });
});
