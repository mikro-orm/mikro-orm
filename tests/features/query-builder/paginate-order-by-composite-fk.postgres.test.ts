import { Collection, type Dictionary, MikroORM } from '@mikro-orm/postgresql';
import { Entity, ManyToOne, OneToMany, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Tag {
  @PrimaryKey()
  id!: number;
}

@Entity()
class Pivot {
  @ManyToOne({ entity: () => Tag, primary: true })
  a!: Tag;

  @ManyToOne({ entity: () => Tag, primary: true })
  b!: Tag;
}

@Entity()
class Item {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Pivot)
  pivot!: Pivot;

  @OneToMany(() => Note, n => n.item)
  notes = new Collection<Note>(this);
}

@Entity()
class Note {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Item)
  item!: Item;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Tag, Pivot, Item, Note],
    dbName: 'mikro_orm_paginate_order_by_composite_fk',
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.refresh();
  const em = orm.em.fork();
  const t1 = em.create(Tag, { id: 1 });
  const t2 = em.create(Tag, { id: 2 });
  // both pivots share the first column, so ordering by it alone is ambiguous
  const i1 = em.create(Item, { id: 1, pivot: em.create(Pivot, { a: t1, b: t2 }) });
  const i2 = em.create(Item, { id: 2, pivot: em.create(Pivot, { a: t1, b: t1 }) });
  em.create(Note, { id: 1, item: i1 });
  em.create(Note, { id: 2, item: i2 });
  await em.flush();
});

afterAll(() => orm.close(true));

async function paginated(orderBy: Dictionary) {
  const items = await orm.em
    .fork()
    .createQueryBuilder(Item, 'i')
    .leftJoinAndSelect('i.notes', 'n')
    .orderBy(orderBy)
    .limit(1)
    .getResultList();
  return items.map(i => i.id);
}

test('paginated query with to-many join ordered by a composite FK', async () => {
  await expect(paginated({ pivot: 'asc' })).resolves.toEqual([2]);
  await expect(paginated({ pivot: 'desc' })).resolves.toEqual([1]);
  await expect(paginated({ 'i.pivot': 'asc' })).resolves.toEqual([2]);
  await expect(paginated({ 'i.pivot': 'desc' })).resolves.toEqual([1]);
});

test('order by an alias-prefixed composite FK', async () => {
  const qb = orm.em.createQueryBuilder(Item, 'i').orderBy({ 'i.pivot': 'desc' });
  expect(qb.getFormattedQuery()).toBe(
    'select "i".* from "item" as "i" order by "i"."pivot_a_id" desc, "i"."pivot_b_id" desc',
  );
  const items = await qb.getResultList();
  expect(items.map(i => i.id)).toEqual([1, 2]);
});
