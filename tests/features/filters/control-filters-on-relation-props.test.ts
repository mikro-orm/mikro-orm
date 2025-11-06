import {
  Collection,
  Entity,
  Filter,
  ManyToMany,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  Property,
  Ref,
} from '@mikro-orm/sqlite';

@Entity()
@Filter({
  name: 'isActive',
  cond: args => args?.active ? { active: true } : { active: false },
  args: false,
  default: false,
})
class BenefitDetail {

  @PrimaryKey()
  id!: number;

  @Property()
  description!: string;

  @ManyToOne(() => Benefit, { ref: true, filters: { status: { status: 'A' } } })
  benefit!: Ref<Benefit>;

  @Property()
  active: boolean = false;

}

@Filter({
  name: 'status',
  cond: args => args ? { benefitStatus: args.status } : undefined,
  args: false,
  default: false,
})
class BaseBenefit {

  @PrimaryKey()
  id!: number;

  @Property()
  benefitStatus!: string;

}

@Entity()
class Benefit extends BaseBenefit {

  @Property({ nullable: true })
  name?: string;

  @OneToMany(() => BenefitDetail, d => d.benefit, { filters: { isActive: { active: true } } })
  details = new Collection<BenefitDetail>(this);

}

@Entity()
class Employee {

  @PrimaryKey()
  id!: number;

  @ManyToMany({ entity: () => Benefit, filters: ['status'] })
  benefits = new Collection<Benefit>(this);

  @ManyToMany({ entity: () => Benefit, filters: { status: { status: 'A' } } })
  activeBenefits = new Collection<Benefit>(this);

}

describe('control filters on relation props [sqlite]', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Employee, Benefit],
      dbName: ':memory:',
    });
    await orm.schema.refreshDatabase();
    await createEntities();
  });

  beforeEach(async () => {
    orm.em.clear();
  });

  afterAll(() => orm.close(true));

  async function createEntities() {
    const benefit = new Benefit();
    benefit.name = 'b1';
    benefit.benefitStatus = 'IA';
    const benefit2 = new Benefit();
    benefit2.name = 'b2';
    benefit2.benefitStatus = 'A';
    orm.em.assign(benefit, {
      details: [
        { description: 'detail 11', active: true },
        { description: 'detail 12', active: false },
        { description: 'detail 13', active: true },
      ],
    });
    orm.em.assign(benefit2, {
      details: [
        { description: 'detail 21', active: false },
        { description: 'detail 22', active: true },
        { description: 'detail 23', active: false },
      ],
    });
    const employee = new Employee();
    employee.id = 1;
    employee.benefits.add(benefit, benefit2);
    employee.activeBenefits.add(benefit, benefit2);
    await orm.em.persistAndFlush(employee);
    orm.em.clear();

    return { employee };
  }

  test('prop.filters can enable specific filters by name', async () => {
    // The Employee.benefits relation has filters: ['status'] which enables the status filter
    // but doesn't provide args, so it should use filterParams from context or throw if required
    const e1 = await orm.em.findOneOrFail(Employee, 1, {
      populate: ['benefits'],
      filters: { status: { status: 'A' } },
    });

    // Should load only active benefits because status filter is enabled and args provided at query level
    expect(e1.benefits).toHaveLength(1);
    expect(e1.benefits[0].benefitStatus).toBe('A');
  });

  test('prop.filters can provide arguments for filters', async () => {
    // The Employee.activeBenefits relation has filters: { status: { status: 'A' } }
    // which both enables the filter AND provides the arguments
    const e1 = await orm.em.findOneOrFail(Employee, 1, {
      populate: ['activeBenefits'],
    });

    // Should apply the status filter with status: 'A' from prop.filters
    expect(e1.activeBenefits).toHaveLength(1);
    expect(e1.activeBenefits[0].benefitStatus).toBe('A');
  });

  test('prop.filters with arguments on m:1 relation', async () => {
    // BenefitDetail.benefit has filters: { status: { status: 'A' } }
    const details = await orm.em.findAll(BenefitDetail);

    // Should only find details that have benefit with status 'A'
    expect(details).toHaveLength(3); // Only details from benefit2 (status 'A')

    // All details should be from the benefit with status 'A'
    for (const detail of details) {
      await expect(detail.benefit.load()).resolves.toMatchObject({
        benefitStatus: 'A',
      });
    }
  });

  test('prop.filters with arguments on 1:m relation', async () => {
    // Benefit.details has filters: { isActive: { active: true } }
    const benefits = await orm.em.findAll(Benefit, {
      populate: ['details'],
    });

    expect(benefits).toHaveLength(2);
    // benefit1 has 2 active details, benefit2 has 1 active detail
    expect(benefits[0].details).toHaveLength(2);
    expect(benefits[0].details.getItems().every(d => d.active)).toBe(true);
    expect(benefits[1].details).toHaveLength(1);
    expect(benefits[1].details.getItems().every(d => d.active)).toBe(true);
  });

  test('Collection.load() respects prop.filters arguments', async () => {
    const benefits = await orm.em.findAll(Benefit, { filters: false });

    expect(benefits).toHaveLength(2);
    expect(benefits[0].details.isInitialized()).toBe(false);

    // When loading the collection, it should apply the prop.filters
    await benefits[0].details.loadItems({ filters: { status: false } });
    expect(benefits[0].details).toHaveLength(2); // Only active details
    expect(benefits[0].details.getItems().every(d => d.active)).toBe(true);

    // Loading with filters: false should override prop.filters
    await benefits[1].details.loadItems({ filters: false });
    expect(benefits[1].details).toHaveLength(3); // All details
  });

  test('Ref.load() respects prop.filters arguments', async () => {
    const details = await orm.em.findAll(BenefitDetail, { filters: false });

    expect(details).toHaveLength(6);

    // Loading a benefit from a detail with status 'IA' should fail because of prop.filters
    const detailFromInactiveBenefit = details.find(d => d.benefit.id === 1)!;
    await detailFromInactiveBenefit.benefit.load();
    await expect(detailFromInactiveBenefit.benefit.load()).resolves.toBe(null);

    // Loading with filters: false should override prop.filters
    await expect(detailFromInactiveBenefit.benefit.load({ filters: false })).resolves.toMatchObject({
      id: 1,
      benefitStatus: 'IA',
    });

    // Loading a benefit from a detail with status 'A' should work
    const detailFromActiveBenefit = details.find(d => d.benefit.id === 2)!;
    await expect(detailFromActiveBenefit.benefit.load()).resolves.toMatchObject({
      id: 2,
      benefitStatus: 'A',
    });
  });

  test('query-level filters override prop.filters arguments', async () => {
    // Even though activeBenefits has filters: { status: { status: 'A' } }
    // we can override it at query level with different arguments
    const e1 = await orm.em.findOneOrFail(Employee, 1, {
      populate: ['activeBenefits'],
      filters: { status: { status: 'IA' } },
    });

    // Should use 'IA' from query-level filters, not 'A' from prop.filters
    expect(e1.activeBenefits).toHaveLength(1);
    expect(e1.activeBenefits[0].benefitStatus).toBe('IA');
  });

});
