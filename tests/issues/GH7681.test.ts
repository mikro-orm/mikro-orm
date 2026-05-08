import 'reflect-metadata';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { Collection, MikroORM, type Rel } from '@mikro-orm/sqlite';

@Entity()
class Company {
  @PrimaryKey({ type: 'string' })
  id!: string;

  @Property()
  title!: string;

  @ManyToOne(() => User, { nullable: true })
  owner?: Rel<User> | null;

  @OneToMany(() => User, u => u.belongsTo)
  employees = new Collection<User>(this);
}

@Entity()
class User {
  @PrimaryKey({ type: 'string' })
  id!: string;

  @Property()
  name!: string;

  @ManyToOne(() => Company, { nullable: true })
  belongsTo?: Rel<Company> | null;

  @ManyToOne(() => Company)
  primaryCompany!: Rel<Company>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Company, User],
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.refresh();

  const placeholder = orm.em.create(Company, { id: 'placeholder', title: 'Placeholder' });
  await orm.em.flush();
  const owner = orm.em.create(User, { id: 'owner-1', name: 'Owner', primaryCompany: placeholder });
  const otherOwner = orm.em.create(User, {
    id: 'owner-2',
    name: 'Other Owner',
    primaryCompany: placeholder,
  });
  const matchingCompany = orm.em.create(Company, { id: 'matching', title: 'Matching', owner });
  const otherCompany = orm.em.create(Company, { id: 'other', title: 'Other', owner: otherOwner });
  orm.em.create(User, {
    id: 'emp-match',
    name: 'Matched Employee',
    belongsTo: matchingCompany,
    primaryCompany: matchingCompany,
  });
  orm.em.create(User, {
    id: 'emp-other',
    name: 'Other Employee',
    belongsTo: otherCompany,
    primaryCompany: otherCompany,
  });
  orm.em.create(Company, { id: 'company-1', title: 'C1', owner });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

test('GH #7681: leftJoinAndSelect with relation-traversing ON cond produces valid SQL', async () => {
  const qb = orm.em
    .createQueryBuilder(Company, 'c0')
    .select('*')
    .where({ id: { $in: ['matching', 'other'] } })
    .leftJoinAndSelect('employees', 'emp0', { belongsTo: { owner: 'owner-1' } })
    .orderBy({ id: 'asc' });

  expect(qb.getQuery()).toBe(
    'select `c0`.*, `emp0`.`id` as `emp0__id`, `emp0`.`name` as `emp0__name`, `emp0`.`belongs_to_id` as `emp0__belongs_to_id`, `emp0`.`primary_company_id` as `emp0__primary_company_id` ' +
      'from `company` as `c0` ' +
      'left join (`user` as `emp0` left join `company` as `c1` on `emp0`.`belongs_to_id` = `c1`.`id`) ' +
      'on `c0`.`id` = `emp0`.`belongs_to_id` and `c1`.`owner_id` = ? ' +
      'where `c0`.`id` in (?, ?) ' +
      'order by `c0`.`id` asc',
  );

  const res = await qb.getResult();
  expect(res).toHaveLength(2);
  expect(res[0].id).toBe('matching');
  expect(res[0].employees.getItems().map(e => e.id)).toEqual(['emp-match']);
  expect(res[1].id).toBe('other');
  expect(res[1].employees.getItems()).toEqual([]);
});

test('GH #7681: non-nullable to-one cond traversal nests as inner join', async () => {
  const qb = orm.em
    .createQueryBuilder(Company, 'c0')
    .select('*')
    .where({ id: { $in: ['matching', 'other'] } })
    .leftJoinAndSelect('employees', 'emp0', { primaryCompany: { owner: 'owner-1' } })
    .orderBy({ id: 'asc' });

  expect(qb.getQuery()).toBe(
    'select `c0`.*, `emp0`.`id` as `emp0__id`, `emp0`.`name` as `emp0__name`, `emp0`.`belongs_to_id` as `emp0__belongs_to_id`, `emp0`.`primary_company_id` as `emp0__primary_company_id` ' +
      'from `company` as `c0` ' +
      'left join (`user` as `emp0` inner join `company` as `c1` on `emp0`.`primary_company_id` = `c1`.`id`) ' +
      'on `c0`.`id` = `emp0`.`belongs_to_id` and `c1`.`owner_id` = ? ' +
      'where `c0`.`id` in (?, ?) ' +
      'order by `c0`.`id` asc',
  );

  const res = await qb.getResult();
  expect(res).toHaveLength(2);
  expect(res[0].id).toBe('matching');
  expect(res[0].employees.getItems().map(e => e.id)).toEqual(['emp-match']);
  expect(res[1].id).toBe('other');
  expect(res[1].employees.getItems()).toEqual([]);
});
