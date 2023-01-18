import { Embeddable, Embedded, Entity, PrimaryKey, Property, OneToOne, PrimaryProperty, Reference as Reference_, IsUnknown, Cast } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

// we need to define those to get around typescript issues with reflection (ts-morph would return `any` for the type otherwise)
export class Reference<T extends object> extends Reference_<T> { }
export type Ref<T extends object, PK extends keyof T | unknown = PrimaryProperty<T>> = true extends IsUnknown<PK> ? Reference<T> : ({ [K in Cast<PK, keyof T>]?: T[K] } & Reference<T>);

@Embeddable()
class PTE {

  @Property()
  name!: string;

}

@Entity()
class BPE {

  @PrimaryKey()
  id!: number;

  @Embedded()
  titles!: PTE[];

  @OneToOne(() => P, p => p.bp, { orphanRemoval: true })
  p!: Ref<P> | null;

}

@Entity()
class P {

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
