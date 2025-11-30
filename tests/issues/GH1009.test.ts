import { Collection, MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'brands' })
class Brand {

  @PrimaryKey()
  id!: number;

  @OneToMany({ entity: () => BrandSiteRestriction, mappedBy: 'brand' })
  brandSiteRestrictions = new Collection<BrandSiteRestriction>(this);

}

@Entity({ tableName: 'brand_site_restrictions' })
class BrandSiteRestriction {

  @PrimaryKey()
  id!: number;

  @ManyToOne({ entity: () => Site })
  site!: any;

  @ManyToOne({ entity: () => Brand })
  brand!: Brand;

}

@Entity({ tableName: 'placements' })
class Placement {

  @PrimaryKey()
  id!: number;

  @ManyToOne({ entity: () => Publisher, nullable: true })
  publisher?: any;

  @ManyToOne({ entity: () => Site })
  site!: any;

}

@Entity({ tableName: 'publishers' })
class Publisher {

  @OneToMany({ entity: () => Site, mappedBy: 'publisher' })
  sites = new Collection<Site>(this);

  @PrimaryKey()
  id!: number;

}

@Entity({ tableName: 'sites' })
class Site {

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

  let orm: MikroORM;

  beforeAll(async () => {
    orm = new MikroORM({
      metadataProvider: ReflectMetadataProvider,
      entities: [BrandSiteRestriction, Site, Brand, Publisher, Placement],
      dbName: `:memory:`,
    });

    await orm.schema.createSchema();
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
