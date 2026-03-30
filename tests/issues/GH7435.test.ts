import { MikroORM, PrimaryKeyProp, Ref, ref } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
class Organization {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity()
class Risk {
  [PrimaryKeyProp]?: ['id', 'organization'];

  @PrimaryKey()
  id!: number;

  @ManyToOne({ entity: () => Organization, ref: true, primary: true })
  organization!: Ref<Organization>;

  @Property()
  name!: string;

  @OneToOne({ entity: () => RiskAuditSync, mappedBy: 'risk', nullable: true, orphanRemoval: true })
  syncedAudit!: Ref<RiskAuditSync> | null;
}

@Entity()
class RiskAuditSync {
  [PrimaryKeyProp]?: ['risk', 'organization', 'auditId'];

  @OneToOne({
    entity: () => Risk,
    inversedBy: 'syncedAudit',
    joinColumns: ['risk_id', 'organization_id'],
    primary: true,
  })
  risk!: Ref<Risk> | null;

  @ManyToOne({ entity: () => Organization, ref: true, primary: true })
  organization!: Ref<Organization>;

  @Property({ primary: true })
  auditId!: string;
}

describe('GH7435', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Organization, Risk, RiskAuditSync],
      dbName: ':memory:',
    });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));
  beforeEach(() => orm.schema.clear());

  test('executeDeletes should not crash when orphan-removed entity has composite FK in PK', async () => {
    const em = orm.em.fork();

    const org = em.create(Organization, { id: 1, name: 'Org' });
    const risk = em.create(Risk, { id: 1, organization: org, name: 'Risk1' });
    em.create(RiskAuditSync, { risk: ref(risk), organization: org, auditId: 'audit-1' });
    await em.flush();
    em.clear();

    // Load and remove the synced audit via orphanRemoval
    const loaded = await em.findOneOrFail(Risk, { id: 1 }, { populate: ['syncedAudit'] });
    expect(loaded.syncedAudit).toBeTruthy();

    em.assign(loaded, { syncedAudit: null });
    await em.flush();
    em.clear();

    const reloaded = await em.findOneOrFail(Risk, { id: 1 }, { populate: ['syncedAudit'] });
    expect(reloaded.syncedAudit).toBeNull();
    expect(await em.count(RiskAuditSync, {})).toBe(0);
  });

  test('multiple risks with orphanRemoval should not cause phantom deletes', async () => {
    const em = orm.em.fork();

    const org = em.create(Organization, { id: 2, name: 'Org2' });
    const risk1 = em.create(Risk, { id: 2, organization: org, name: 'Risk2' });
    const risk2 = em.create(Risk, { id: 3, organization: org, name: 'Risk3' });
    em.create(RiskAuditSync, { risk: ref(risk1), organization: org, auditId: 'audit-2' });
    em.create(RiskAuditSync, { risk: ref(risk2), organization: org, auditId: 'audit-3' });
    await em.flush();
    em.clear();

    // Load both risks and remove their synced audits
    const loaded1 = await em.findOneOrFail(Risk, { id: 2 }, { populate: ['syncedAudit'] });
    const loaded2 = await em.findOneOrFail(Risk, { id: 3 }, { populate: ['syncedAudit'] });
    expect(loaded1.syncedAudit).toBeTruthy();
    expect(loaded2.syncedAudit).toBeTruthy();

    em.assign(loaded1, { syncedAudit: null });
    em.assign(loaded2, { syncedAudit: null });
    await em.flush();
    em.clear();

    expect(await em.count(RiskAuditSync, {})).toBe(0);
  });
});
