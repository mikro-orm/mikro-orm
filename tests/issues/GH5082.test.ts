import {
  Collection,
  Entity,
  ManyToMany,
  ManyToOne,
  MikroORM,
  PrimaryKey,
  Property,
  ref,
  Ref,
  wrap,
} from '@mikro-orm/libsql';

@Entity()
class Item {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  constructor(name: string) {
    this.name = name;
  }

}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property({ unique: true })
  email: string;

  @ManyToOne(() => Item, { ref: true, nullable: true })
  item?: Ref<Item>;

  @ManyToMany(() => Item)
  items = new Collection<Item>(this);

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User, Item],
  });
  await orm.schema.createSchema();
  await orm.em.insert(Item, { id: 1, name: 'item' });
});

afterAll(async () => {
  await orm.close(true);
});

test('load on not managed entity (GH #5082)', async () => {
  const u = new User('foo', 'foo@x.com');
  u.id = 123;
  u.item = ref(Item, 1);
  orm.em.persist(u);
  await u.items.load();
  await u.item.load();
  expect(wrap(u).isManaged()).toBe(false);
  await orm.em.flush();
  expect(wrap(u).isManaged()).toBe(true);
});
