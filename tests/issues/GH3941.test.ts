import { Collection, Entity, IdentifiedReference, ManyToOne, OneToMany, OneToOne, PrimaryKey, PrimaryKeyType, Property, Reference, RequestContext } from '@mikro-orm/core';
import { MikroORM, MySqlDriver } from '@mikro-orm/mysql';


@Entity()
export class Organization {

  @PrimaryKey()
  public id!: number;

  @OneToOne({
    entity: () => License,
    nullable: false,
    inversedBy: 'organization',
    eager: true,
    wrappedReference: true,
  })
  public license!: IdentifiedReference<License>;

  @OneToMany(() => Workspace, workspace => workspace.organization)
  public workspaces = new Collection<Workspace>(this);

  @Property({ length: 255 })
  public name!: string;

}

@Entity()
export class License {

  @PrimaryKey()
  public id!: number;

  @OneToOne(() => Organization, organization => organization.license, {
    serializer: organization => organization.id,
  })
  public organization!: Reference<Organization>;

  @Property({ length: 255 })
  public name!: string;

}

@Entity()
export class Workspace {

  @PrimaryKey()
  public id!: number;

  @Property()
  public name!: string;

  @ManyToOne(() => Organization, { wrappedReference: true })
  public organization!: IdentifiedReference<Organization>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Organization, License, Workspace],
    port: 3308,
    driver: MySqlDriver,
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close();
});

describe('GH3941', () => {
  const createOrganization = async (name: string) => {
    const organization = orm.em.create(Organization, {
      name,
      license: {
        name: `License for ${name}`,
      },
      workspaces: [
        {
          name: `Workspace for ${name}`,
        },
      ],
    });
    await orm.em.persist(organization).flush();
    return organization;
  };

  test('get license via workspace after clearing entitymanager', async () => {
    const organization = await createOrganization('First organization');

    void orm.em.clear();

    // Fetch workspace
    const workspaceRepository = orm.em.getRepository(Workspace);
    const workspace = await workspaceRepository.findOne(organization.workspaces[0].id, { filters: {}, populate: [] });
    expect(workspace).toBeDefined();

    // Find license by workspace id
    const licenseReposityro = orm.em.getRepository(License);
    const license = await licenseReposityro.findOne({ organization: { workspaces: workspace } });
    expect(license).toBeDefined();

    // No changes should've been made by ORM, since we only find items
    orm.em.getUnitOfWork().computeChangeSets();
    expect(orm.em.getUnitOfWork().getChangeSets()).toHaveLength(0);
  });
});
