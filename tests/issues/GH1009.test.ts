import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity({ tableName: 'brands' })
export class Brand {

  @PrimaryKey()
  id!: number;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @OneToMany({ entity: () => BrandSiteRestriction, mappedBy: 'brand' })
  brandSiteRestrictions = new Collection<BrandSiteRestriction>(this);

}

@Entity({ tableName: 'brand_site_restrictions' })
export class BrandSiteRestriction {

  @PrimaryKey()
  id!: number;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @ManyToOne({ entity: () => Site })
  site!: any;

  @ManyToOne({ entity: () => Brand })
  brand!: Brand;

}

@Entity({ tableName: 'placements' })
export class Placement {

  @PrimaryKey()
  id!: number;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @ManyToOne({ entity: () => Publisher, nullable: true })
  publisher?: any;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @ManyToOne({ entity: () => Site })
  site!: any;

}

@Entity({ tableName: 'publishers' })
export class Publisher {

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @OneToMany({ entity: () => Site, mappedBy: 'publisher' })
  sites = new Collection<Site>(this);

  @PrimaryKey()
  id!: number;

}

@Entity({ tableName: 'sites' })
export class Site {

  @ManyToOne({ entity: () => Publisher, nullable: true })
  publisher?: Publisher;

  @OneToMany({ entity: () => Placement, mappedBy: 'site' })
  placements = new Collection<Placement>(this);

  @OneToMany({ entity: () => BrandSiteRestriction, mappedBy: 'site' })
  brandSiteRestrictions = new Collection<BrandSiteRestriction, Site>(this);

  @PrimaryKey()
  id!: number;

  @Property({ length: 191, nullable: true })
  name?: string;

}

describe('GH issue 1009', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [BrandSiteRestriction, Site, Brand, Publisher, Placement],
      dbName: `:memory:`,
      type: 'sqlite',
    });

    const generator = orm.getSchemaGenerator();
    await generator.createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  it('sets keys from references', async () => {
    const site = new Site();
    const brand = new Brand();
    const br = new BrandSiteRestriction();
    br.site = site;
    br.brand = brand;
    await expect(orm.em.persistAndFlush(br)).resolves.toBeUndefined();
  });

});
