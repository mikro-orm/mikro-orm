import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, Filter, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../bootstrap.js';

@Filter({ name: 'softDelete', cond: { deletedAt: null }, default: true })
@Entity({ inheritance: 'tpt' })
class Animal {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ nullable: true })
  deletedAt?: Date;
}

@Entity()
class Dog extends Animal {
  @Property()
  breed!: string;
}

@Entity()
class Puppy extends Dog {
  @Property()
  toy!: string;
}

@Entity()
class Tag {
  @PrimaryKey()
  id!: number;

  @Property()
  label!: string;

  @ManyToOne(() => Dog)
  dog!: Dog;

  @ManyToOne(() => Puppy, { nullable: true })
  puppy?: Puppy;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Animal, Dog, Puppy, Tag],
    dbName: ':memory:',
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.refresh();

  const dog = orm.em.create(Dog, { name: 'Rex', breed: 'labrador' });
  const other = orm.em.create(Dog, { name: 'Ace', breed: 'beagle' });
  const puppy = orm.em.create(Puppy, { name: 'Bit', breed: 'poodle', toy: 'ball' });
  await orm.em.flush();
  orm.em.create(Tag, { label: 'first', dog, puppy });
  orm.em.create(Tag, { label: 'second', dog: other });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

describe('base-owned columns through a relation to a TPT subtype', () => {
  test('where on a base-owned property joins the base table', async () => {
    const res = await orm.em.fork().find(Tag, { dog: { name: 'Rex' } }, { filters: false });
    expect(res.map(t => t.label)).toEqual(['first']);
  });

  test('orderBy on a base-owned property joins the base table', async () => {
    const asc = await orm.em.fork().find(Tag, {}, { orderBy: { dog: { name: 'asc' } }, filters: false });
    expect(asc.map(t => t.label)).toEqual(['second', 'first']);

    const desc = await orm.em.fork().find(Tag, {}, { orderBy: { dog: { name: 'desc' } }, filters: false });
    expect(desc.map(t => t.label)).toEqual(['first', 'second']);
  });

  test('count with a where on a base-owned property', async () => {
    expect(await orm.em.fork().count(Tag, { dog: { name: 'Rex' } }, { filters: false })).toBe(1);
  });

  test('$in on a base-owned property', async () => {
    const res = await orm.em.fork().find(Tag, { dog: { name: { $in: ['Rex', 'Ace'] } } }, { filters: false });
    expect(res.map(t => t.label).sort()).toEqual(['first', 'second']);
  });

  test('multi-level TPT reaches both the grandparent and the mid-level table', async () => {
    const em = orm.em.fork();
    expect(await em.find(Tag, { puppy: { name: 'Bit' } }, { filters: false })).toHaveLength(1);
    em.clear();
    expect(await em.find(Tag, { puppy: { breed: 'poodle' } }, { filters: false })).toHaveLength(1);
  });

  test('where on a subtype-owned property still works', async () => {
    const res = await orm.em.fork().find(Tag, { dog: { breed: 'labrador' } }, { filters: false });
    expect(res.map(t => t.label)).toEqual(['first']);
  });

  test('joinAndSelect with a where on a base-owned property', async () => {
    const res = await orm.em
      .fork()
      .createQueryBuilder(Tag, 't')
      .joinAndSelect('t.dog', 'd')
      .where({ 'd.name': 'Rex' })
      .getResultList();
    expect(res.map(t => [t.label, t.dog.name, t.dog.breed])).toEqual([['first', 'Rex', 'labrador']]);
  });

  test('reading the subtype directly by a base-owned property still works', async () => {
    const res = await orm.em.fork().find(Dog, { name: 'Rex' }, { filters: false });
    expect(res.map(d => d.breed)).toEqual(['labrador']);
  });
});

describe('filter conditions on base-owned columns through a relation to a TPT subtype', () => {
  test('a filter cond on a base-owned column does not forward-reference the base join', async () => {
    const mock = mockLogger(orm);
    const res = await orm.em.fork().find(Tag, {});
    expect(res).toHaveLength(2);
    expect(mock.mock.calls[0][0]).toMatch(
      'from `tag` as `t0` ' +
        'inner join (`dog` as `d1` inner join `animal` as `a2` on `d1`.`id` = `a2`.`id`) ' +
        'on `t0`.`dog_id` = `d1`.`id` and `a2`.`deleted_at` is null',
    );
  });

  test('the filter is actually applied to rows of the subtype', async () => {
    const em = orm.em.fork();
    const dog = await em.findOneOrFail(Dog, { name: 'Rex' });
    dog.deletedAt = new Date();
    await em.flush();
    em.clear();

    expect((await em.find(Tag, {})).map(t => t.label)).toEqual(['second']);

    const back = await em.findOneOrFail(Dog, { name: 'Rex' }, { filters: false });
    back.deletedAt = undefined;
    await em.flush();
  });
});
