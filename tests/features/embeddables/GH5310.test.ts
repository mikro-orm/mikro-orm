import { MikroORM } from '@mikro-orm/sqlite';

import { Embeddable, Embedded, Entity, Filter, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Entity()
class Instance {

  @PrimaryKey()
  id!: number;

  @Property()
  slug: string;

  constructor(slug: string) {
    this.slug = slug;
  }

}

@Filter({ name: 'instance', cond: args => ({ instance: { slug: args.slug } }), default: true })
class CommonEntity {

  @ManyToOne(() => Instance)
  instance: Instance;

  constructor(instance: Instance) {
    this.instance = instance;
  }

}

@Entity()
class Item extends CommonEntity {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  constructor(instance: Instance, name: string) {
    super(instance);
    this.name = name;
  }

}

@Embeddable()
class CartItem {

  @ManyToOne(() => Item)
  item: Item;

  @Property()
  quantity: number;

  constructor(item: Item, quantity: number) {
    this.item = item;
    this.quantity = quantity;
  }

}

@Entity()
class Cart extends CommonEntity {

  @PrimaryKey()
  id!: number;

  @Embedded(() => CartItem, { array: true, nullable: true })
  items: CartItem[];

  constructor(instance: Instance, items: CartItem[]) {
    super(instance);
    this.items = items;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Instance, Item, Cart],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('setFilterParams x findAll', async () => {
  orm.em.setFilterParams('instance', { slug: 'demo' });
  await orm.em.findAll(Cart);
});
