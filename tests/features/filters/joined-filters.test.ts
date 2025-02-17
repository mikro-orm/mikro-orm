import { Entity, MikroORM, OneToOne, PrimaryKey, Property, Ref } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

@Entity()
class Item {

  @PrimaryKey()
  id!: number;

  @OneToOne(() => HouseDecorationSlot, {
    ref: true,
    mappedBy: 'houseDecoration',
    nullable: true,
    orphanRemoval: true,
  })
  houseDecorationSlot?: Ref<HouseDecorationSlot>;

  @Property({ nullable: true, index: true })
  deletedAt?: Date;

}

@Entity()
class HouseDecorationSlot {

  @PrimaryKey()
  id!: number;

  @OneToOne(() => Item, {
    ref: true,
    deleteRule: 'cascade',
  })
  houseDecoration!: Ref<Item>;

  @Property({ nullable: true, index: true })
  deletedAt?: Date;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Item, HouseDecorationSlot],
    dbName: ':memory:',
    filters: {
      deletedAt: {
        cond: { deletedAt: null },
        default: true,
      },
    },
  });
  await orm.schema.createSchema();

  orm.em.create(HouseDecorationSlot, {
    id: 1,
    houseDecoration: { id: 1 },
  });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('Does not log multiple queries', async () => {
  const mock = mockLogger(orm);
  const [foundItem] = await orm.em.fork().find(Item, 1, {
    filters: false,
  });
  expect(mock).toHaveBeenCalledTimes(1);

  expect(foundItem).toBeDefined();
  expect(foundItem?.houseDecorationSlot).toBeDefined();
});

test('Logs multiple queries', async () => {
  const mock = mockLogger(orm);
  const [foundItem] = await orm.em.fork().find(Item, { id: 1 });
  expect(mock).toHaveBeenCalledTimes(1);

  expect(foundItem).toBeDefined();
  expect(foundItem?.houseDecorationSlot).toBeDefined();
});
