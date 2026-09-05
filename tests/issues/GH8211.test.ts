import type { Rel } from '@mikro-orm/sqlite';
import { BaseEntity, Collection, MikroORM } from '@mikro-orm/sqlite';
import {
  Entity,
  Filter,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
@Filter({
  name: 'auth',
  cond: ({ company }) => ({ $or: [{ company }, { deviations: { type: { identifier: company } } }] }),
  default: true,
})
class ManagementObject extends BaseEntity {
  @PrimaryKey({ autoincrement: true })
  readonly id!: number;

  @Property()
  company!: string;

  @OneToMany(() => Deviation, d => d.managementObject)
  deviations = new Collection<Deviation>(this);
}

@Entity()
@Filter({
  name: 'auth',
  cond: ({ company }) => ({ deviations: { managementObject: { company } } }),
  default: true,
})
class DeviationType extends BaseEntity {
  @PrimaryKey({ autoincrement: true })
  readonly id!: number;

  @Property()
  identifier!: string;

  @OneToMany(() => Deviation, d => d.type)
  deviations = new Collection<Deviation>(this);
}

@Entity()
class Deviation extends BaseEntity {
  @PrimaryKey({ autoincrement: true })
  readonly id!: number;

  @ManyToOne(() => ManagementObject)
  managementObject!: Rel<ManagementObject>;

  @ManyToOne(() => DeviationType)
  type!: Rel<DeviationType>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [ManagementObject, DeviationType, Deviation],
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.create();
});

afterAll(async () => {
  await orm.close(true);
});

test('filters forming a relation cycle terminate (GH #8211)', async () => {
  const mo = orm.em.create(ManagementObject, { company: 'x' });
  const type = orm.em.create(DeviationType, { identifier: 'x' });
  orm.em.create(Deviation, { managementObject: mo, type });
  await orm.em.flush();
  orm.em.clear();

  orm.em.setFilterParams('auth', { company: 'x' });

  const res = await orm.em.find(ManagementObject, { deviations: { type: { identifier: 'x' } } });
  expect(res).toHaveLength(1);
});
