// Sibling scalar conditions on a relation are silently dropped from the WHERE
// clause when the same relation filter also contains a $and clause.
//
// em.find(Periodicity, {
//   entity: {
//     $and: [{ id: { $in: [...] } }],
//     taxManagedByGroup: true,  // ← was silently dropped
//   },
//   organization: { id: orgId },
// })

import { type Ref } from '@mikro-orm/core';
import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class Organization {
  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'string' })
  name!: string;
}

@Entity()
class LegalEntity {
  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'boolean' })
  taxManagedByGroup!: boolean;

  @ManyToOne({ entity: () => Organization, ref: true })
  organization!: Ref<Organization>;
}

@Entity()
class Periodicity {
  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'string' })
  title!: string;

  @ManyToOne({ entity: () => LegalEntity, ref: true })
  entity!: Ref<LegalEntity>;

  @ManyToOne({ entity: () => Organization, ref: true })
  organization!: Ref<Organization>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Organization, LegalEntity, Periodicity],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('scalar sibling conditions next to $and in a nested relation filter must reach the SQL', async () => {
  const seedEm = orm.em.fork();

  const org = seedEm.create(Organization, { name: 'Test Org' });
  const otherOrg = seedEm.create(Organization, { name: 'Other Org' });
  await seedEm.flush();

  const included = seedEm.create(LegalEntity, {
    name: 'Included',
    taxManagedByGroup: true,
    organization: org,
  });
  const excluded = seedEm.create(LegalEntity, {
    name: 'Excluded — wrong flag',
    taxManagedByGroup: false,
    organization: org,
  });
  const wrongOrg = seedEm.create(LegalEntity, {
    name: 'Excluded — wrong org',
    taxManagedByGroup: true,
    organization: otherOrg,
  });
  await seedEm.flush();

  seedEm.create(Periodicity, { title: 'should-appear', entity: included, organization: org });
  seedEm.create(Periodicity, { title: 'should-not-appear (wrong flag)', entity: excluded, organization: org });
  seedEm.create(Periodicity, { title: 'should-not-appear (wrong org)', entity: wrongOrg, organization: otherOrg });
  await seedEm.flush();

  const queryEm = orm.em.fork();
  const results = await queryEm.find(Periodicity, {
    entity: {
      $and: [{ id: { $in: [included.id, excluded.id] } }],
      taxManagedByGroup: true,
    },
    organization: { id: org.id },
  });

  expect(results).toHaveLength(1);
  expect(results[0].title).toBe('should-appear');
});
