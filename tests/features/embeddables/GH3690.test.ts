import { Embeddable, Embedded, Entity, PrimaryKey, Property, OneToOne, Ref } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

@Embeddable()
export class PTE {

  @Property()
  name!: string;

}

@Entity()
export class BPE {

  @PrimaryKey()
  id!: number;

  @Embedded({ object: true })
  titles!: PTE[];

  @OneToOne(() => P, p => p.bp, { orphanRemoval: true })
  p!: Ref<P> | null;

}

@Entity()
export class P {

  @PrimaryKey()
  id!: number;

  @OneToOne(() => BPE, { orphanRemoval: true })
  bp!: Ref<BPE> | null;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [P, PTE],
    dbName: ':memory:',
    metadataProvider: TsMorphMetadataProvider,
    cache: { enabled: false },
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH issue 3690', async () => {
  const e = orm.em.create(P, {
    bp: {
      titles: [{ name: 't1' }, { name: 't2' }],
    },
  });
  await orm.em.flush();
  orm.em.clear();

  const e1 = await orm.em.findOneOrFail(P, e, { populate: ['bp'] });
  expect(e1.bp?.$.titles).toEqual([
    { name: 't1' },
    { name: 't2' },
  ]);
});
