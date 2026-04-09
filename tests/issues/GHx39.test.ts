import { Collection, MikroORM, PrimaryKeyProp, type Ref } from '@mikro-orm/postgresql';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

// Filtering a OneToMany collection with a composite-FK relation alongside the
// child PK at the same level produced a composite whereIn with mismatched
// LHS columns and RHS bindings:
//
//   qb.where({ children: { id: { $in: [a, b] }, organization: orgId } })
//
// compiled to LHS `(c1.id, c1.organization_id)` but RHS `(?, ?)` with three
// bindings, which knex rejects with "Expected 3 bindings, saw 2".

@Entity({ tableName: 'ghx39_organization' })
class Organization {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ type: 'string' })
  name!: string;
}

@Entity({ tableName: 'ghx39_parent' })
class Parent {
  [PrimaryKeyProp]?: ['id', 'organization'];

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne({ entity: () => Organization, ref: true, primary: true })
  organization!: Ref<Organization>;

  @Property({ type: 'string' })
  label!: string;

  @OneToMany({ entity: () => Child, mappedBy: 'parent' })
  children = new Collection<Child>(this);
}

@Entity({ tableName: 'ghx39_child' })
class Child {
  [PrimaryKeyProp]?: ['id', 'organization'];

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @ManyToOne({ entity: () => Organization, ref: true, primary: true })
  organization!: Ref<Organization>;

  @ManyToOne({
    entity: () => Parent,
    ref: true,
    joinColumns: ['parent_id', 'organization_id'],
    deleteRule: 'cascade',
  })
  parent!: Ref<Parent>;

  @Property({ type: 'string' })
  label!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: 'mikro_orm_test_ghx39',
    entities: [Organization, Parent, Child],
  });
});

afterAll(async () => {
  await orm.close(true);
});

test('GHx39 - composite FK nested in collection filter must not produce binding mismatch', () => {
  const em = orm.em.fork();

  const qb = em
    .createQueryBuilder(Parent, 'p')
    .select(['p.id'], true)
    .where({
      children: {
        id: { $in: ['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'] },
        organization: '33333333-3333-3333-3333-333333333333',
      },
    });

  // Before the fix the SQL flattened `id` $in array into a single composite
  // tuple and dropped the `organization` value entirely, producing
  //   ... where ("c1"."id", "c1"."organization_id") in (('a', 'b'))
  // (3 bindings expected by knex, only 2 placeholders rendered).
  const sql = qb.getFormattedQuery();
  expect(sql).toContain('"c1"."id" in');
  expect(sql).toContain('"c1"."organization_id" =');
  expect(sql).toContain('33333333-3333-3333-3333-333333333333');
});
