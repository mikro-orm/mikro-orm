import { ChangeSetType, UnitOfWork } from '@mikro-orm/core';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider, Unique } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class Item {
  @PrimaryKey()
  id!: number;

  @Property({ unique: true })
  name!: string;
}

@Entity()
@Unique({ properties: ['source', 'target'] })
class Link {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Item)
  source!: Item;

  @ManyToOne(() => Item)
  target!: Item;
}

let orm: MikroORM;
let types: ChangeSetType[][] = [];

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Item, Link],
    dbName: ':memory:',
    subscribers: [
      {
        onFlush: args => {
          types.push(args.uow.getChangeSets().map(cs => cs.type));
        },
      },
    ],
  });
  await orm.schema.create();
});

beforeEach(async () => {
  await orm.schema.clear();
  const items = Array.from({ length: 12 }, (_, i) => orm.em.create(Item, { id: i + 1, name: `item ${i + 1}` }));
  for (let i = 0; i < 10; i++) {
    orm.em.create(Link, { id: i + 1, source: items[i], target: items[i + 1] });
  }
  await orm.em.flush();
  orm.em.clear();
  types = [];
});

afterAll(async () => {
  await orm.close(true);
});

function count(flushTypes: ChangeSetType[], type: ChangeSetType) {
  return flushTypes.filter(t => t === type).length;
}

test('removed rows whose unique values an insert reuses are deleted early', async () => {
  const links = await orm.em.find(Link, {}, { orderBy: { id: 'asc' } });

  // recreate the first 6 links under new primary keys, drop the other 4
  links.forEach(link => orm.em.remove(link));
  links.slice(0, 6).forEach((link, i) => {
    orm.em.create(Link, { id: 100 + i, source: link.source, target: link.target });
  });
  await orm.em.flush();

  expect(count(types[0], ChangeSetType.DELETE_EARLY)).toBe(6);
  expect(count(types[0], ChangeSetType.DELETE)).toBe(4);
  expect(count(types[0], ChangeSetType.CREATE)).toBe(6);
  expect(await orm.em.fork().count(Link)).toBe(6);
});

test('single and compound unique values are matched in the same flush', async () => {
  const item = await orm.em.findOneOrFail(Item, 12);
  const link = await orm.em.findOneOrFail(Link, 10);

  // the item (no links point at it) comes back under a new primary key with its unique name,
  // the link is replaced by an unrelated one
  orm.em.remove(link);
  orm.em.remove(item);
  orm.em.create(Item, { id: 13, name: 'item 12' });
  orm.em.create(Link, { id: 200, source: 1, target: 3 });
  await orm.em.flush();

  expect(count(types[0], ChangeSetType.DELETE_EARLY)).toBe(1);
  expect(count(types[0], ChangeSetType.DELETE)).toBe(1);
  expect(await orm.em.fork().count(Item, { name: 'item 12' })).toBe(1);
});

test('each removed row is matched without scanning the inserts again', async () => {
  const expand = vi.spyOn(UnitOfWork.prototype as any, 'expandUniqueProps');
  const links = await orm.em.find(Link, {});

  links.forEach(link => orm.em.remove(link));
  links.forEach((link, i) => {
    orm.em.create(Link, { id: 300 + i, source: link.source, target: link.target });
  });
  await orm.em.flush();

  // once per removed row and once per insert, instead of once per removed row and insert pair
  expect(expand).toHaveBeenCalledTimes(links.length * 2);
  expect(count(types[0], ChangeSetType.DELETE_EARLY)).toBe(links.length);
  expand.mockRestore();
});
