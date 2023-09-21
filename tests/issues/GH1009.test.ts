import {
  Collection,
  Type,
  Entity,
  EntityProperty,
  ManyToOne,
  MikroORM,
  OneToMany,
  Platform,
  PrimaryKey,
  Property,
} from '@mikro-orm/sqlite';

export class PlainDateTimeType extends Type<{ date: string } | null, string | null> {

  override convertToDatabaseValue(value: { date: string } | null): string | null {
    console.log('convertToDatabaseValue', { value });
    return value ? value.date : value;
  }

  override convertToJSValue(value: string | null): { date: string } | null {
    console.log('convertToJSValue', { value });
    if (value == null) {
      return value;
    }

    return { date: value };
  }

  override getColumnType(prop: EntityProperty, platform: Platform): string {
    return platform.getDateTimeTypeDeclarationSQL({ length: prop.length });
  }

}

@Entity({ tableName: 'brands' })
export class Brand {

  @PrimaryKey()
  id!: number;

  @Property({ type: PlainDateTimeType })
  created = new Date().toISOString();

  @OneToMany({ entity: () => BrandSiteRestriction, mappedBy: 'brand' })
  brandSiteRestrictions = new Collection<BrandSiteRestriction>(this);

}

@Entity({ tableName: 'brand_site_restrictions' })
export class BrandSiteRestriction {

  @PrimaryKey()
  id!: number;

  @ManyToOne({ entity: () => Site })
  site!: any;

  @ManyToOne({ entity: () => Brand })
  brand!: Brand;

}

@Entity({ tableName: 'placements' })
export class Placement {

  @PrimaryKey()
  id!: number;

  @ManyToOne({ entity: () => Publisher, nullable: true })
  publisher?: any;

  @ManyToOne({ entity: () => Site })
  site!: any;

}

@Entity({ tableName: 'publishers' })
export class Publisher {

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

  let orm: MikroORM;

  beforeAll(async () => {
    orm = MikroORM.initSync({
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
    brand.created = '2020-01-02';
    await orm.em.flush();
    orm.em.clear();

    const r = await orm.em.findOneOrFail(Brand, brand);
    console.log(r);
  });

});
