import { BigIntType, Collection, EntitySchema, Ref, sql } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';

class ProductEntity {
  readonly id!: number;
  readonly name!: string;

  constructor(props: { name: string; id?: number }) {
    Object.assign(this, props);
  }
}

class Company {
  readonly id!: number;
  readonly name!: string;
  readonly products = new Collection<ProductEntity>(this);

  constructor(props: { name: string; id?: number }) {
    Object.assign(this, props);
  }
}

class CompanyProduct {
  readonly id!: number;
  readonly product!: Ref<ProductEntity>;
  readonly company!: Ref<Company>;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;
}

const productSchema = new EntitySchema({
  class: ProductEntity,
  tableName: 'product',
  properties: {
    id: {
      type: BigIntType,
      primary: true,
    },
    name: {
      type: String,
    },
  },
});

const companySchema = new EntitySchema({
  class: Company,
  tableName: 'company',
  properties: {
    id: {
      type: BigIntType,
      primary: true,
    },
    name: {
      type: String,
    },
    products: {
      kind: 'm:n',
      entity: () => ProductEntity,
      pivotEntity: () => CompanyProduct,
      fixedOrder: true,
    },
  },
});

const companyProductsSchema = new EntitySchema({
  class: CompanyProduct,
  uniques: [{ name: 'uniqueCompanyProduct', properties: ['company', 'product'] }],
  properties: {
    id: {
      type: BigIntType,
      autoincrement: true,
      primary: true,
    },
    product: {
      kind: 'm:1',
      entity: () => ProductEntity,
    },
    company: {
      kind: 'm:1',
      entity: () => Company,
    },
    createdAt: {
      type: 'timestamp',
      onCreate: () => new Date(),
      default: sql.now(),
    },
    updatedAt: {
      type: 'timestamp',
      onUpdate: () => new Date(),
      default: sql.now(),
    },
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    schema: 'test',
    dbName: '4988',
    entities: [Company, ProductEntity, CompanyProduct],
  });

  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close();
});

test('creates a company with products', async () => {
  const company = new Company({
    name: 'Acme',
  });
  await orm.em.persist(company).flush();

  const product = new ProductEntity({ name: 'ProductA' });
  company.products.add(product);
  await orm.em.flush();

  expect(company.products).toHaveLength(1);
});
