import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, PrimaryKeyType } from '@mikro-orm/core';
import { AbstractSqlDriver } from '@mikro-orm/sqlite';

@Entity()
export class Category {

  constructor(id: number) {
    this.id = id;
  }

  @PrimaryKey()
  id!: number;

}

@Entity()
export class Site {

  constructor(id: number) {
    this.id = id;
  }

  @PrimaryKey()
  id!: number;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @OneToMany({ entity: () => SiteCategory, mappedBy: 'site', orphanRemoval: true })
  siteCategories = new Collection<SiteCategory>(this);

}

@Entity()
export class SiteCategory {

  constructor(site: Site, category: Category) {
    this.site = site;
    this.category = category;
  }

  @ManyToOne({ entity: () => Site, primary: true })
  site!: Site;

  @ManyToOne({ entity: () => Category, primary: true })
  category!: Category;

  [PrimaryKeyType]: [number, number];

}

describe('GH #1914', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init<AbstractSqlDriver>({
      entities: [Site, Category, SiteCategory],
      dbName: `:memory:`,
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  beforeEach(async () => {
    await orm.em.nativeDelete(SiteCategory, {});
    await orm.em.nativeDelete(Category, {});
    await orm.em.nativeDelete(Site, {});

    const c1 = new Category(1);
    const c2 = new Category(2);
    const c3 = new Category(3);
    const c4 = new Category(4);

    const s1 = new Site(1);
    s1.siteCategories.add(new SiteCategory(s1, c1), new SiteCategory(s1, c2));

    await orm.em.persistAndFlush([c1, c2, c3, c4, s1]);
    orm.em.clear();
  });

  it('should handle remove and add in the same transaction', async () => {
    const c2 = orm.em.getReference(Category, 2);
    const c3 = orm.em.getReference(Category, 3);
    const s = await orm.em.findOneOrFail(Site, 1, { populate: ['siteCategories'] });
    const sc2 = await orm.em.findOneOrFail(SiteCategory, { site: s, category: c2 });

    s.siteCategories.remove(sc2);
    s.siteCategories.add(new SiteCategory(s, c3));

    await orm.em.flush();

    orm.em.clear();
    const s2 = await orm.em.findOneOrFail(Site, 1, { populate: ['siteCategories'] });
    expect(s2.siteCategories.count()).toEqual(2);
  });

  it('should handle remove composite entity directly', async () => {
    const c2 = orm.em.getReference(Category, 2);
    const s = await orm.em.findOneOrFail(Site, 1, { populate: ['siteCategories'] });
    const sc2 = await orm.em.findOneOrFail(SiteCategory, { site: s, category: c2 });
    expect(s.siteCategories.count()).toEqual(2);

    orm.em.remove(sc2);
    await orm.em.flush();

    orm.em.clear();
    const s2 = await orm.em.findOneOrFail(Site, 1, { populate: ['siteCategories'] });
    expect(s2.siteCategories.count()).toEqual(1);
  });

  it('should allow me to reset the collection', async () => {
    const c2 = orm.em.getReference(Category, 2);
    const c3 = orm.em.getReference(Category, 3);
    const s = await orm.em.findOneOrFail(Site, 1, { populate: ['siteCategories'] });

    s.siteCategories.removeAll();
    s.siteCategories.add(new SiteCategory(s, c2), new SiteCategory(s, c3));

    await orm.em.flush();

    orm.em.clear();
    const s2 = await orm.em.findOneOrFail(Site, 1, { populate: ['siteCategories'] });
    expect(s2.siteCategories.count()).toEqual(2);
  });
});
