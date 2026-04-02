import { BaseEntity, MikroORM, PrimaryKeyProp, type Ref } from '@mikro-orm/postgresql';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ tableName: 'cfk_organization' })
class Organization extends BaseEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ type: 'string' })
  name!: string;
}

@Entity({ tableName: 'cfk_child_a' })
class ChildA extends BaseEntity {
  [PrimaryKeyProp]?: ['id', 'organization'];

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne({ entity: () => Organization, ref: true, primary: true })
  organization!: Ref<Organization>;

  @Property({ type: 'string' })
  label!: string;
}

@Entity({ tableName: 'cfk_child_b' })
class ChildB extends BaseEntity {
  [PrimaryKeyProp]?: ['id', 'organization'];

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne({ entity: () => Organization, ref: true, primary: true })
  organization!: Ref<Organization>;

  @Property({ type: 'string' })
  label!: string;
}

@Entity({ tableName: 'cfk_referrer' })
class Referrer extends BaseEntity {
  [PrimaryKeyProp]?: ['id', 'organization'];

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne({ entity: () => Organization, ref: true, primary: true })
  organization!: Ref<Organization>;

  @Property({ type: 'string', length: 100 })
  label!: string;

  @ManyToOne({
    entity: () => ChildA,
    ref: true,
    nullable: true,
    joinColumns: ['child_a_id', 'organization_id'],
  })
  childA?: Ref<ChildA> | null;

  @ManyToOne({
    entity: () => ChildB,
    ref: true,
    nullable: true,
    joinColumns: ['child_b_id', 'organization_id'],
  })
  childB?: Ref<ChildB> | null;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: 'mikro_orm_composite_fk_shared_column',
    entities: [Organization, ChildA, ChildB, Referrer],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

describe('GHx - composite FK with shared join column [object Object] bug', () => {
  test('em.create children + referrer in single flush', async () => {
    const em = orm.em.fork();
    const orgId = randomUUID();

    em.create(Organization, { id: orgId, name: 'Test Org' });
    const childA = em.create(ChildA, { organization: orgId, label: 'A' });
    const childB = em.create(ChildB, { organization: orgId, label: 'B' });

    em.create(Referrer, {
      organization: orgId,
      label: 'test',
      childA,
      childB,
    });

    await em.flush();

    const verifyEm = orm.em.fork();
    const loaded = await verifyEm.findOneOrFail(Referrer, { label: 'test' }, { populate: ['childA', 'childB'] });
    expect(loaded.childA!.id).toBe(childA.id);
    expect(loaded.childB!.id).toBe(childB.id);
  });

  test('single composite FK still works when child has auto-generated ID', async () => {
    const em = orm.em.fork();
    const orgId = randomUUID();

    em.create(Organization, { id: orgId, name: 'Test Org 2' });
    const childA = em.create(ChildA, { organization: orgId, label: 'A2' });

    em.create(Referrer, {
      organization: orgId,
      label: 'test-single-fk',
      childA,
    });

    await em.flush();

    const verifyEm = orm.em.fork();
    const loaded = await verifyEm.findOneOrFail(Referrer, { label: 'test-single-fk' });
    expect(loaded).toBeDefined();
  });
});
