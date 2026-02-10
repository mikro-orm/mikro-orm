import { LoadStrategy, MikroORM, wrap } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
export class Image {
  @PrimaryKey()
  id!: number;

  @OneToOne(() => Customer)
  customer!: any;
}

@Entity()
export class Product {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Image, {
    strategy: LoadStrategy.JOINED,
    eager: true,
    nullable: true,
  })
  image?: Image;

  @OneToOne(() => Customer)
  customer!: any;
}

@Entity()
export class Comment {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @OneToOne(() => Customer)
  customer!: any;
}

@Entity()
export class Customer {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToOne(() => Product, product => product.customer, { eager: true })
  product!: Product;

  @OneToOne(() => Comment, comment => comment.customer, { eager: true })
  comment!: Comment;
}

describe('GH issue 2777', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Customer, Comment, Product, Image],
      dbName: ':memory:',
    });
    await orm.schema.create();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`GH issue 2777`, async () => {
    const c = new Customer();
    c.comment = new Comment();
    c.comment.title = 'c';
    c.comment.customer = c;
    c.product = new Product();
    c.product.title = 't';
    c.product.image = new Image();
    c.product.customer = c;
    c.product.image.customer = c;
    c.name = 'f';
    await orm.em.fork().persist(c).flush();
    const ret = await orm.em.find(Customer, {});
    expect(ret[0]).toBe(ret[0].product.image!.customer);
    expect(wrap(ret[0].product).isInitialized()).toBe(true);
    expect(wrap(ret[0].product.image!).isInitialized()).toBe(true);
    expect(wrap(ret[0].product.image!.customer).isInitialized()).toBe(true);
  });
});
