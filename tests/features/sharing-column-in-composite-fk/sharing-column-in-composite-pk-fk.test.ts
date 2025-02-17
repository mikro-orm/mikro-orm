import {
  Collection,
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  PrimaryKeyProp,
  Property,
  ref,
  Ref,
  Rel,
  SimpleLogger,
} from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import { mockLogger } from '../../helpers.js';

@Entity()
class Order {

  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @ManyToMany({
    entity: () => Product,
    pivotEntity: () => OrderItem,
    joinColumns: ['order_id', 'organization_id'],
    inverseJoinColumns: ['product_id', 'organization_id'],
  })
  products = new Collection<Product>(this);

  @ManyToOne({
    entity: () => Organization,
    ref: true,
    primary: true,
  })
  organization!: Ref<Organization>;

  @Property()
  number!: number;

}

@Entity()
class OrderItem {

  @ManyToOne({ entity: () => Order, primary: true, joinColumns: ['order_id', 'organization_id'] })
  order!: Rel<Order>;

  @ManyToOne({ entity: () => Product, primary: true, joinColumns: ['product_id', 'organization_id'] })
  product!: Rel<Product>;

  @Property({ default: 1 })
  amount!: number;

  @ManyToOne({
    entity: () => Organization,
    ref: true,
    primary: true,
  })
  organization!: Ref<Organization>;

}

@Entity()
class Organization {

  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ length: 255 })
  name!: string;

}

@Entity()
class Product {

  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @ManyToOne({
    entity: () => Organization,
    ref: true,
    primary: true,
  })
  organization!: Ref<Organization>;

  @ManyToMany({ entity: () => Order, mappedBy: o => o.products })
  orders = new Collection<Order>(this);

  @OneToMany({
    entity: () => ProductInfo,
    mappedBy: 'product',
  })
  infos = new Collection<ProductInfo>(this);

}

@Entity()
class ProductInfo {

  [PrimaryKeyProp]?: ['id', 'organization'];

  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ length: 255, nullable: true })
  description?: string;

  @ManyToOne({
    entity: () => Organization,
    ref: true,
    primary: true,
  })
  organization!: Ref<Organization>;

  @ManyToOne({
    entity: () => Product,
    ref: true,
    joinColumns: ['product_id', 'organization_id'],
  })
  product!: Ref<Product>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Product],
    dbName: 'sharing_col_in_composite_pk_fk',
    loggerFactory: SimpleLogger.create,
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close();
});

beforeEach(async () => {
  await orm.schema.clearDatabase();
});

test('shared column as composite PK and FK in M:1', async () => {
  const organization = orm.em.create(Organization, {
    id: 'a900a4da-c464-4bd4-88a3-e41e1d33dc2e',
    name: 'Tenant 1',
  });

  orm.em.create(Product, {
    id: 'd09f1159-c5b0-4336-bfed-2543b5422ba7',
    organization,
    infos: [
      {
        id: 'bb9efb3e-7c23-421c-9ae2-9d989630159a',
        description: 'test',
        organization,
      },
    ],
  });

  const mock = mockLogger(orm);
  await orm.em.flush();

  expect(mock.mock.calls).toEqual([
    ['[query] begin'],
    [`[query] insert into "organization" ("id", "name") values ('a900a4da-c464-4bd4-88a3-e41e1d33dc2e', 'Tenant 1')`],
    [`[query] insert into "product" ("id", "organization_id") values ('d09f1159-c5b0-4336-bfed-2543b5422ba7', 'a900a4da-c464-4bd4-88a3-e41e1d33dc2e')`],
    [`[query] insert into "product_info" ("id", "organization_id", "description", "product_id") values ('bb9efb3e-7c23-421c-9ae2-9d989630159a', 'a900a4da-c464-4bd4-88a3-e41e1d33dc2e', 'test', 'd09f1159-c5b0-4336-bfed-2543b5422ba7')`],
    ['[query] commit'],
  ]);

  await orm.em.clear();
  mock.mockReset();

  const info = await orm.em.findOneOrFail(ProductInfo, {
    id: 'bb9efb3e-7c23-421c-9ae2-9d989630159a',
    organization,
  });
  info.description = 'new 123';
  await orm.em.flush();

  expect(mock.mock.calls).toEqual([
    [`[query] select "p0".* from "product_info" as "p0" where "p0"."id" = 'bb9efb3e-7c23-421c-9ae2-9d989630159a' and "p0"."organization_id" = 'a900a4da-c464-4bd4-88a3-e41e1d33dc2e' limit 1`],
    ['[query] begin'],
    [`[query] update "product_info" set "description" = 'new 123' where "id" = 'bb9efb3e-7c23-421c-9ae2-9d989630159a' and "organization_id" = 'a900a4da-c464-4bd4-88a3-e41e1d33dc2e'`],
    ['[query] commit'],
  ]);
});

test('shared column as composite PK and FK in M:N', async () => {
  const organization = orm.em.create(Organization, {
    id: 'a900a4da-c464-4bd4-88a3-e41e1d33dc2e',
    name: 'Tenant 1',
  });

  orm.em.create(Order, {
    id: 'd09f1159-c5b0-4336-bfed-2543b5422ba7',
    organization,
    products: [
      {
        id: 'bb9efb3e-7c23-421c-9ae2-9d989630159a',
        organization,
      },
    ],
    number: 123,
  });

  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock.mock.calls).toEqual([
    ['[query] begin'],
    [`[query] insert into "organization" ("id", "name") values ('a900a4da-c464-4bd4-88a3-e41e1d33dc2e', 'Tenant 1')`],
    [`[query] insert into "order" ("id", "organization_id", "number") values ('d09f1159-c5b0-4336-bfed-2543b5422ba7', 'a900a4da-c464-4bd4-88a3-e41e1d33dc2e', 123)`],
    [`[query] insert into "product" ("id", "organization_id") values ('bb9efb3e-7c23-421c-9ae2-9d989630159a', 'a900a4da-c464-4bd4-88a3-e41e1d33dc2e')`],
    [`[query] insert into "order_item" ("product_id", "organization_id", "order_id") values ('bb9efb3e-7c23-421c-9ae2-9d989630159a', 'a900a4da-c464-4bd4-88a3-e41e1d33dc2e', 'd09f1159-c5b0-4336-bfed-2543b5422ba7') returning "amount"`],
    ['[query] commit'],
  ]);

  await orm.em.clear();
  mock.mockReset();

  const order = await orm.em.findOneOrFail(Order, { id: 'd09f1159-c5b0-4336-bfed-2543b5422ba7' }, {
    populate: ['products'],
  });
  const p = new Product();
  p.id = 'ffffffff-7c23-421c-9ae2-9d989630159a';
  p.organization = ref(organization);
  order.products.add(p);
  order.number = 321;
  await orm.em.flush();

  expect(mock.mock.calls).toEqual([
    [`[query] select "o0".*, "p1"."id" as "p1__id", "p1"."organization_id" as "p1__organization_id" from "order" as "o0" left join "order_item" as "o2" on "o0"."id" = "o2"."order_id" and "o0"."organization_id" = "o2"."organization_id" left join "product" as "p1" on "o2"."product_id" = "p1"."id" and "o2"."organization_id" = "p1"."organization_id" where "o0"."id" = 'd09f1159-c5b0-4336-bfed-2543b5422ba7'`],
    ['[query] begin'],
    [`[query] insert into "product" ("id", "organization_id") values ('ffffffff-7c23-421c-9ae2-9d989630159a', 'a900a4da-c464-4bd4-88a3-e41e1d33dc2e')`],
    [`[query] update "order" set "number" = 321 where "id" = 'd09f1159-c5b0-4336-bfed-2543b5422ba7' and "organization_id" = 'a900a4da-c464-4bd4-88a3-e41e1d33dc2e'`],
    [`[query] insert into "order_item" ("product_id", "organization_id", "order_id") values ('ffffffff-7c23-421c-9ae2-9d989630159a', 'a900a4da-c464-4bd4-88a3-e41e1d33dc2e', 'd09f1159-c5b0-4336-bfed-2543b5422ba7') returning "amount"`],
    ['[query] commit'],
  ]);
});
