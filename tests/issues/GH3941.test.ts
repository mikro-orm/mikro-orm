import { Collection, Entity, helper, ManyToOne, OneToMany, OneToOne, PrimaryKey, Property, Ref } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class Organization {

  @PrimaryKey()
  id!: number;

  @OneToOne({
    entity: () => License,
    ref: true,
  })
  license!: Ref<License>;

  @OneToMany(() => Workspace, workspace => workspace.organization)
  workspaces = new Collection<Workspace>(this);

  @Property()
  name!: string;

}

@Entity()
class License {

  @PrimaryKey()
  id!: number;

  @OneToOne(() => Organization, organization => organization.license)
  organization!: Ref<Organization>;

  @Property()
  name!: string;

}

@Entity()
class Workspace {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => Organization, { ref: true })
  organization!: Ref<Organization>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Organization, License, Workspace],
    dbName: ':memory:',
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close();
});

test('3941', async () => {
  const organization = orm.em.create(Organization, {
    name: 'Organization',
    license: {
      name: 'License',
    },
    workspaces: [
      { name: 'Workspace' },
    ],
  });
  await orm.em.flush();
  orm.em.clear();

  const workspace = await orm.em.findOneOrFail(Workspace, organization.workspaces[0].id);
  const license = await orm.em.findOneOrFail(License, { organization: { workspaces: workspace } });

  orm.em.getUnitOfWork().computeChangeSets();
  expect(orm.em.getUnitOfWork().getChangeSets()).toHaveLength(0);
  expect(helper(license.organization).__originalEntityData).toEqual({ id: 1, license: 1 });
});
