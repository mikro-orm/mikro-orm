import { MikroORM } from '@mikro-orm/mssql';
import { Entity, ManyToOne, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Tag {
  @PrimaryKey()
  id!: number;
}

@Entity()
class Pivot {
  @ManyToOne({ entity: () => Tag, primary: true, deleteRule: 'no action', updateRule: 'no action' })
  a!: Tag;

  @ManyToOne({ entity: () => Tag, primary: true, deleteRule: 'no action', updateRule: 'no action' })
  b!: Tag;
}

@Entity()
class Item {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Pivot)
  pivot!: Pivot;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Tag, Pivot, Item],
    dbName: 'mikro_orm_composite_pk_in_nin',
    password: 'Root.Root',
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.refresh();
  const em = orm.em.fork();
  const t1 = em.create(Tag, { id: 1 });
  const t2 = em.create(Tag, { id: 2 });
  em.create(Item, { id: 1, pivot: em.create(Pivot, { a: t1, b: t2 }) });
  em.create(Item, { id: 2, pivot: em.create(Pivot, { a: t2, b: t1 }) });
  await em.flush();
});

afterAll(() => orm.close(true));

async function ids(where: object) {
  const items = await orm.em.fork().find(Item, where, { orderBy: { id: 'asc' } });
  return items.map(i => i.id);
}

test('empty $in on a composite FK matches nothing', async () => {
  await expect(ids({ pivot: { $in: [] } })).resolves.toEqual([]);
});

test('empty $nin on a composite FK matches everything', async () => {
  await expect(ids({ pivot: { $nin: [] } })).resolves.toEqual([1, 2]);
});

test('$nin with tuples on a composite FK excludes them', async () => {
  await expect(ids({ pivot: { $nin: [[1, 2]] } })).resolves.toEqual([2]);
});
